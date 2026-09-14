"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function CartPage() {
  const { items, isLoading, updateQuantity, removeFromCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState<{ type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  
  const supabase = createClient();

  const subtotal = items.reduce((acc, item) => {
    const price = item.variant.product.discount_price || item.variant.product.base_price;
    return acc + price * item.quantity;
  }, 0);

  const calculateDiscount = () => {
    if (!discount) return 0;
    if (discount.type === 'percentage') {
      return subtotal * (discount.value / 100);
    }
    return discount.value;
  };

  const discountAmount = calculateDiscount();
  const shipping = subtotal > 100 || items.length === 0 ? 0 : 10;
  const tax = (subtotal - discountAmount) * 0.08;
  const grandTotal = subtotal - discountAmount + shipping + tax;

  const handleApplyCoupon = async () => {
    setCouponError("");
    setDiscount(null);
    if (!couponCode) return;

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      setCouponError("Invalid or expired coupon code.");
      return;
    }
    
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      setCouponError("This coupon has expired.");
      return;
    }

    setDiscount({ type: data.discount_type, value: data.discount_value });
  };

  if (isLoading) {
    return <div className="py-20 text-center min-h-[70vh]">Loading cart...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[70vh]">
      <h1 className="text-3xl font-bold text-primary mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-primary/5 rounded-lg border border-dashed border-gray-300 dark:border-primary/20">
          <p className="text-gray-500 dark:text-white/60 mb-6">Your cart is currently empty.</p>
          <Link href="/men" className="bg-primary text-primary-foreground px-6 py-3 rounded font-semibold hover:opacity-90">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="flex-1 space-y-6">
            {items.map((item) => {
              const product = item.variant.product;
              const price = product.discount_price || product.base_price;
              
              return (
                <div key={item.id} className="flex gap-4 p-4 bg-white dark:bg-transparent border border-gray-200 dark:border-primary/20 rounded-lg shadow-sm">
                  <div className="relative w-24 h-32 flex-shrink-0 bg-gray-100 dark:bg-primary/10 rounded overflow-hidden">
                    <Image 
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/150'} 
                      alt={product.name}
                      fill
                      sizes="96px" 
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          <Link href={`/product/${product.id}`} className="hover:underline">{product.name}</Link>
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-white/60 mt-1">Size: {item.variant.size} | Color: {item.variant.color}</p>
                        {item.variant.stock_quantity < item.quantity && (
                          <p className="text-xs text-red-600 mt-1">Only {item.variant.stock_quantity} available in stock.</p>
                        )}
                      </div>
                      <p className="font-semibold text-primary text-right">${(price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-300 dark:border-primary/30 rounded overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-3 py-1 bg-gray-50 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-primary/10 text-gray-600 dark:text-white/70"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-sm font-medium border-x border-gray-300 dark:border-primary/30">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 bg-gray-50 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-primary/10 text-gray-600 dark:text-white/70"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 p-2"
                        title="Remove Item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-gray-50 dark:bg-primary/5 p-6 rounded-lg border border-gray-200 dark:border-primary/20 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-white/70 border-b border-gray-200 dark:border-primary/20 pb-6 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-medium text-gray-900 dark:text-white">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-primary dark:text-white">${Math.max(0, grandTotal).toFixed(2)}</span>
              </div>

              {/* Coupon Code */}
              <div className="mb-6">
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Coupon Code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-primary/30 rounded focus:outline-none focus:border-primary bg-transparent uppercase text-sm"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="bg-gray-800 dark:bg-primary text-white dark:text-primary-foreground px-4 py-2 rounded text-sm font-semibold hover:bg-gray-700 dark:hover:opacity-90 transition-all"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-red-600 text-xs mt-2">{couponError}</p>}
                {discount && <p className="text-green-600 text-xs mt-2">Coupon applied successfully!</p>}
              </div>

              <Link 
                href="/checkout"
                className="block w-full bg-primary text-primary-foreground text-center py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
