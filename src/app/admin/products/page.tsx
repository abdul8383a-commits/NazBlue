import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import ProductListClient from "@/components/admin/ProductListClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name), product_variants(stock_quantity)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">Manage your product catalog, pricing, and variants.</p>
        </div>
        <Link 
          href="/admin/products/new"
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Link>
      </div>

      <ProductListClient initialProducts={products || []} />
    </div>
  );
}
