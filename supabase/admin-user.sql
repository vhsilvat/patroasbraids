-- IMPORTANTE: Este script deve ser executado com as permissões de serviço (service_role key)
-- e substitui os valores de exemplo pelos valores reais.

-- Variáveis: ajuste estes valores antes de executar
\set admin_email '\'toro_hugo3@hotmail.com\''
\set admin_user_id '\'638b9abf-cf48-4f39-b0a0-0904a5db7307\'' -- Substitua pelo ID do usuário real

-- Parte 1: Execute esta parte primeiro para verificar se o usuário já existe
-- e obtenha o ID do usuário.
-- Após obter o ID, atualize a variável admin_user_id acima e execute a Parte 2.

SELECT id, email, confirmed_at 
FROM auth.users 
WHERE email = :admin_email;

-- Parte 2: Execute esta parte depois de obter o ID do usuário e atualizar a variável admin_user_id

-- 1. Atualizar a tabela de perfis para admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = :admin_user_id;

-- 2. Atualizar também os metadados do usuário (isso é importante)
UPDATE auth.users
SET raw_user_meta_data = 
  jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
WHERE id = :admin_user_id;

-- 3. Se o usuário já estava autenticado, atualizar os claims
UPDATE auth.users
SET raw_app_meta_data = 
  jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  )
WHERE id = :admin_user_id;

-- Verifique se a atualização foi bem-sucedida
SELECT 
  u.id, 
  u.email, 
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as user_meta_role,
  u.raw_app_meta_data->>'role' as app_meta_role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.id = :admin_user_id;