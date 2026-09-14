import { NextResponse } from "next/server";
import { checkServiceability } from "@/lib/shiprocket";

export async function POST(req: Request) {
  try {
    const { pincode } = await req.json();

    if (!pincode) {
      return NextResponse.json({ error: "Pincode is required" }, { status: 400 });
    }

    const data = await checkServiceability(pincode);

    if (!data || !data.available_courier_companies || data.available_courier_companies.length === 0) {
      return NextResponse.json({ error: "Service not available for this pincode" }, { status: 404 });
    }

    // Find fastest courier
    const fastest = data.available_courier_companies.reduce((prev: any, curr: any) => {
      return (curr.estimated_delivery_days < prev.estimated_delivery_days) ? curr : prev;
    });

    return NextResponse.json({
      serviceable: true,
      estimated_delivery_date: fastest.etd,
      days: fastest.estimated_delivery_days
    });
  } catch (error: any) {
    console.error("Serviceability error:", error);
    return NextResponse.json({ error: "Failed to check serviceability" }, { status: 500 });
  }
}
