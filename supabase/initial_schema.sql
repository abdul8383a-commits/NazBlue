-- Run this in your NEW Supabase SQL Editor to set up the entire database!

-- 1. Create Tables
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  phone TEXT,
  addresses JSONB,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin'))
);

CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('men', 'women', 'unisex')),
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  gender TEXT CHECK (gender IN ('men', 'women', 'unisex')),
  base_price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku TEXT UNIQUE
);

CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_pending')),
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_id TEXT,
  shiprocket_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL
);

CREATE TABLE public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  UNIQUE(user_id, product_variant_id)
);

CREATE TABLE public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- 2. Trigger to Auto-create user profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Stock management RPC
CREATE OR REPLACE FUNCTION decrement_stock(variant_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - qty
  WHERE id = variant_id AND stock_quantity >= qty;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough stock available';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Enable RLS Policies (From previous script)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
DECLARE user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Public profiles are viewable by everyone." ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins can modify products." ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can modify variants" ON public.product_variants FOR ALL USING (public.is_admin());
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can modify categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins update all orders" ON public.orders FOR UPDATE USING (public.is_admin());
CREATE POLICY "Users can view and update own profile" ON public.users FOR ALL USING (auth.uid() = id);
