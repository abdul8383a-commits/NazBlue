export type Gender = 'men' | 'women' | 'unisex' | 'kids' | 'accessories';

export interface Category {
  id: string;
  name: string;
  gender: Gender;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  gender: Gender;
  base_price: number;
  discount_price: number | null;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  categories?: Category;
  product_variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock_quantity: number;
  sku: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}
