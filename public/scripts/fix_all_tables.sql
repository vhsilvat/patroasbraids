-- Script para corrigir as tabelas e políticas do Supabase
-- Para utilizar este script, copie-o e execute no SQL Editor do Supabase

-- 1. Remover todas as políticas existentes (para garantir que não há conflitos)
DROP POLICY IF EXISTS "Acesso público para usuários autenticados" ON "public"."profiles";
DROP POLICY IF EXISTS "Permitir acesso completo a admin" ON "public"."profiles";
DROP POLICY IF EXISTS "Permitir leitura a todos autenticados" ON "public"."profiles";
DROP POLICY IF EXISTS "Permitir edição apenas ao próprio usuário" ON "public"."profiles";

-- 2. Verificar e adicionar a coluna photo_url caso não exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'photo_url'
    ) THEN
        ALTER TABLE "public"."profiles" ADD COLUMN "photo_url" TEXT;
    END IF;
END
$$;

-- 3. Verificar se a tabela profiles existe, e criar caso contrário
CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT DEFAULT 'client'::text,
    "phone" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "photo_url" TEXT,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- 4. Criar índice de busca por email para otimizar consultas
CREATE INDEX IF NOT EXISTS "profiles_email_idx" ON "public"."profiles" ("email");

-- 5. Configurar RLS na tabela profiles
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de acesso simples e permissivas
-- Política para permitir que usuários autenticados leiam qualquer perfil
CREATE POLICY "Permitir leitura a todos autenticados" ON "public"."profiles"
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir que usuários editem apenas seus próprios perfis
CREATE POLICY "Permitir edição apenas ao próprio usuário" ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Política para permitir acesso completo aos administradores (apenas como exemplo)
CREATE POLICY "Permitir acesso completo a admin" ON "public"."profiles"
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- 7. Criar função para atualização do perfil
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Extrair o papel do usuário dos metadados
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    
    -- Inserir o novo perfil
    INSERT INTO public.profiles (id, email, name, role, photo_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        user_role,
        -- Gerar URL de avatar
        'https://ui-avatars.com/api/?name=' || 
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email) || 
        '&background=8B5CF6&color=fff&size=200'
    );
    
    RETURN NEW;
END;
$$;

-- 8. Reconectar o gatilho para criação automática de perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Criar uma função para garantir que cada usuário tem um perfil
CREATE OR REPLACE FUNCTION "public"."ensure_user_profile"()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO public.profiles (id, email, name, role, photo_url)
        VALUES (
            user_rec.id,
            user_rec.email,
            COALESCE(user_rec.raw_user_meta_data->>'name', user_rec.email),
            COALESCE(user_rec.raw_user_meta_data->>'role', 'client'),
            'https://ui-avatars.com/api/?name=' || 
            COALESCE(user_rec.raw_user_meta_data->>'name', user_rec.email) || 
            '&background=8B5CF6&color=fff&size=200'
        );
    END LOOP;
END;
$$;

-- 10. Rodar a função para criar perfis que faltam
SELECT public.ensure_user_profile();