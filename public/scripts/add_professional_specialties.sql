-- Script para verificar e adicionar a tabela de especialidades de profissionais
-- Esta tabela é necessária para que os profissionais apareçam no formulário de agendamento

-- 1. Criar tabela de especialidades de profissionais se não existir
CREATE TABLE IF NOT EXISTS public.professional_specialties (
    id SERIAL PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(professional_id, service_id)
);

-- 2. Configurar RLS
ALTER TABLE public.professional_specialties ENABLE ROW LEVEL SECURITY;

-- 3. Adicionar políticas de acesso
-- Política para permitir leitura por qualquer usuário autenticado
DROP POLICY IF EXISTS "Leitura de especialidades para todos" ON public.professional_specialties;
CREATE POLICY "Leitura de especialidades para todos" 
  ON public.professional_specialties FOR SELECT 
  USING (auth.uid() IS NOT NULL);
  
-- Política para permitir edição apenas por admin ou o próprio profissional  
DROP POLICY IF EXISTS "Edição de especialidades apenas por admin ou próprio" ON public.professional_specialties;
CREATE POLICY "Edição de especialidades apenas por admin ou próprio" 
  ON public.professional_specialties FOR ALL 
  USING (
    auth.uid() = professional_id 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
  
-- 4. Criar função para atribuir todas as especialidades a um profissional
CREATE OR REPLACE FUNCTION public.assign_all_services_to_professional(prof_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count_inserted INTEGER;
BEGIN
    -- Remover especialidades existentes para evitar duplicidade
    DELETE FROM public.professional_specialties
    WHERE professional_id = prof_id;
    
    -- Adicionar todas as especialidades
    WITH inserted AS (
        INSERT INTO public.professional_specialties (professional_id, service_id)
        SELECT prof_id, id 
        FROM public.services
        RETURNING *
    )
    SELECT COUNT(*) INTO count_inserted FROM inserted;
    
    RETURN count_inserted;
END;
$$;