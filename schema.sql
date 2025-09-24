-- Database Schema Setup for WhatsApp MVP
-- Run this in your Supabase SQL Editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert sample products (only if table is empty)
INSERT INTO products (name, price, description) 
SELECT 'Apples', 50.00, 'Fresh red apples per kg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Apples');

INSERT INTO products (name, price, description) 
SELECT 'Milk', 25.00, 'Fresh milk 1 liter'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Milk');

INSERT INTO products (name, price, description) 
SELECT 'Bread', 30.00, 'Whole wheat bread loaf'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Bread');

INSERT INTO products (name, price, description) 
SELECT 'Bananas', 40.00, 'Fresh bananas per dozen'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Bananas');

INSERT INTO products (name, price, description) 
SELECT 'Rice', 80.00, 'Basmati rice 1 kg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Rice');

-- 6. Create a test user for WhatsApp orders
INSERT INTO users (name, email, password) 
SELECT 'WhatsApp Bot User', 'whatsapp@bot.local', 'dummy_password'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'whatsapp@bot.local');