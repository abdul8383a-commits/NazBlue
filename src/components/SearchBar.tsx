"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative flex items-center w-full group">
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-4 pr-12 py-2 border border-primary/20 dark:border-white/20 rounded-full text-sm focus:outline-none focus:border-primary dark:focus:border-white bg-white/50 dark:bg-white/5 text-primary dark:text-white placeholder:text-primary/50 dark:placeholder:text-white/50 transition-colors"
      />
      
      {query && (
        <button 
          type="button" 
          onClick={() => setQuery("")} 
          className="absolute right-10 text-primary/50 hover:text-primary dark:text-white/50 dark:hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <button 
        type="submit" 
        className="absolute right-3 text-primary/70 hover:text-primary dark:text-white/70 dark:hover:text-white transition-colors"
        aria-label="Submit search"
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}
