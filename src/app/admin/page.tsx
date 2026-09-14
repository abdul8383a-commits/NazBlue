import { createClient } from "@/lib/supabase/server";
import { Package, ShoppingCart, DollarSign, AlertCircle } from "lucide-react";
import AdminChart from "@/components/admin/AdminChart";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch aggregates safely
  const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true });
  
  // Note: For total sales, in a real production app we'd sum this via an RPC or query, but doing it in memory is fine for small datasets
  const { data: salesData } = await supabase.from("orders").select("total_amount").in("status", ["processing", "shipped", "delivered"]);
  const { count: pendingOrders } = await supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending");
  
  const totalSales = salesData?.reduce((acc, order) => acc + order.total_amount, 0) || 0;

  // Fetch low stock items
  const { data: lowStock } = await supabase
    .from("product_variants")
    .select("stock_quantity, size, color, products(name)")
    .lt("stock_quantity", 5)
    .order("stock_quantity", { ascending: true })
    .limit(5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-primary rounded-full"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">${totalSales.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-full"><ShoppingCart className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{totalOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-700 rounded-full"><Package className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-900">{pendingOrders || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-700 rounded-full"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-gray-900">{lowStock?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Sales Overview (Last 7 Days)</h3>
          <div className="h-72 w-full">
            <AdminChart />
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Low Stock Items</h3>
          {(!lowStock || lowStock.length === 0) ? (
            <p className="text-gray-500 text-sm">All variants are well stocked.</p>
          ) : (
            <div className="space-y-4">
              {lowStock.map((item: any, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 truncate w-32 md:w-48">{item.products?.name}</p>
                    <p className="text-gray-500 text-xs mt-1">Size: {item.size} | Color: {item.color}</p>
                  </div>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold whitespace-nowrap">
                    {item.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
