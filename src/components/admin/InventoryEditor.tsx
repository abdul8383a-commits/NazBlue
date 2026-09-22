"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function InventoryEditor({ initialVariants }: { initialVariants: any[] }) {
  const [variants, setVariants] = useState(initialVariants);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null); // stores variant id currently updating

  const supabase = createClient();

  const filteredVariants = variants.filter(v => {
    const matchesSearch = 
      v.products?.name.toLowerCase().includes(search.toLowerCase()) || 
      v.sku?.toLowerCase().includes(search.toLowerCase());
      
    let matchesStock = true;
    if (stockFilter === "in_stock") matchesStock = v.stock_quantity > 0;
    if (stockFilter === "out_of_stock") matchesStock = v.stock_quantity === 0;
    if (stockFilter === "low_stock") matchesStock = v.stock_quantity > 0 && v.stock_quantity < 5;
    
    return matchesSearch && matchesStock;
  });

  const handleStockUpdate = async (variantId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr);
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert("Please enter a valid positive number for stock.");
      return;
    }
    
    // Find current variant to compare if actually changed
    const currentVariant = variants.find(v => v.id === variantId);
    if (currentVariant?.stock_quantity === newQuantity) return;
    
    // Confirm large destructive changes
    if (Math.abs((currentVariant?.stock_quantity || 0) - newQuantity) > 50) {
      if (!window.confirm(`Are you sure you want to change stock from ${currentVariant?.stock_quantity} to ${newQuantity}?`)) {
        return;
      }
    }

    setUpdating(variantId);

    try {
      const { error } = await supabase
        .from("product_variants")
        .update({ stock_quantity: newQuantity })
        .eq("id", variantId);

      if (error) throw error;

      // Update local state to reflect success immediately
      setVariants(variants.map(v => 
        v.id === variantId ? { ...v, stock_quantity: newQuantity } : v
      ));
      
    } catch (err: any) {
      alert("Failed to update stock: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by product name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:border-primary outline-none"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:border-primary outline-none bg-white"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="low_stock">Low Stock (&lt; 5)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Variant</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Stock Qty</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No variants found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const product = v.products;
                  if (!product) return null;
                  
                  return (
                    <tr key={v.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded border relative overflow-hidden">
                            {product.images && product.images[0] ? (
                              <Image src={product.images[0]} alt={product.name} fill sizes="40px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No img</div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-bold text-gray-900 truncate max-w-[200px]" title={product.name}>{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                        {v.sku || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-medium">{v.size} / {v.color}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {v.stock_quantity === 0 ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-4 font-bold uppercase tracking-wider rounded bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : v.stock_quantity < 5 ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-4 font-bold uppercase tracking-wider rounded bg-yellow-100 text-yellow-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-4 font-bold uppercase tracking-wider rounded bg-green-100 text-green-800">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <input 
                            type="number" 
                            min="0"
                            defaultValue={v.stock_quantity}
                            onBlur={(e) => handleStockUpdate(v.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            disabled={updating === v.id}
                            className={`w-20 px-2 py-1 border rounded text-right focus:border-primary outline-none ${updating === v.id ? 'opacity-50' : 'border-gray-300'}`}
                          />
                          {updating === v.id && (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
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
