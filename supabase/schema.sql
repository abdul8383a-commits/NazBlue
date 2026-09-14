-- Create custom types (enums)
CREATE TYPE public.gender_enum AS ENUM ('men', 'women', 'kids', 'accessories');
CREATE TYPE public.order_status_enum AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- 1. users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  phone TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. categories
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gender public.gender_enum NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. products
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  gender public.gender_enum NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  discount_price NUMERIC(10, 2),
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. product_variants
CREATE TABLE public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  status public.order_status_enum DEFAULT 'pending',
  total_amount NUMERIC(10, 2) NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_status public.payment_status_enum DEFAULT 'pending',
  payment_id TEXT,
  shiprocket_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. order_items
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. cart_items
CREATE TABLE public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_variant_id)
);

-- 8. reviews
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- 9. coupons
CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle auto-updating `updated_at`
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Indexes for frequent searches
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_gender ON public.products(gender);
CREATE INDEX idx_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_cart_user ON public.cart_items(user_id);

-- ROW LEVEL SECURITY (RLS)

-- 1. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 2. Define `is_admin()` helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Users Table Policies
-- Users can view their own profile or admins can view all
CREATE POLICY "Users can view own profile or admins can view all" 
ON public.users FOR SELECT 
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id OR public.is_admin());

-- 4. Categories & Products (Publicly readable)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin());

CREATE POLICY "Product variants are viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (public.is_admin());

-- 5. Orders (Customers can see own, admins see all)
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (public.is_admin());

-- 6. Order Items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT 
USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT 
WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.is_admin());

-- 7. Cart Items (Strict isolation)
CREATE POLICY "Users can view own cart items" ON public.cart_items FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can manage own cart items" ON public.cart_items FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 8. Reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- 9. Coupons
CREATE POLICY "Active coupons are viewable by everyone" ON public.coupons FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (public.is_admin());

-- INSERT DUMMY DATA

-- Insert Categories
INSERT INTO public.categories (name, gender, slug) VALUES 
('T-Shirts', 'men', 'men-tshirts'),
('Dresses', 'women', 'women-dresses'),
('Jackets', 'unisex', 'unisex-jackets');

-- Insert Products
INSERT INTO public.products (name, description, category_id, gender, base_price, discount_price, is_active) VALUES 
('Classic White Tee', 'Essential cotton t-shirt', (SELECT id FROM public.categories WHERE slug='men-tshirts'), 'men', 25.00, NULL, true),
('Summer Floral Dress', 'Lightweight floral dress for summer', (SELECT id FROM public.categories WHERE slug='women-dresses'), 'women', 65.00, 50.00, true);

-- Insert Product Variants
INSERT INTO public.product_variants (product_id, size, color, stock_quantity, sku) VALUES
((SELECT id FROM public.products WHERE name='Classic White Tee'), 'M', 'White', 100, 'MEN-TEE-WHT-M'),
((SELECT id FROM public.products WHERE name='Classic White Tee'), 'L', 'White', 50, 'MEN-TEE-WHT-L'),
((SELECT id FROM public.products WHERE name='Summer Floral Dress'), 'S', 'Blue', 20, 'WOM-DRS-BLU-S');
