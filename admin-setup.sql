-- 1. Limpiar políticas viejas
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all turns" ON public.turns;
DROP POLICY IF EXISTS "Admin view all prices" ON public.prices;
DROP POLICY IF EXISTS "Admin view all expenses" ON public.expenses;

-- 2. Asegurar que la tabla profiles exista
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crear las políticas nuevas para 'facundo@example.com'

-- Perfiles: Cada uno ve el suyo
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Perfiles: Admin ve todos
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundo@example.com');

-- Turnos: Admin ve todos
CREATE POLICY "Admin view all turns" ON public.turns
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundo@example.com');

-- Precios: Admin ve todos
CREATE POLICY "Admin view all prices" ON public.prices
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundo@example.com');

-- Gastos: Admin ve todos
CREATE POLICY "Admin view all expenses" ON public.expenses
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundo@example.com');
