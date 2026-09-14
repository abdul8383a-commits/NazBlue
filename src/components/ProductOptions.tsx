"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@/types/database";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

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
  const { addToCart } = useCart();
  const router = useRouter();

  // Find the selected variant
  const selectedVariant = variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const stock = selectedVariant ? selectedVariant.stock_quantity : 0;
  const isOutOfStock = stock === 0;

  const handleAddToCart = async () => {
    if (isOutOfStock || !selectedVariant) return;
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
    alert(`Added ${quantity} of ${product.name} (Size: ${selectedSize}, Color: ${selectedColor}) to cart!`);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock || !selectedVariant) return;
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
  };

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      {uniqueColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Color</h3>
          <div className="flex space-x-3">
            {uniqueColors.map((color) => {
              const availableInSize = variants.some(v => v.color === color && v.size === selectedSize && v.stock_quantity > 0);
              
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 border rounded text-sm font-medium transition-colors ${
                    selectedColor === color 
                      ? "border-primary bg-primary text-white dark:text-primary-foreground" 
                      : !availableInSize 
                        ? "border-gray-200 dark:border-primary/20 text-gray-400 dark:text-white/40 opacity-50 line-through" 
                        : "border-gray-300 dark:border-primary/50 hover:border-primary text-gray-700 dark:text-white/80"
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
      {uniqueSizes.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Size</h3>
            <button className="text-sm text-primary dark:text-white hover:underline">Size Guide</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {uniqueSizes.map((size) => {
              const availableInColor = variants.some(v => v.size === size && v.color === selectedColor && v.stock_quantity > 0);

              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 flex items-center justify-center border rounded text-sm font-medium transition-colors ${
                    selectedSize === size 
                      ? "border-primary bg-primary text-white dark:text-primary-foreground" 
                      : !availableInColor
                        ? "border-gray-200 dark:border-primary/20 text-gray-400 dark:text-white/40 opacity-50 line-through bg-gray-50 dark:bg-primary/5"
                        : "border-gray-300 dark:border-primary/50 hover:border-primary text-gray-700 dark:text-white/80"
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
        {selectedVariant ? (
          <p className={`text-sm font-medium mb-3 ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
            {isOutOfStock ? "Out of Stock" : `${stock} in stock`}
          </p>
        ) : (
          <p className="text-sm font-medium mb-3 text-red-600">Variant not available</p>
        )}

        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-gray-300 dark:border-primary/30 rounded">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock}
              className="px-3 py-2 text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-primary/10 disabled:opacity-50"
            >
              -
            </button>
            <span className="px-4 py-2 text-gray-900 dark:text-white font-medium">{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              disabled={isOutOfStock || quantity >= stock}
              className="px-3 py-2 text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-primary/10 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          onClick={handleAddToCart}
          disabled={isOutOfStock || !selectedVariant}
          className="flex-1 bg-white dark:bg-transparent border-2 border-primary text-primary dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        <button 
          onClick={handleBuyNow}
          disabled={isOutOfStock || !selectedVariant}
          className="flex-1 bg-primary text-white dark:text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
