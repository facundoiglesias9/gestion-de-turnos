-- Agregar columna para guardar la fecha/hora del recordatorio
ALTER TABLE public.turns 
ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP WITH TIME ZONE;

-- Agregar columna para saber si ya se notificó (para no avisar 2 veces)
ALTER TABLE public.turns 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
