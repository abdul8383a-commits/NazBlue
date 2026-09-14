import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <button className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(!categories || categories.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                      {c.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">
                      {c.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium space-x-3">
                      <button className="text-primary hover:text-primary/80 p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors inline-flex items-center">
                        <Edit className="w-4 h-4"/>
                      </button>
                      <button className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded transition-colors inline-flex items-center">
                        <Trash2 className="w-4 h-4"/>
                      </button>
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
