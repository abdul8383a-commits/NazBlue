-- Add required Shiprocket shipping and fulfilment fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT,
ADD COLUMN IF NOT EXISTS awb_code TEXT,
ADD COLUMN IF NOT EXISTS courier_name TEXT,
ADD COLUMN IF NOT EXISTS pickup_scheduled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shiprocket_status TEXT,
ADD COLUMN IF NOT EXISTS package_weight NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS package_length NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS package_width NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS package_height NUMERIC(10,2);
