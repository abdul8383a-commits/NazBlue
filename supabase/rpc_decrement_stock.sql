-- Function to safely decrement stock and prevent race conditions
CREATE OR REPLACE FUNCTION public.decrement_stock(variant_id UUID, decrement_by INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT stock_quantity INTO current_stock
  FROM public.product_variants
  WHERE id = variant_id
  FOR UPDATE;

  IF current_stock >= decrement_by THEN
    UPDATE public.product_variants
    SET stock_quantity = stock_quantity - decrement_by
    WHERE id = variant_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
