import { createClient } from "@/lib/supabase/server";
import OrderAdminRow from "@/components/admin/OrderAdminRow";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!orders || orders.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <OrderAdminRow key={order.id} order={order} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
