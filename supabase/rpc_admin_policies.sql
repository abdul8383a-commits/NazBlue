-- This script should be executed in the Supabase SQL Editor

-- Enable RLS on all relevant tables (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create an Admin Role verification function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PRODUCTS & PRODUCT_VARIANTS
-- Anyone can view active products (Read)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.products FOR SELECT 
USING (is_active = true OR public.is_admin());

-- Only admins can insert/update/delete products
CREATE POLICY "Admins can insert products." 
ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products." 
ON public.products FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete products." 
ON public.products FOR DELETE USING (public.is_admin());

-- Same for variants
CREATE POLICY "Public can view variants" 
ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can modify variants" 
ON public.product_variants FOR ALL USING (public.is_admin());

-- 2. CATEGORIES
CREATE POLICY "Public can view categories" 
ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can modify categories" 
ON public.categories FOR ALL USING (public.is_admin());

-- 3. ORDERS
-- Users can view their own orders
CREATE POLICY "Users view own orders" 
ON public.orders FOR SELECT USING (auth.uid() = user_id);
-- Admins can view ALL orders
CREATE POLICY "Admins view all orders" 
ON public.orders FOR SELECT USING (public.is_admin());

-- Users can insert their own orders
CREATE POLICY "Users insert own orders" 
ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
-- Admins can update orders
CREATE POLICY "Admins update all orders" 
ON public.orders FOR UPDATE USING (public.is_admin());
