import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { items, address, couponCode } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Recalculate total securely
    let subtotal = 0;
    for (const item of items) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity, products(base_price, discount_price)")
        .eq("id", item.product_variant_id)
        .single();
      
      if (!variant || variant.stock_quantity < item.quantity) {
        return NextResponse.json({ error: `Item out of stock: ${item.product_variant_id}` }, { status: 400 });
      }
      
      // Typecasting because Supabase relationships return as any in TS by default without generated types
      const productsData = variant.products as any;
      const price = productsData.discount_price || productsData.base_price;
      subtotal += price * item.quantity;
    }

    let discountAmount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();
      
      if (coupon && (!coupon.expiry_date || new Date(coupon.expiry_date) > new Date())) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = subtotal * (coupon.discount_value / 100);
        } else {
          discountAmount = coupon.discount_value;
        }
      }
    }

    const shipping = subtotal > 100 || items.length === 0 ? 0 : 10;
    const tax = (subtotal - discountAmount) * 0.08;
    const grandTotal = Math.max(0, subtotal - discountAmount + shipping + tax);

    // Create DB Order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: grandTotal,
        shipping_address: address,
        status: "pending",
        payment_status: "pending"
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error(orderError);
      return NextResponse.json({ error: "Failed to create order in DB" }, { status: 500 });
    }

    // Insert Order Items
    for (const item of items) {
      const price = (item.variant.product.discount_price || item.variant.product.base_price);
      await supabase.from("order_items").insert({
        order_id: order.id,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        price_at_purchase: price
      });
    }

    // Create Razorpay Order (amount in paise)
    const amountInPaise = Math.round(grandTotal * 100);
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${order.id}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return NextResponse.json({ 
      razorpayOrderId: razorpayOrder.id,
      dbOrderId: order.id,
      amount: amountInPaise,
      currency: "INR"
    });

  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
