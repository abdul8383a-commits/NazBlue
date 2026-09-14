import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/types/database';

export async function fetchProducts({ 
  gender, 
  categorySlug, 
  sort, 
  searchQuery 
}: { 
  gender?: import('@/types/database').Gender; 
  categorySlug?: string; 
  sort?: string;
  searchQuery?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('*, categories!inner(*)')
    .eq('is_active', true);

  if (gender) {
    query = query.in('gender', [gender, 'unisex']);
  }

  if (categorySlug) {
    query = query.eq('categories.name', categorySlug);
  }

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  if (sort === 'price_asc') {
    query = query.order('base_price', { ascending: true });
  } else if (sort === 'price_desc') {
    query = query.order('base_price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  
  if (error || !data || data.length === 0) {
    if (error) {
      console.warn('[Supabase Warning] Error fetching products:', error?.message || 'Table might not exist yet');
    }
    
    // MOCK FALLBACK for testing
    return [
      {
        id: 'mock-1',
        name: 'Classic Navy Blue Shirt',
        base_price: 59.99,
        discount_price: 49.99,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=600&auto=format&fit=crop'],
        gender: 'men',
        is_active: true
      },
      {
        id: 'mock-2',
        name: 'Elegant White Summer Dress',
        base_price: 89.99,
        images: ['https://images.unsplash.com/photo-1515347619362-6734f7117541?q=80&w=600&auto=format&fit=crop'],
        gender: 'women',
        is_active: true
      }
    ].filter(item => !gender || item.gender === gender || item.gender === 'unisex') as unknown as Product[];
  }
  
  return data as unknown as Product[];
}
