# Patroas Braids - Sistema de Agendamento

Um sistema de agendamento para o salão de beleza Patroas Braids, especializado em tranças e cabelos afro.

## Tecnologias Utilizadas

- React com TypeScript
- Vite
- TailwindCSS
- Supabase (Backend as a Service)
- Mercado Pago (Processamento de Pagamentos)

## Recursos Principais

- Autenticação de usuários (cliente, profissional, administrador)
- Agendamento de serviços com seleção de data e horário
- Pagamento online (50% como sinal)
- Gestão de profissionais e suas disponibilidades
- Painel administrativo

## Configuração do Projeto

### Pré-requisitos

- Node.js (v16+)
- Conta no Supabase
- Conta no Mercado Pago para pagamentos (opcional para desenvolvimento)

### Instalação

1. Clone o repositório:
   ```bash
   git clone git@github.com:vhsilvat/patroasbraids.git
   cd patroasbraids
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` na raiz do projeto (baseado no `.env.example`) com suas credenciais do Supabase:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)

2. Configure o banco de dados executando o script SQL disponível em `supabase/schema.sql`

3. Configure as políticas de segurança (RLS) conforme definido no script SQL

4. Configure a autenticação no painel do Supabase:
   - Habilite o login por e-mail/senha
   - Configure as URLs de redirecionamento
   - Personalize os e-mails de confirmação

5. Para a integração com Mercado Pago:

   - Deploy da função Edge Function no diretório `supabase/functions/payment-webhook`
   - Configure as variáveis de ambiente no Supabase:
     - `MP_ACCESS_TOKEN`: Token de acesso do Mercado Pago

   ```bash
   # Deployment da Edge Function (requer Supabase CLI)
   supabase functions deploy payment-webhook --project-ref seu-ref-do-projeto
   ```

## Estrutura do Projeto

```
/src
  /components     # Componentes UI reutilizáveis
  /contexts       # Contextos React (autenticação, etc.)
  /lib            # Funções utilitárias e integrações
  /pages          # Componentes de página
  /types          # Definições de tipos TypeScript
  App.tsx         # Componente principal
  index.css       # Estilos globais
  main.tsx        # Ponto de entrada

/supabase
  /functions      # Edge Functions do Supabase
  schema.sql      # Esquema do banco de dados
```

## Fluxo de Agendamento

1. Cliente seleciona um serviço
2. Cliente escolhe profissional, data e horário disponíveis
3. Sistema cria um registro de agendamento com status "pendente"
4. Cliente é redirecionado para pagamento (50% do valor como sinal)
5. Após pagamento confirmado, o status muda para "confirmado"

## Implementação do Pagamento

O sistema utiliza o Mercado Pago para processar pagamentos:

1. Quando um agendamento é criado, uma preferência de pagamento é gerada
2. Cliente é redirecionado para a página de checkout do Mercado Pago
3. Após o pagamento, o Mercado Pago notifica o sistema via webhook
4. O webhook do Supabase (Edge Function) processa a notificação e atualiza o status

## Estrutura do Banco de Dados

- **users**: Informações de usuários (via Supabase Auth)
- **profiles**: Perfis de usuários extendidos
- **services**: Serviços oferecidos pelo salão
- **professional_availability**: Disponibilidade dos profissionais
- **schedule_blockouts**: Bloqueios de agenda (férias, feriados, etc.)
- **appointments**: Agendamentos de serviços
- **payments**: Registros de pagamentos

## Licença

Este projeto é proprietário e não permite uso, cópia ou distribuição sem autorização expressa dos proprietários.

## Desenvolvido por

- Victor Hugo da Silva Teixeira (@vhsilvat)