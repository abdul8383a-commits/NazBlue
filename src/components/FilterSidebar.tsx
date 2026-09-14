"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "newest";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`?${createQueryString(name, value)}`, { scroll: false });
  };

  return (
    <div className="w-full space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-xs uppercase tracking-widest font-semibold mb-6 text-primary dark:text-white">Category</h3>
        <ul className="space-y-4">
          {['', 'T-Shirts', 'Jeans', 'Dresses', 'Jackets'].map((cat) => (
            <li key={cat}>
              <button
                onClick={() => handleFilterChange("category", cat)}
                className={`text-sm hover:text-primary dark:hover:text-white transition-colors tracking-wide ${
                  currentCategory === cat || (!currentCategory && cat === '') 
                    ? "font-medium text-primary dark:text-white underline underline-offset-4" 
                    : "text-primary/80 dark:text-white/80"
                }`}
              >
                {cat === '' ? 'All Categories' : cat}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Sort */}
      <div className="pt-8 border-t border-primary/10">
        <h3 className="text-xs uppercase tracking-widest font-semibold mb-6 text-primary dark:text-white">Sort By</h3>
        <select 
          value={currentSort}
          onChange={(e) => handleFilterChange("sort", e.target.value)}
          className="w-full pb-2 border-b border-primary/20 dark:border-white/20 bg-transparent text-sm text-primary dark:text-white focus:outline-none focus:border-primary dark:focus:border-white tracking-wide cursor-pointer appearance-none"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(currentCategory || currentSort !== 'newest') && (
        <div className="pt-8">
          <button 
            onClick={() => router.push('?', { scroll: false })}
            className="text-xs uppercase tracking-widest text-primary/80 dark:text-white/80 hover:text-primary dark:hover:text-white border-b border-transparent hover:border-primary dark:hover:border-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
