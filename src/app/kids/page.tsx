import { fetchProducts } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';

export const dynamic = 'force-dynamic';

export default async function KidsCatalog({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams;
  const category = params.category;
  const sort = params.sort;

  const products = await fetchProducts({ gender: 'kids', categorySlug: category, sort });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16 min-h-[70vh]">
      <div className="mb-8 md:mb-12 border-b border-primary/10 dark:border-white/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-primary dark:text-white">Kids</h1>
        <p className="mt-3 md:mt-4 text-primary/70 dark:text-white/70 max-w-xl text-sm md:text-base">Everyday essentials crafted for the little ones.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 md:gap-12">
        <aside className="w-full md:w-64 flex-shrink-0 z-20">
          <FilterSidebar />
        </aside>
        <main className="flex-1">
          {products.length === 0 ? (
            <div className="py-20 text-center text-primary/60 dark:text-white/60">
              <p className="text-lg mb-4">No products found matching your criteria.</p>
              <a href="/kids" className="text-sm font-bold border-b border-primary dark:border-white pb-1 hover:opacity-70 transition-opacity">
                Clear Filters
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
