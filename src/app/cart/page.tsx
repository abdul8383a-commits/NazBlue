"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function CartPage() {
  const { items, isLoading, updateQuantity, removeFromCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState<{ type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
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

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    setIsUpdating(id);
    await updateQuantity(id, newQuantity);
    setIsUpdating(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary dark:border-white/20 dark:border-t-white rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 dark:text-white/60">Loading your bag...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-12 min-h-[70vh] pb-28 md:pb-12">
      <div className="flex items-center justify-between mb-8 md:mb-12 border-b border-gray-200 dark:border-white/10 pb-4">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">Shopping Bag</h1>
        <span className="text-sm text-gray-500 dark:text-white/60 font-medium">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 px-4 max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400 dark:text-white/40" />
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-3">Your bag is empty</h2>
          <p className="text-gray-500 dark:text-white/60 mb-8 text-sm leading-relaxed">
            Looks like you haven't added anything to your bag yet. Discover our latest arrivals and essentials.
          </p>
          <Link 
            href="/men" 
            className="inline-flex items-center justify-center gap-2 bg-primary text-white dark:text-primary-foreground px-8 py-3.5 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-sm w-full sm:w-auto"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* Cart Items */}
          <div className="flex-1 space-y-6">
            {items.map((item) => {
              const product = item.variant.product;
              const price = product.discount_price || product.base_price;
              
              return (
                <div key={item.id} className={`flex gap-4 md:gap-6 pb-6 border-b border-gray-100 dark:border-white/5 ${isUpdating === item.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Link href={`/product/${product.id}`} className="relative w-28 h-36 md:w-32 md:h-40 flex-shrink-0 bg-gray-100 dark:bg-white/5 rounded-md overflow-hidden group">
                    <Image 
                      src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/150'} 
                      alt={product.name}
                      fill
                      sizes="128px" 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base leading-snug mb-1.5">
                          <Link href={`/product/${product.id}`} className="hover:underline">{product.name}</Link>
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-white/60">
                          {item.variant.color !== 'Default' && `Color: ${item.variant.color}`}
                          {item.variant.color !== 'Default' && item.variant.size !== 'Default' && ' | '}
                          {item.variant.size !== 'Default' && `Size: ${item.variant.size}`}
                        </p>
                        {item.variant.stock_quantity < item.quantity && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">Only {item.variant.stock_quantity} available.</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900 dark:text-white">₹{(price * item.quantity).toFixed(2)}</p>
                        {product.discount_price && (
                           <p className="text-xs text-gray-400 dark:text-gray-500 line-through mt-0.5">₹{(product.base_price * item.quantity).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-200 dark:border-white/20 rounded-md overflow-hidden bg-white dark:bg-transparent">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="px-3 md:px-4 py-1.5 md:py-2 text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 md:w-10 text-center text-sm font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.variant.stock_quantity}
                          aria-label="Increase quantity"
                          className="px-3 md:px-4 py-1.5 md:py-2 text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 p-2 -mr-2 transition-colors flex items-center gap-1.5"
                        title="Remove Item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-xs font-medium hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-gray-50 dark:bg-white/5 p-6 md:p-8 rounded-xl border border-gray-200 dark:border-white/10 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Order Summary</h2>
              
              <div className="space-y-4 text-sm text-gray-600 dark:text-white/70 border-b border-gray-200 dark:border-white/10 pb-6 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-medium text-gray-900 dark:text-white">{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">Total</span>
                <span className="text-2xl font-bold text-primary dark:text-white">₹{Math.max(0, grandTotal).toFixed(2)}</span>
              </div>

              {/* Coupon Code */}
              <div className="mb-8">
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Coupon Code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:border-primary dark:focus:border-white bg-white dark:bg-transparent uppercase text-sm placeholder:normal-case placeholder:text-gray-400"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="bg-gray-800 dark:bg-white/10 text-white dark:text-white px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-700 dark:hover:bg-white/20 transition-all border border-transparent dark:border-white/20"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-red-600 dark:text-red-400 text-xs mt-2 font-medium">{couponError}</p>}
                {discount && <p className="text-green-600 dark:text-green-400 text-xs mt-2 font-medium">Coupon applied successfully!</p>}
              </div>

              <Link 
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-primary text-white dark:text-primary-foreground py-4 rounded-lg font-bold hover:opacity-90 transition-opacity text-base shadow-sm"
              >
                Checkout securely
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
