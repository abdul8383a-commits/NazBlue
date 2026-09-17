import { createClient } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  
  const supabase = await createClient();
  
  const { data: categories } = await supabase.from('categories').select('*');
  
  const { data: product } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', productId)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 mt-1">Make changes to {product.name}</p>
        </div>
      </div>
      
      <ProductForm categories={categories || []} initialData={product} />
    </div>
  );
}
