import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types/database';

export default function ProductCard({ product }: { product: Product }) {
  // Use first image if available, else a placeholder
  const imageSrc = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://via.placeholder.com/400x500?text=No+Image';
    
  const hasDiscount = product.discount_price && product.discount_price < product.base_price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.base_price - (product.discount_price as number)) / product.base_price) * 100)
    : 0;

  return (
    <Link href={`/product/${product.id}`} className="group flex flex-col w-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl overflow-hidden transition-all duration-300">
      <div className="relative aspect-[3/4] bg-gray-100 dark:bg-[#163A7A]/20 overflow-hidden">
        <Image 
          src={imageSrc} 
          alt={`Image of ${product.name}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-primary/90 text-primary dark:text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm backdrop-blur-sm z-10">
            {discountPercent}% OFF
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="pt-3 pb-1 flex flex-col">
        <h3 className="font-medium text-sm text-primary dark:text-white line-clamp-1 group-hover:underline underline-offset-4 decoration-primary/30">
          {product.name}
        </h3>
        
        <div className="mt-1 flex items-baseline space-x-2 flex-wrap">
          {hasDiscount ? (
            <>
              <span className="font-bold text-sm text-primary dark:text-white">
                ₹{(product.discount_price as number).toFixed(2)}
              </span>
              <span className="text-xs text-primary/50 dark:text-white/50 line-through">
                ₹{product.base_price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-bold text-sm text-primary dark:text-white">
              ₹{product.base_price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
