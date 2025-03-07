-- SCRIPT COMPLETO PARA CRIAR PERFIL E CONFIGURAR PROFISSIONAL NA PLATAFORMA PATROAS BRAIDS
-- Para usar: Cole este script inteiro no SQL Editor do Supabase e execute

-- Parte 1: Garantir que a tabela de especialidades existe
CREATE TABLE IF NOT EXISTS public.professional_specialties (
    id SERIAL PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(professional_id, service_id)
);

-- Configurar RLS
ALTER TABLE public.professional_specialties ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas de acesso
DROP POLICY IF EXISTS "Leitura de especialidades para todos" ON public.professional_specialties;
CREATE POLICY "Leitura de especialidades para todos" 
  ON public.professional_specialties FOR SELECT 
  USING (auth.uid() IS NOT NULL);
  
DROP POLICY IF EXISTS "Edição de especialidades apenas por admin ou próprio" ON public.professional_specialties;
CREATE POLICY "Edição de especialidades apenas por admin ou próprio" 
  ON public.professional_specialties FOR ALL 
  USING (
    auth.uid() = professional_id 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Parte 2: Verificar e criar perfil para o usuário se necessário
DO $$
DECLARE
    target_user_id UUID := 'afcb5388-6744-4436-9d32-b1503b933fd8';
    user_email TEXT;
    user_name TEXT;
    profile_exists BOOLEAN;
BEGIN
    -- 1. Verificar se o usuário existe em auth.users
    SELECT email, raw_user_meta_data->>'name' 
    INTO user_email, user_name
    FROM auth.users 
    WHERE id = target_user_id;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'Usuário com ID % não existe na tabela auth.users', target_user_id;
    END IF;
    
    -- Se não havia name nos metadados, usar email como nome
    IF user_name IS NULL THEN
        user_name := split_part(user_email, '@', 1);
    END IF;
    
    -- 2. Verificar se o perfil já existe
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) INTO profile_exists;
    
    -- 3. Criar perfil se não existir
    IF NOT profile_exists THEN
        INSERT INTO public.profiles (id, email, name, role) 
        VALUES (target_user_id, user_email, user_name, 'client');
        RAISE NOTICE 'Perfil criado para o usuário % com email %', user_name, user_email;
    END IF;
END $$;

-- Parte 3: Configurar o usuário como profissional
DO $$
DECLARE
    target_user_id UUID := 'afcb5388-6744-4436-9d32-b1503b933fd8';
    professional_name TEXT;
    professional_email TEXT;
BEGIN
    -- 1. Atualizar o perfil para role 'professional'
    UPDATE public.profiles
    SET role = 'professional'
    WHERE id = target_user_id
    RETURNING name, email INTO professional_name, professional_email;
    
    RAISE NOTICE 'Usuário % (%) atualizado para a role de profissional', professional_name, professional_email;
    
    -- 2. Atualizar metadados de usuário no auth.users
    UPDATE auth.users
    SET raw_user_meta_data = 
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        concat('"professional"')::jsonb
      ),
      raw_app_meta_data = 
      jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{role}',
        concat('"professional"')::jsonb
      )
    WHERE id = target_user_id;
    
    -- 3. Limpar qualquer disponibilidade existente para evitar duplicações
    DELETE FROM public.professional_availability
    WHERE professional_id = target_user_id;
    
    -- 4. Inserir disponibilidade para dias úteis (1-5: Segunda a Sexta)
    -- Horário comercial: 9h às 18h
    FOR day_num IN 1..5 LOOP
        INSERT INTO public.professional_availability
            (professional_id, day_of_week, start_time, end_time, is_available)
        VALUES
            (target_user_id, day_num, '09:00:00', '18:00:00', TRUE);
    END LOOP;
    
    -- 5. Inserir disponibilidade para sábado: meio período (9h às 13h)
    INSERT INTO public.professional_availability
        (professional_id, day_of_week, start_time, end_time, is_available)
    VALUES
        (target_user_id, 6, '09:00:00', '13:00:00', TRUE);
    
    -- 6. Adicionar todas as especialidades para o profissional
    DELETE FROM public.professional_specialties
    WHERE professional_id = target_user_id;
    
    -- Adicionar todos os serviços como especialidades
    INSERT INTO public.professional_specialties (professional_id, service_id)
    SELECT target_user_id, id 
    FROM public.services;
    
    RAISE NOTICE 'Configuração concluída para o profissional %', professional_name;
    RAISE NOTICE 'ID: %, Role: professional', target_user_id;
    RAISE NOTICE 'Disponibilidade configurada para horário comercial (9h-18h seg-sex, 9h-13h sáb)';
    RAISE NOTICE 'Todas as especialidades/serviços foram atribuídos a este profissional';
END $$;