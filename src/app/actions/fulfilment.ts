"use server";

import { createClient } from "@/lib/supabase/server";
import { checkServiceability, createShiprocketOrder, generateAWB, generateInvoice, generateShippingLabel, requestPickup } from "@/lib/shiprocket";
import { revalidatePath } from "next/cache";

async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Unauthorized: Admin access required.");
}

export async function sendOrderToShiprocket(orderId: string, packageDetails: { weight: number, length: number, width: number, height: number }) {
  const supabase = await createClient();
  await verifyAdmin(supabase);

  // 1. Fetch Order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*, product_variants(*, products(name, category_id)))")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found or database error." };
  }

  // 2. Idempotency & Concurrency Check
  if (order.shiprocket_order_id || order.shiprocket_status === 'creating') {
    return { success: false, error: "This order is already being sent or has been sent to Shiprocket." };
  }

  // 2.5 Lock the order optimistically
  const { data: lockData, error: lockError } = await supabase
    .from("orders")
    .update({ shiprocket_status: 'creating' })
    .eq("id", orderId)
    .is("shiprocket_order_id", null)
    .neq("shiprocket_status", 'creating')
    .select();

  if (lockError || !lockData || lockData.length === 0) {
    return { success: false, error: "Concurrency lock failed. Another process is handling this order." };
  }

  // 3. Pickup Location Validation
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION;
  if (!pickupLocation) {
    return { success: false, error: "No valid Shiprocket pickup address is configured on the server. Please configure SHIPROCKET_PICKUP_LOCATION." };
  }

  // 4. Validate Delivery Address
  let address = order.shipping_address;
  if (typeof address === 'string') {
    try { address = JSON.parse(address); } catch(e) { address = {}; }
  }

  if (!address.pincode || !address.firstName || !address.phone || !address.address || !address.city || !address.state) {
    return { success: false, error: "Order is missing critical shipping address fields (Pincode, Name, Phone, Address, City, State)." };
  }

  // 5. Check Serviceability (if required)
  // Skip serviceability hard block in mock, but handle generic cases
  try {
    const serviceability = await checkServiceability("110030", address.pincode, packageDetails.weight, order.payment_status === "paid" ? 0 : 1);
    if (!serviceability || !serviceability.available_courier_companies || serviceability.available_courier_companies.length === 0) {
       return { success: false, error: "Delivery pincode is currently not serviceable by any courier." };
    }
  } catch(err) {
    console.error("Serviceability warning:", err);
    // Depending on strictness, we could block here. We'll proceed in case of Shiprocket intermittent API issues.
  }

  // 6. Map to Shiprocket Request
  const items = order.order_items.map((item: any) => {
    const productName = item.product_variants?.products?.name || "Unknown Product";
    const sku = item.product_variants?.sku || `SKU-NA-${item.id.substring(0,8)}`;
    return {
      name: productName,
      sku: sku,
      units: item.quantity,
      selling_price: item.price_at_purchase,
    };
  });

  const srOrderDetails = {
    order_id: order.id,
    order_date: new Date(order.created_at).toISOString().split('T')[0],
    pickup_location: pickupLocation,
    billing_customer_name: address.firstName,
    billing_last_name: address.lastName || "",
    billing_address: address.address,
    billing_address_2: address.apartment || "",
    billing_city: address.city,
    billing_pincode: address.pincode,
    billing_state: address.state,
    billing_country: address.country || "India",
    billing_email: address.email || "no-email@example.com",
    billing_phone: address.phone,
    shipping_is_billing: true,
    order_items: items,
    payment_method: order.payment_status === "paid" ? "Prepaid" : "COD",
    sub_total: order.total_amount,
    length: packageDetails.length,
    breadth: packageDetails.width,
    height: packageDetails.height,
    weight: packageDetails.weight,
  };

  // 7. Call API
  try {
    const response = await createShiprocketOrder(srOrderDetails);
    
    // 8. Persist Response
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        shiprocket_order_id: response.order_id?.toString(),
        shiprocket_shipment_id: response.shipment_id?.toString(),
        shiprocket_status: response.status,
        package_weight: packageDetails.weight,
        package_length: packageDetails.length,
        package_width: packageDetails.width,
        package_height: packageDetails.height
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to persist shiprocket IDs. Data may be desynced.", updateError);
      return { success: false, error: "Shiprocket order created, but failed to save to database. Avoid retrying." };
    }

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: any) {
    // Unlock if API fails
    await supabase.from("orders").update({ shiprocket_status: null }).eq("id", orderId).eq("shiprocket_status", 'creating');
    return { success: false, error: err.message || "Failed to create Shiprocket Order." };
  }
}

