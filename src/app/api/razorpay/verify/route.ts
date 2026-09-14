import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createShiprocketOrder } from "@/lib/shiprocket";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = await req.json();
    const supabase = await createClient();

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 1. Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ 
        payment_status: "paid", 
        payment_id: razorpay_payment_id,
        status: "processing"
      })
      .eq("id", dbOrderId)
      .select()
      .single();
      
    if (updateError || !updatedOrder) {
      console.error("Order update error:", updateError);
      return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
    }

    // 2. Decrement Stock
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*, product_variants(products(name), size, color)")
      .eq("order_id", dbOrderId);
      
    if (orderItems) {
      for (const item of orderItems) {
        await supabase.rpc('decrement_stock', { 
          variant_id: item.product_variant_id, 
          decrement_by: item.quantity 
        });
      }
    }

    // 3. Clear Cart
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    }

    console.log(`[EMAIL MOCK] Receipt sent: Order ${dbOrderId} confirmed for payment ${razorpay_payment_id}.`);

    // 4. Shiprocket Order Creation (Graceful Fallback)
    try {
      let parsedAddress;
      try {
        parsedAddress = JSON.parse(updatedOrder.shipping_address);
      } catch (e) {
        throw new Error("Invalid shipping address format");
      }

      const srItems = (orderItems || []).map((item: any) => ({
        name: `${item.product_variants.products.name} (${item.product_variants.size}, ${item.product_variants.color})`,
        sku: item.product_variant_id.substring(0, 8),
        units: item.quantity,
        selling_price: item.price_at_purchase,
        discount: 0,
        tax: 0,
        hsn: 441122
      }));

      const srPayload = {
        order_id: dbOrderId.substring(0, 15), // SR requires max 20 char order ID
        order_date: new Date().toISOString(),
        pickup_location: "Primary",
        billing_customer_name: parsedAddress.firstName,
        billing_last_name: parsedAddress.lastName,
        billing_address: parsedAddress.addressLine1,
        billing_city: parsedAddress.city,
        billing_pincode: parsedAddress.pincode,
        billing_state: parsedAddress.state,
        billing_country: "India",
        billing_email: parsedAddress.email,
        billing_phone: parsedAddress.phone,
        shipping_is_billing: true,
        order_items: srItems,
        payment_method: "Prepaid",
        sub_total: updatedOrder.total_amount,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 1
      };

      const srResponse = await createShiprocketOrder(srPayload);
      
      // Store shipment_id in shiprocket_order_id column for tracking
      await supabase
        .from("orders")
        .update({ 
          shiprocket_order_id: srResponse.shipment_id.toString()
        })
        .eq("id", dbOrderId);
        
      console.log(`Successfully created Shiprocket Shipment: ${srResponse.shipment_id}`);
      
    } catch (srError) {
      console.error("[ADMIN ALERT] Shiprocket Order Creation Failed for DB Order:", dbOrderId);
      console.error(srError);
      // We DO NOT throw here. The user paid successfully, so the frontend must succeed.
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
