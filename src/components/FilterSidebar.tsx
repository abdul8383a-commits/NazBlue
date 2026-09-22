"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  
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
    // Don't close automatically so users can select multiple filters if needed
  };

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const FilterContent = () => (
    <div className="w-full space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-xs uppercase tracking-widest font-semibold mb-4 text-primary dark:text-white">Category</h3>
        <ul className="flex flex-col space-y-3">
          {['', 'T-Shirts', 'Jeans', 'Dresses', 'Jackets'].map((cat) => (
            <li key={cat}>
              <button
                onClick={() => handleFilterChange("category", cat)}
                className={`text-sm w-full text-left transition-colors tracking-wide px-3 py-2 rounded-md ${
                  currentCategory === cat || (!currentCategory && cat === '') 
                    ? "font-medium text-white dark:text-primary bg-primary dark:bg-white" 
                    : "text-primary/80 dark:text-white/80 hover:bg-primary/5 dark:hover:bg-white/5"
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
        <h3 className="text-xs uppercase tracking-widest font-semibold mb-4 text-primary dark:text-white">Sort By</h3>
        <ul className="flex flex-col space-y-3">
          {[
            { label: 'Newest Arrivals', value: 'newest' },
            { label: 'Price: Low to High', value: 'price_asc' },
            { label: 'Price: High to Low', value: 'price_desc' }
          ].map((sortOption) => (
            <li key={sortOption.value}>
              <button
                onClick={() => handleFilterChange("sort", sortOption.value)}
                className={`text-sm w-full text-left transition-colors tracking-wide px-3 py-2 rounded-md ${
                  currentSort === sortOption.value
                    ? "font-medium text-white dark:text-primary bg-primary dark:bg-white" 
                    : "text-primary/80 dark:text-white/80 hover:bg-primary/5 dark:hover:bg-white/5"
                }`}
              >
                {sortOption.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Clear Filters */}
      {(currentCategory || currentSort !== 'newest') && (
        <div className="pt-8 border-t border-primary/10">
          <button 
            onClick={() => {
              router.push('?', { scroll: false });
              closeMenu();
            }}
            className="w-full py-3 text-sm font-bold tracking-widest uppercase border border-primary dark:border-white text-primary dark:text-white rounded-full hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden mb-6 flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-primary/10">
        <span className="text-sm font-medium text-primary dark:text-white">Filter & Sort</span>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 text-primary dark:text-white hover:opacity-70 transition-opacity"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={closeMenu}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-[#E8E7E5] dark:bg-[#163A7A] rounded-t-2xl max-h-[85vh] overflow-y-auto pb-safe transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#E8E7E5] dark:bg-[#163A7A] z-10 px-6 py-4 border-b border-primary/10 flex justify-between items-center">
              <h2 className="text-lg font-serif font-bold text-primary dark:text-white">Filter & Sort</h2>
              <button onClick={closeMenu} className="p-2 -mr-2 text-primary dark:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <FilterContent />
            </div>
            <div className="sticky bottom-0 p-4 bg-[#E8E7E5] dark:bg-[#163A7A] border-t border-primary/10 pb-safe">
              <button 
                onClick={closeMenu}
                className="w-full py-4 bg-primary dark:bg-white text-white dark:text-primary rounded-full font-bold uppercase tracking-widest text-sm shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block sticky top-32">
        <FilterContent />
      </div>
    </>
  );
}
