import { fetchProducts } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';

export const dynamic = 'force-dynamic';

export default async function SearchCatalog({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams;
  const q = params.q || '';
  const category = params.category;
  const sort = params.sort;

  const products = await fetchProducts({ searchQuery: q, categorySlug: category, sort });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[70vh]">
      <h1 className="text-3xl font-bold text-primary mb-8">
        Search Results for "{q}"
      </h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <FilterSidebar />
        </aside>
        <main className="flex-1">
          {products.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No products found matching your search.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
