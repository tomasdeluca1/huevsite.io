-- Añadir créditos de IA a los perfiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 2;

-- Comentario para documentación
COMMENT ON COLUMN public.profiles.ai_credits IS 'Créditos disponibles para el AI Copywriter (Free: 2 total, Pro: 30/mes)';
