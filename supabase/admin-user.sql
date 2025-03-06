-- IMPORTANTE: Este script deve ser executado com as permissões de serviço (service_role key)
-- e substitui os valores de exemplo pelos valores reais.

-- Variáveis: ajuste estes valores antes de executar
\set admin_email '\'seu_email@exemplo.com\''
\set admin_user_id '\'id-do-usuario\'' -- Esse valor será preenchido depois que o usuário for criado

-- Parte 1: Execute esta parte primeiro para verificar se o usuário já existe
-- e obtenha o ID do usuário.
-- Após obter o ID, atualize a variável admin_user_id acima e execute a Parte 2.

SELECT id, email, confirmed_at 
FROM auth.users 
WHERE email = :admin_email;

-- Parte 2: Execute esta parte depois de obter o ID do usuário e atualizar a variável admin_user_id

-- Atualizar o perfil para admin (precisa de service_role)
UPDATE public.profiles
SET role = 'admin'
WHERE id = :admin_user_id;

-- Verifique se a atualização foi bem-sucedida
SELECT id, email, role
FROM public.profiles
WHERE id = :admin_user_id;