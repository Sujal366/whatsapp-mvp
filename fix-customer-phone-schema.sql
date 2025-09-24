-- Add missing customer contact columns to orders table
-- Run this in your Supabase SQL Editor

-- 1. Add customer contact columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 2. Update existing orders with a test phone number (replace with your WhatsApp number)
-- IMPORTANT: Replace '+1234567890' with your actual WhatsApp number for testing
UPDATE orders 
SET customer_phone = '+918355954296', 
    customer_name = 'Test Customer'
WHERE customer_phone IS NULL;

-- 3. Verify the update
SELECT id, customer_phone, customer_name, status, created_at 
FROM orders 
ORDER BY created_at DESC;

-- This will show all orders now have customer phone numbers for notifications