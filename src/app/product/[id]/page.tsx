import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/ProductGallery';
import ProductOptions from '@/components/ProductOptions';
import type { Product, ProductVariant } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  const supabase = await createClient();

  let product = null;
  let variants = null;
  let reviews = null;

  if (productId.startsWith('mock-')) {
    // MOCK DATA
    product = {
      id: productId,
      name: productId === 'mock-1' ? 'Classic Navy Blue Shirt' : productId === 'mock-2' ? 'Elegant White Summer Dress' : 'BLUE ناز Essential Ribbed Knit',
      description: 'This is a beautifully crafted test product. Since your database is currently empty, we are displaying this mock data so you can test the layout, add to cart functionality, and overall UI.',
      base_price: productId === 'mock-2' ? 89.99 : productId === 'mock-1' ? 59.99 : 45.00,
      discount_price: null,
      images: [
        productId === 'mock-1' ? 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=600&auto=format&fit=crop' : 
        productId === 'mock-2' ? 'https://images.unsplash.com/photo-1515347619362-6734f7117541?q=80&w=600&auto=format&fit=crop' : 
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=600&auto=format&fit=crop'
      ],
      categories: { name: 'Mock Category' }
    };
    
    variants = [
      { id: 'v1', product_id: productId, size: 'S', color: 'Default', stock_quantity: 5, sku: 'MOCK-S' },
      { id: 'v2', product_id: productId, size: 'M', color: 'Default', stock_quantity: 0, sku: 'MOCK-M' }, // Out of stock to test UI
      { id: 'v3', product_id: productId, size: 'L', color: 'Default', stock_quantity: 10, sku: 'MOCK-L' },
    ];
    reviews = [];
  } else {
    // Fetch product from Supabase
    const { data: dbProduct, error: productError } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', productId)
      .single();

    if (productError || !dbProduct) {
      notFound();
    }
    
    product = dbProduct;

    // Fetch variants
    const { data: dbVariants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);
    variants = dbVariants;

    // Fetch reviews
    const { data: dbReviews } = await supabase
      .from('reviews')
      .select('*, users(name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    reviews = dbReviews;
  }



  const typedProduct = product as unknown as Product;
  const typedVariants = (variants || []) as unknown as ProductVariant[];
  const typedReviews = (reviews || []) as any[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[70vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div>
          <ProductGallery images={typedProduct.images} />
        </div>

        {/* Right: Details & Options */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{typedProduct.name}</h1>
          
          <div className="flex items-center space-x-4 mb-6">
            {typedProduct.discount_price ? (
              <>
                <span className="text-2xl font-bold text-primary dark:text-white">${typedProduct.discount_price.toFixed(2)}</span>
                <span className="text-lg text-gray-500 dark:text-white/60 line-through">${typedProduct.base_price.toFixed(2)}</span>
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">SALE</span>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary dark:text-white">${typedProduct.base_price.toFixed(2)}</span>
            )}
          </div>

          <div className="prose prose-sm text-gray-600 dark:text-white/80 mb-8 border-b border-gray-200 dark:border-white/20 pb-8">
            <p>{typedProduct.description || "No description available."}</p>
          </div>

          <ProductOptions product={typedProduct} variants={typedVariants} />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-20 border-t border-gray-200 dark:border-white/20 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Customer Reviews</h2>
        {typedReviews.length === 0 ? (
          <p className="text-gray-500 dark:text-white/60">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-8">
            {typedReviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 dark:border-white/20 pb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{review.users?.name || 'Anonymous'}</span>
                  <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p className="text-gray-600 dark:text-white/80">{review.comment}</p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
