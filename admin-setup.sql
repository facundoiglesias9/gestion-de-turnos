-- 1. Create a profiles table to store business names publicly (for the admin to see)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert/update their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Policy: Admin can view all profiles
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundoiglesias9@gmail.com');

-- 2. Update RLS on existing tables to allow Admin access

-- TURNS
CREATE POLICY "Admin view all turns" ON public.turns
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundoiglesias9@gmail.com');

-- PRICES
CREATE POLICY "Admin view all prices" ON public.prices
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundoiglesias9@gmail.com');

-- EXPENSES
CREATE POLICY "Admin view all expenses" ON public.expenses
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundoiglesias9@gmail.com');
