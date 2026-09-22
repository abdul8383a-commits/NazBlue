"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@/types/database";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import PincodeChecker from "@/components/PincodeChecker";
import { ShoppingBag, CreditCard, Check } from "lucide-react";

export default function ProductOptions({ 
  product, 
  variants 
}: { 
  product: Product, 
  variants: ProductVariant[] 
}) {
  const uniqueSizes = Array.from(new Set(variants.map(v => v.size)));
  const uniqueColors = Array.from(new Set(variants.map(v => v.color)));

  const [selectedSize, setSelectedSize] = useState<string>(uniqueSizes[0] || "");
  const [selectedColor, setSelectedColor] = useState<string>(uniqueColors[0] || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  const { addToCart } = useCart();
  const router = useRouter();

  // Find the selected variant
  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const stock = selectedVariant ? selectedVariant.stock_quantity : 0;
  const isOutOfStock = stock === 0;

  const handleAddToCart = async () => {
    if (isOutOfStock || !selectedVariant || isAdding) return;
    setIsAdding(true);
    try {
      await addToCart({
        product_variant_id: selectedVariant.id,
        quantity,
        variant: {
          size: selectedVariant.size,
          color: selectedVariant.color,
          stock_quantity: selectedVariant.stock_quantity,
          product: {
            id: product.id,
            name: product.name,
            images: product.images,
            base_price: product.base_price,
            discount_price: product.discount_price,
          }
        }
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock || !selectedVariant || isAdding) return;
    setIsAdding(true);
    try {
      await addToCart({
        product_variant_id: selectedVariant.id,
        quantity,
        variant: {
          size: selectedVariant.size,
          color: selectedVariant.color,
          stock_quantity: selectedVariant.stock_quantity,
          product: {
            id: product.id,
            name: product.name,
            images: product.images,
            base_price: product.base_price,
            discount_price: product.discount_price,
          }
        }
      });
      router.push('/checkout');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8 pb-36 md:pb-0 relative">
      {/* Color Selection */}
      {uniqueColors.length > 0 && uniqueColors[0] !== "Default" && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 uppercase tracking-wide">Color <span className="text-gray-500 font-normal ml-2">{selectedColor}</span></h3>
          <div className="flex space-x-3">
            {uniqueColors.map((color) => {
              const availableInSize = variants.some(v => v.color === color && v.size === selectedSize && v.stock_quantity > 0);
              
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Select color ${color}`}
                  aria-pressed={selectedColor === color}
                  className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                    selectedColor === color 
                      ? "border-primary bg-primary text-white dark:text-primary-foreground shadow-sm" 
                      : !availableInSize 
                        ? "border-gray-200 dark:border-primary/20 text-gray-400 dark:text-white/40 opacity-50 line-through cursor-not-allowed" 
                        : "border-gray-300 dark:border-primary/50 hover:border-primary text-gray-700 dark:text-white/80 bg-white dark:bg-transparent"
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {uniqueSizes.length > 0 && uniqueSizes[0] !== "Default" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wide">Size</h3>
            <button className="text-sm text-primary/70 dark:text-white/70 underline underline-offset-4 hover:text-primary transition-colors">Size Guide</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {uniqueSizes.map((size) => {
              const availableInColor = variants.some(v => v.size === size && v.color === selectedColor && v.stock_quantity > 0);

              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  aria-label={`Select size ${size}`}
                  aria-pressed={selectedSize === size}
                  className={`min-w-[3rem] h-12 px-3 flex items-center justify-center border rounded-md text-sm font-medium transition-colors ${
                    selectedSize === size 
                      ? "border-primary bg-primary text-white dark:text-primary-foreground shadow-sm" 
                      : !availableInColor
                        ? "border-gray-200 dark:border-primary/20 text-gray-400 dark:text-white/40 opacity-50 line-through bg-gray-50 dark:bg-primary/5 cursor-not-allowed"
                        : "border-gray-300 dark:border-primary/50 hover:border-primary text-gray-700 dark:text-white/80 bg-white dark:bg-transparent"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Stock Status */}
      <div className="pt-2">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wide">Quantity</h3>
          {selectedVariant ? (
            <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {isOutOfStock ? "Out of Stock" : stock < 5 ? `Only ${stock} left` : `In Stock`}
            </span>
          ) : (
            <span className="text-sm font-medium text-red-600 dark:text-red-400">Unavailable</span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-gray-300 dark:border-primary/30 rounded-md overflow-hidden bg-white dark:bg-transparent">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock || isAdding}
              aria-label="Decrease quantity"
              className="px-4 py-3 md:px-3 md:py-2 text-lg md:text-base text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-primary/10 disabled:opacity-50 transition-colors"
            >
              -
            </button>
            <span className="px-5 py-3 md:px-4 md:py-2 text-gray-900 dark:text-white font-medium min-w-[3rem] text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              disabled={isOutOfStock || quantity >= stock || isAdding}
              aria-label="Increase quantity"
              className="px-4 py-3 md:px-3 md:py-2 text-lg md:text-base text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-primary/10 disabled:opacity-50 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <PincodeChecker />

      {/* Actions (Desktop normal, Mobile sticky) */}
      <div className="fixed bottom-[4.5rem] md:bottom-0 left-0 right-0 p-4 md:p-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md md:bg-transparent md:backdrop-blur-none border-t border-gray-200 dark:border-white/10 md:border-none z-40 md:z-auto md:relative flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:shadow-none safe-area-bottom">
        <button 
          onClick={handleAddToCart}
          disabled={isOutOfStock || !selectedVariant || isAdding || justAdded}
          className={`flex-1 flex items-center justify-center gap-2 border py-3.5 md:py-3 rounded-lg font-semibold transition-all ${
            justAdded 
              ? "bg-green-600 border-green-600 text-white" 
              : "bg-white dark:bg-transparent border-primary text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-primary/10"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {justAdded ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
          {isOutOfStock ? "Sold Out" : justAdded ? "Added" : isAdding ? "Adding..." : "Add to Bag"}
        </button>
        <button 
          onClick={handleBuyNow}
          disabled={isOutOfStock || !selectedVariant || isAdding}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white dark:text-primary-foreground py-3.5 md:py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <CreditCard className="w-5 h-5" />
          Buy Now
        </button>
      </div>
    </div>
  );
}
