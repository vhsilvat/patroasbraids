#!/bin/bash

# Configuração
PROJECT_REF="" # Substitua pelo seu project reference do Supabase
ADMIN_EMAIL="" # Substitua pelo email do admin

# Verificar se as variáveis foram configuradas
if [ -z "$PROJECT_REF" ] || [ -z "$ADMIN_EMAIL" ]; then
  echo "Por favor, configure as variáveis PROJECT_REF e ADMIN_EMAIL no script"
  exit 1
fi

# Solicitar a chave de acesso
echo "Digite a service_role key do seu projeto Supabase:"
read -s SERVICE_KEY

if [ -z "$SERVICE_KEY" ]; then
  echo "Chave de acesso não fornecida"
  exit 1
fi

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI não está instalado. Por favor, instale-o primeiro."
  echo "npm install -g supabase"
  exit 1
fi

# Verificar se o usuário existe
echo "Verificando se o usuário existe..."
USER_ID=$(curl -s \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  "https://$PROJECT_REF.supabase.co/rest/v1/rpc/get_user_id" \
  -d "{\"email\":\"$ADMIN_EMAIL\"}" | jq -r '.id')

if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
  echo "Usuário não encontrado. Crie primeiro uma conta com este email pelo aplicativo."
  exit 1
fi

echo "Usuário encontrado com ID: $USER_ID"

# Promover usuário para admin na tabela profiles
echo "Promovendo usuário para admin na tabela profiles..."
UPDATE_PROFILE=$(curl -s \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -X PATCH "https://$PROJECT_REF.supabase.co/rest/v1/profiles?id=eq.$USER_ID" \
  -d "{\"role\":\"admin\"}")

if [ ! -z "$UPDATE_PROFILE" ]; then
  echo "Erro ao atualizar perfil: $UPDATE_PROFILE"
  exit 1
fi

# Atualizar os metadados do usuário
echo "Atualizando metadados do usuário..."

# Obter metadados atuais
USER_META=$(curl -s \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  "https://$PROJECT_REF.supabase.co/rest/v1/rpc/admin_get_user_meta?id=$USER_ID")

# Usar função RPC personalizada para atualizar os metadados
UPDATE_META=$(curl -s \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  "https://$PROJECT_REF.supabase.co/rest/v1/rpc/admin_update_user_role" \
  -d "{\"uid\":\"$USER_ID\",\"role\":\"admin\"}")

echo "Usuário promovido para admin com sucesso!"

# Verificar se a atualização foi bem-sucedida
VERIFICATION=$(curl -s \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  "https://$PROJECT_REF.supabase.co/rest/v1/profiles?id=eq.$USER_ID&select=id,email,role")

echo "Perfil atualizado:"
echo "$VERIFICATION" | jq

echo "Processo concluído com sucesso!"