export async function fetchCouriers(orderId: string) {
  const supabase = await createClient();
  await verifyAdmin(supabase);

  const { data: order } = await supabase.from("orders").select("shipping_address, package_weight, payment_status").eq("id", orderId).single();
  if (!order) return { success: false, error: "Order not found." };
  
  let address = order.shipping_address;
  if (typeof address === 'string') {
    try { address = JSON.parse(address); } catch(e) { address = {}; }
  }

  const weight = order.package_weight || 1;
  const isCod = order.payment_status === "paid" ? 0 : 1;
  const pickupPincode = "110030"; // Using merchant pincode fallback

  try {
    const data = await checkServiceability(pickupPincode, address.pincode, weight, isCod);
    if (!data || !data.available_courier_companies) {
      return { success: false, error: "No couriers available." };
    }
    return { success: true, couriers: data.available_courier_companies };
  } catch (err: any) {
    return { success: false, error: "Error fetching couriers." };
  }
}

export async function assignCourierAWB(orderId: string, courierId: string) {
  const supabase = await createClient();
  await verifyAdmin(supabase);

  const { data: order } = await supabase.from("orders").select("shiprocket_shipment_id, awb_code").eq("id", orderId).single();
  if (!order || !order.shiprocket_shipment_id) return { success: false, error: "Shipment ID not found on order." };
  if (order.awb_code) return { success: false, error: "AWB already assigned." };

  try {
    const response = await generateAWB(order.shiprocket_shipment_id, courierId);
    if (response.awb_assign_status === 1 && response.response?.data?.awb_code) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          awb_code: response.response.data.awb_code,
          courier_name: response.response.data.courier_name
        })
        .eq("id", orderId);
      
      if (updateError) return { success: false, error: "AWB assigned but failed to save to database." };
      
      revalidatePath(`/admin/orders/${orderId}`);
      return { success: true };
    } else {
      return { success: false, error: "Shiprocket did not return an AWB." };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function requestOrderPickup(orderId: string) {
  const supabase = await createClient();
  await verifyAdmin(supabase);

  const { data: order } = await supabase.from("orders").select("shiprocket_shipment_id, awb_code, pickup_scheduled").eq("id", orderId).single();
  if (!order || !order.shiprocket_shipment_id) return { success: false, error: "Shipment ID missing." };
  if (!order.awb_code) return { success: false, error: "Cannot schedule pickup before assigning AWB." };
  if (order.pickup_scheduled) return { success: false, error: "Pickup is already scheduled." };

  try {
    const response = await requestPickup(order.shiprocket_shipment_id);
    if (response.pickup_status === 1) {
       await supabase.from("orders").update({ pickup_scheduled: true }).eq("id", orderId);
       revalidatePath(`/admin/orders/${orderId}`);
       return { success: true };
    } else {
       return { success: false, error: "Shiprocket rejected pickup request." };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getOrderLabel(orderId: string) {
  const supabase = await createClient();
  await verifyAdmin(supabase);

  const { data: order } = await supabase.from("orders").select("shiprocket_shipment_id, awb_code").eq("id", orderId).single();
  if (!order || !order.shiprocket_shipment_id || !order.awb_code) return { success: false, error: "Shipment ID or AWB missing." };

  try {
    const response = await generateShippingLabel(order.shiprocket_shipment_id);
    if (response.label_created === 1 && response.label_url) {
      return { success: true, url: response.label_url };
    } else {
      return { success: false, error: "Shiprocket did not return a label." };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getOrderInvoice(orderId: string) {
  const supabase = await createClient();
  await verifyAdmin(supabase);

  const { data: order } = await supabase.from("orders").select("shiprocket_order_id").eq("id", orderId).single();
  if (!order || !order.shiprocket_order_id) return { success: false, error: "Shiprocket Order ID missing." };

  try {
    const response = await generateInvoice([order.shiprocket_order_id]);
    if (response.is_invoice_created && response.invoice_url) {
      return { success: true, url: response.invoice_url };
    } else {
      return { success: false, error: "Shiprocket did not return an invoice." };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function testShiprocketConnection() {
  const supabase = await createClient();
  await verifyAdmin(supabase);

  try {
    // 1. Force a real login attempt using raw fetch to avoid mock bypass in getShiprocketToken if currently in mock mode
    // The user wants to test the production credentials explicitly.
    const email = process.env.SHIPROCKET_API_EMAIL;
    const password = process.env.SHIPROCKET_API_PASSWORD;

    if (!email || !password || email.includes("placeholder")) {
      return { success: false, error: "Production credentials (SHIPROCKET_API_EMAIL, SHIPROCKET_API_PASSWORD) are missing or invalid in server environment." };
    }

    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!authRes.ok) {
       return { success: false, error: "Authentication failed. Invalid credentials or Shiprocket API is down." };
    }
    
    const authData = await authRes.json();
    if (!authData.token) {
       return { success: false, error: "Authentication succeeded but no token returned." };
    }

    // 2. Perform a safe, read-only serviceability check
    const serviceRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=110030&delivery_postcode=400001&weight=1&cod=0`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${authData.token}` },
      }
    );

    if (!serviceRes.ok) {
       return { success: true, message: "Authentication successful, but serviceability check failed (possibly invalid pickup pincode)." };
    }

    return { success: true, message: "Authentication and read-only Serviceability check passed successfully." };

  } catch (err: any) {
    return { success: false, error: "Connection error: " + err.message };
  }
}
