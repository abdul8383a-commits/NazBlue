import { createClient } from "@/lib/supabase/server";
import InventoryEditor from "@/components/admin/InventoryEditor";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const supabase = await createClient();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*, products(name, images)")
    .order("stock_quantity", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        <p className="text-sm text-gray-500 mt-1">Manage stock levels for all product variants.</p>
      </div>

      <InventoryEditor initialVariants={variants || []} />
    </div>
  );
}
