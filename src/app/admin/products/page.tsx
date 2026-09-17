import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <Link 
          href="/admin/products/new"
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!products || products.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No products found. Add your first product to get started!
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded border">
                          {p.images && p.images[0] && (
                            <img src={p.images[0]} alt="" className="h-10 w-10 object-cover rounded" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-gray-500 text-xs">{p.gender}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {p.categories?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ₹{p.discount_price || p.base_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium space-x-3">
                      <Link href={`/admin/products/${p.id}/edit`} className="text-primary hover:text-primary/80 inline-flex items-center bg-blue-50 px-3 py-1 rounded">
                        <Edit className="w-3 h-3 mr-2"/> Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
