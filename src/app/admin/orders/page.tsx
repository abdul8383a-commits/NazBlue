import { createClient } from "@/lib/supabase/server";
import OrderListClient from "@/components/admin/OrderListClient";
import TestShiprocketConnection from "@/components/admin/TestShiprocketConnection";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, users(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
          <p className="text-sm text-gray-500 mt-1">View and manage customer orders.</p>
        </div>
        <TestShiprocketConnection />
      </div>

      <OrderListClient initialOrders={orders || []} />
    </div>
  );
}
