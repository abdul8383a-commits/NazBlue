import { fetchProducts } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';

export const dynamic = 'force-dynamic';

export default async function MenCatalog({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams;
  const category = params.category;
  const sort = params.sort;

  const products = await fetchProducts({ gender: 'men', categorySlug: category, sort });

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 md:py-16 min-h-[70vh]">
      <div className="mb-8 md:mb-12 border-b border-primary/10 pb-6">
        <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-primary dark:text-white">Men</h1>
        <p className="mt-3 md:mt-4 text-primary/70 dark:text-white/70 max-w-xl text-sm md:text-base">Everyday essentials crafted for men. Raw denim, brushed cotton, ribbed knits.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-12">
        <aside className="w-full md:w-56 flex-shrink-0">
          <FilterSidebar />
        </aside>
        <main className="flex-1">
          {products.length === 0 ? (
            <div className="py-12 text-primary/60">No products found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
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
