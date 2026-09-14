import { NextResponse } from "next/server";
import { trackOrder } from "@/lib/shiprocket";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: order } = await supabase
      .from("orders")
      .select("shiprocket_order_id")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (!order || !order.shiprocket_order_id) {
      return NextResponse.json({ error: "Tracking not available for this order" }, { status: 404 });
    }

    const trackingData = await trackOrder(order.shiprocket_order_id);
    
    if (!trackingData || !trackingData.tracking_data) {
      return NextResponse.json({ error: "Failed to fetch tracking data from courier" }, { status: 500 });
    }

    return NextResponse.json(trackingData);
  } catch (error: any) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Failed to fetch tracking" }, { status: 500 });
  }
}
