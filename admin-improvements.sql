-- 1. BACKFILL PROFILES (Rellenar usuarios faltantes)
-- Copia todos los usuarios de auth.users a public.profiles si no existen
INSERT INTO public.profiles (id, email, business_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'business_name', 'Sin Nombre') as business_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE LOGS TABLE (Tabla para errores)
CREATE TABLE IF NOT EXISTS public.app_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  business_name TEXT,
  error_message TEXT,
  error_stack TEXT,
  context TEXT, -- En qué página o función pasó
  user_agent TEXT -- Navegador/Dispositivo
);

-- 3. SECURITY FOR LOGS
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede CREAR un log (para reportar error)
CREATE POLICY "Anyone can insert logs" ON public.app_logs
  FOR INSERT WITH CHECK (true);

-- Solo el ADMIN puede VER los logs
CREATE POLICY "Admin view all logs" ON public.app_logs
  FOR SELECT USING ((auth.jwt() ->> 'email') = 'facundo@example.com');
