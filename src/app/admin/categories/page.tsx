import { createClient } from "@/lib/supabase/server";
import { AddCategoryButton, CategoryActions } from "@/components/admin/CategoryActions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  // Fetch categories and their related products to compute product count for safe deletion
  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(id)")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500">Manage store categories and assignments.</p>
        </div>
        <AddCategoryButton />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!categories || categories.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c) => {
                  const productCount = c.products?.length || 0;
                  return (
                    <tr key={c.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                        {c.id.substring(0,8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">
                        {c.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                        {productCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CategoryActions category={c} productCount={productCount} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
