"use client";

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartIcon() {
  const { items, isLoading } = useCart();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/cart" className="relative hover:opacity-80 transition-opacity" aria-label="Cart">
      <ShoppingCart className="w-5 h-5" />
      {!isLoading && itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
