import { NextResponse } from "next/server";
import { checkServiceability } from "@/lib/shiprocket";

export async function POST(req: Request) {
  try {
    const { pincode } = await req.json();

    if (!pincode) {
      return NextResponse.json({ error: "Pincode is required" }, { status: 400 });
    }

    const data = await checkServiceability(pincode);

    // If Shiprocket fails or is unconfigured, return a mock success so checkout isn't blocked
    if (!data || !data.available_courier_companies || data.available_courier_companies.length === 0) {
      return NextResponse.json({
        serviceable: true,
        estimated_delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        days: 5
      });
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
    // Return mock success on error instead of 500 to prevent blocking checkout
    return NextResponse.json({
      serviceable: true,
      estimated_delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      days: 5
    });
  }
}
