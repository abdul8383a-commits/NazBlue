"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Search, Filter } from "lucide-react";
import Image from "next/image";

export default function ProductListClient({ initialProducts }: { initialProducts: any[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const categories = Array.from(new Set(initialProducts.map(p => p.categories?.name).filter(Boolean)));

  const filteredProducts = initialProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.categories?.name === categoryFilter;
    const matchesStatus = statusFilter === "all" 
      || (statusFilter === "active" && p.is_active) 
      || (statusFilter === "inactive" && !p.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:border-primary outline-none"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:border-primary outline-none bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c: any) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded focus:border-primary outline-none bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const variants = p.product_variants || [];
                  const variantCount = variants.length;
                  const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0);
                  const price = p.discount_price || p.base_price;
                  
                  return (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded border relative overflow-hidden">
                            {p.images && p.images[0] ? (
                              <Image src={p.images[0]} alt={p.name} fill sizes="48px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-bold text-gray-900 truncate max-w-[200px]" title={p.name}>{p.name}</div>
                            <div className="text-gray-500 text-xs capitalize mt-0.5">{p.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                        {p.categories?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">₹{price.toFixed(2)}</div>
                        {p.discount_price && (
                          <div className="text-xs text-gray-400 line-through">₹{p.base_price.toFixed(2)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{totalStock} in stock</div>
                        <div className="text-xs text-gray-500">{variantCount} variant{variantCount !== 1 && 's'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-bold uppercase tracking-wider rounded ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                        <Link href={`/admin/products/${p.id}/edit`} className="text-primary hover:text-primary/80 inline-flex items-center bg-blue-50 hover:bg-blue-100 transition-colors px-3 py-1.5 rounded text-sm font-bold">
                          <Edit className="w-3.5 h-3.5 mr-1.5"/> Edit
                        </Link>
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
