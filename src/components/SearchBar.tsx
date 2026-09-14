"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

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
    <form onSubmit={handleSearch} className="relative flex items-center w-full">
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-4 pr-10 py-1.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-gray-50"
      />
      <button type="submit" className="absolute right-3 text-gray-500 hover:text-primary">
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}
