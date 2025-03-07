-- Script para adicionar o usuário como profissional e configurar disponibilidade de horário comercial
-- Para executar este script, cole-o no SQL Editor do Supabase

-- Variáveis
DO $$
DECLARE
    professional_id UUID := 'afcb5388-6744-4436-9d32-b1503b933fd8';
    professional_name TEXT;
BEGIN
    -- 1. Atualizar o perfil para role 'professional'
    UPDATE public.profiles
    SET role = 'professional'
    WHERE id = professional_id
    RETURNING name INTO professional_name;
    
    IF professional_name IS NULL THEN
        RAISE EXCEPTION 'Usuário com ID % não encontrado', professional_id;
    END IF;
    
    RAISE NOTICE 'Usuário % atualizado para a role de profissional', professional_name;
    
    -- 2. Atualizar metadados de usuário para manter consistência
    -- Usa a função auxiliar que criamos no schema.sql
    PERFORM public.admin_update_user_role(professional_id, 'professional');
    
    -- 3. Limpar qualquer disponibilidade existente para evitar duplicações
    DELETE FROM public.professional_availability
    WHERE professional_id = professional_id;
    
    -- 4. Inserir disponibilidade para dias úteis (1-5: Segunda a Sexta)
    -- Horário comercial: 9h às 18h
    FOR day_num IN 1..5 LOOP
        INSERT INTO public.professional_availability
            (professional_id, day_of_week, start_time, end_time, is_available)
        VALUES
            (professional_id, day_num, '09:00:00', '18:00:00', TRUE);
    END LOOP;
    
    -- 5. Inserir disponibilidade para sábado: meio período (9h às 13h)
    INSERT INTO public.professional_availability
        (professional_id, day_of_week, start_time, end_time, is_available)
    VALUES
        (professional_id, 6, '09:00:00', '13:00:00', TRUE);
    
    -- 6. Adicionar especialidades/serviços associados ao profissional
    -- Você pode criar uma tabela especialidades ou usar metadados do usuário
    -- Este é um exemplo para registrar a relação:
    
    -- Verificar se tabela de especialidades existe (opcional)
    -- Se não existir, podemos criar
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'professional_specialties'
    ) THEN
        CREATE TABLE IF NOT EXISTS public.professional_specialties (
            id SERIAL PRIMARY KEY,
            professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
            UNIQUE(professional_id, service_id)
        );
        
        -- Adicionar política RLS
        ALTER TABLE public.professional_specialties ENABLE ROW LEVEL SECURITY;
        
        -- Política para permitir leitura por qualquer usuário autenticado
        CREATE POLICY "Leitura de especialidades para todos" 
          ON public.professional_specialties FOR SELECT 
          USING (auth.uid() IS NOT NULL);
          
        -- Política para permitir edição apenas por admin ou o próprio profissional
        CREATE POLICY "Edição de especialidades apenas por admin ou próprio" 
          ON public.professional_specialties FOR ALL 
          USING (auth.uid() = professional_id OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
          ));
    END IF;
    
    -- Remover especialidades existentes para evitar duplicidade
    DELETE FROM public.professional_specialties
    WHERE professional_id = professional_id;
    
    -- Adicionar todos os serviços como especialidades deste profissional
    INSERT INTO public.professional_specialties (professional_id, service_id)
    SELECT professional_id, id 
    FROM public.services;
    
    RAISE NOTICE 'Configuração do profissional % concluída com sucesso', professional_name;
END $$;