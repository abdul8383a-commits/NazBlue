import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*");

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/products" className="p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm text-gray-600 hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
      </div>

      {(!categories || categories.length === 0) ? (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded border border-yellow-200 text-sm font-medium">
          You must create at least one category before adding a product.
          <div className="mt-2">
            <Link href="/admin/categories" className="underline font-bold hover:text-yellow-900">Go to Categories</Link>
          </div>
        </div>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
