import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch products to show in "The current run"
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .limit(8);

  let displayProducts = products || [];

  // MOCK FALLBACK: So you can see what the UI looks like even if DB is empty
  if (displayProducts.length === 0) {
    displayProducts = [
      {
        id: 'mock-1',
        name: 'Classic Navy Blue Shirt',
        base_price: 59.99,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=600&auto=format&fit=crop'],
      },
      {
        id: 'mock-2',
        name: 'Elegant White Summer Dress',
        base_price: 89.99,
        discount_price: 79.99,
        images: ['https://images.unsplash.com/photo-1515347619362-6734f7117541?q=80&w=600&auto=format&fit=crop'],
      },
      {
        id: 'mock-3',
        name: 'BLUE ناز Essential Ribbed Knit',
        base_price: 45.00,
        images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600&auto=format&fit=crop'],
      },
      {
        id: 'mock-4',
        name: 'Relaxed Fit Chinos',
        base_price: 65.00,
        images: ['https://images.unsplash.com/photo-1624378439575-d10787e97d19?q=80&w=600&auto=format&fit=crop'],
      }
    ] as any[];
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-32">
      {/* Hero Section */}
      <div className="mb-20 md:mb-28">
        <div className="max-w-4xl mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-[5.5rem] leading-[1.1] md:leading-[1.1] font-serif italic text-primary dark:text-white mb-6 md:mb-10 tracking-tight break-words hyphens-none">
            Clothes made to be worn until they soften.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-primary/70 dark:text-white/70 max-w-xl leading-relaxed break-words">
            <span className="inline-block relative overflow-hidden w-16 md:w-20 h-4 md:h-5 align-text-bottom -mb-[2px] mr-1.5">
              <Image 
                src="/logo.png" 
                alt="BLUE ناز" 
                fill 
                className="object-cover object-center mix-blend-multiply brightness-[1.2] contrast-[1.2] scale-[1.7] dark:mix-blend-screen dark:invert dark:grayscale dark:brightness-[2] dark:contrast-[1]" 
              />
            </span>
            is a small run of everyday pieces — raw denim, 
            brushed cotton, ribbed knits — built on a simple idea: 
            the best clothes get better with wear.
          </p>
        </div>
        
        {/* Editorial Hero Image */}
        <div className="w-full relative h-[40vh] md:h-[75vh] min-h-[300px] bg-gray-100 dark:bg-[#163A7A]/20 rounded-2xl overflow-hidden shadow-sm">
          <Image
            src="/hero.jpg"
            alt="BLUE ناز Collection"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Divider Section */}
      <div className="border-t border-b border-primary/20 dark:border-white/20 py-4 mb-12 flex justify-between items-center text-sm text-primary/70 dark:text-white/70">
        <span className="font-medium uppercase tracking-widest text-xs">The current run</span>
        <span className="font-medium">{displayProducts.length} pieces</span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product as any} />
        ))}
      </div>
      
      {displayProducts.length === 0 && (
        <div className="text-center py-20 text-primary/50">
          No pieces currently available in the current run.
        </div>
      )}
    </div>
  );
}
