import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types/database';

export default function ProductCard({ product }: { product: Product }) {
  // Use first image if available, else a placeholder
  const imageSrc = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://via.placeholder.com/400x500?text=No+Image';

  return (
    <Link href={`/product/${product.id}`} className="group flex flex-col">
      <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden mb-3">
        <Image 
          src={imageSrc} 
          alt={product.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.discount_price && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            SALE
          </div>
        )}
      </div>
      <h3 className="font-medium text-sm md:text-base text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
      <div className="mt-1 flex items-center space-x-2">
        {product.discount_price ? (
          <>
            <span className="font-semibold text-primary dark:text-white">₹{product.discount_price.toFixed(2)}</span>
            <span className="text-sm text-gray-500 dark:text-white/60 line-through">₹{product.base_price.toFixed(2)}</span>
          </>
        ) : (
          <span className="font-semibold text-primary dark:text-white">₹{product.base_price.toFixed(2)}</span>
        )}
      </div>
    </Link>
  );
}
