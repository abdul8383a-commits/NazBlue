-- Run this script in your Supabase SQL Editor to instantly populate your store with test data!

-- 1. Insert Categories (Returning IDs to use for products)
WITH new_categories AS (
  INSERT INTO public.categories (name, gender, slug)
  VALUES 
    ('Shirts', 'men', 'shirts-men'),
    ('Dresses', 'women', 'dresses-women'),
    ('T-Shirts', 'unisex', 'tshirts-unisex')
  RETURNING id, slug
),

-- 2. Insert Products
new_products AS (
  INSERT INTO public.products (name, description, category_id, gender, base_price, discount_price, images, is_active)
  VALUES 
    (
      'Classic Navy Blue Shirt', 
      'Premium cotton oxford shirt in deep navy blue. Perfect for both formal and casual occasions. Tailored fit with breathable fabric.',
      (SELECT id FROM new_categories WHERE slug = 'shirts-men'), 
      'men', 
      59.99, 
      49.99, 
      ARRAY['https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=600&auto=format&fit=crop'], 
      true
    ),
    (
      'Elegant White Summer Dress', 
      'Flowy white maxi dress with delicate detailing. A stunning, lightweight piece for summer evenings and beach walks.',
      (SELECT id FROM new_categories WHERE slug = 'dresses-women'), 
      'women', 
      89.99, 
      null, 
      ARRAY['https://images.unsplash.com/photo-1515347619362-6734f7117541?q=80&w=600&auto=format&fit=crop'], 
      true
    ),
    (
      'BLUE ناز Essential White Tee', 
      'The perfect everyday white t-shirt featuring the minimal BLUE ناز logo. 100% organic heavy-weight cotton.',
      (SELECT id FROM new_categories WHERE slug = 'tshirts-unisex'), 
      'unisex', 
      29.99, 
      null, 
      ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop'], 
      true
    )
  RETURNING id, name
)

-- 3. Insert Product Variants (Sizes and Colors)
INSERT INTO public.product_variants (product_id, size, color, stock_quantity, sku)
VALUES 
  -- Navy Shirt Variants
  ((SELECT id FROM new_products WHERE name = 'Classic Navy Blue Shirt'), 'M', 'Navy Blue', 50, 'SHIRT-NAVY-M'),
  ((SELECT id FROM new_products WHERE name = 'Classic Navy Blue Shirt'), 'L', 'Navy Blue', 30, 'SHIRT-NAVY-L'),
  ((SELECT id FROM new_products WHERE name = 'Classic Navy Blue Shirt'), 'XL', 'Navy Blue', 10, 'SHIRT-NAVY-XL'),
  
  -- White Dress Variants
  ((SELECT id FROM new_products WHERE name = 'Elegant White Summer Dress'), 'S', 'White', 15, 'DRESS-WHT-S'),
  ((SELECT id FROM new_products WHERE name = 'Elegant White Summer Dress'), 'M', 'White', 25, 'DRESS-WHT-M'),
  
  -- Essential Tee Variants
  ((SELECT id FROM new_products WHERE name = 'BLUE ناز Essential White Tee'), 'S', 'White', 100, 'TEE-WHT-S'),
  ((SELECT id FROM new_products WHERE name = 'BLUE ناز Essential White Tee'), 'M', 'White', 100, 'TEE-WHT-M'),
  ((SELECT id FROM new_products WHERE name = 'BLUE ناز Essential White Tee'), 'L', 'White', 100, 'TEE-WHT-L');
