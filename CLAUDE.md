# Patroas Braids - Sistema de Agendamento


## Visão Geral

Sistema de agendamento web para o salão Patroas Braids, especializado em cabelos afro e tranças. A plataforma será desenvolvida com foco em simplicidade operacional, elegância visual e eficiência técnica.

## Requisitos Funcionais

### Interface e Design
- Interface minimalista, porém esteticamente refinada
- Paleta de cores baseada na identidade visual: roxo escuro (#2D0A31) e amarelo (#FFD700)
- Responsividade completa (mobile, tablet, desktop)
- Animações sutis para melhorar a experiência do usuário
- Carregamento otimizado e rápido

### Sistema de Agendamento
- Componente interativo para seleção de serviços, datas e horários
- Visualização clara da disponibilidade em calendário
- Regras inteligentes para agendamentos:
  - Restrição de horários baseada na duração do serviço
  - Controle de capacidade diária por tipo de serviço
  - Bloqueio automático de horários indisponíveis
- Confirmação e lembretes automáticos por e-mail/SMS

### Pagamento
- Integração com Mercado Pago
- Cobrança de 50% do valor no momento do agendamento
- Fluxo de confirmação do agendamento condicionado à aprovação do pagamento
- Geração de comprovantes/recibos para clientes

### Gestão de Usuários
- Sistema de autenticação seguro
- Perfis de acesso:
  - Administrador (controle total do sistema)
  - Cabeleireiras (acesso restrito às suas agendas e clientes)
  - Clientes (acesso ao agendamento e histórico pessoal)
- Gestão de perfis e permissões via Row Level Security

## Arquitetura Técnica

### Backend
- **Supabase**:
  - PostgreSQL gerenciado para armazenamento persistente
  - Sistema de autenticação incorporado
  - Row Level Security (RLS) para controle de acesso aos dados
  - Edge Functions para lógica de negócios complexa
  - Realtime para atualizações instantâneas do calendário

### Frontend
- Framework React minimalista
  - Preact ou React + Vite para performance otimizada
  - Styled-components ou TailwindCSS para estilização
  - Componentes reutilizáveis e bem documentados
- Supabase Client para comunicação com backend
- Integração com API do Mercado Pago

### Deploy
- Frontend: Vercel/Netlify/Cloudflare Pages
- Backend: Gerenciado pelo Supabase
- Domínio personalizado apontando para o frontend

## Implementação

### Estrutura de Dados
- **Serviços**:
  - id, nome, descrição, duração, preço, imagem
- **Profissionais**:
  - id, nome, especialidades, disponibilidade, foto
- **Agendamentos**:
  - id, id_cliente, id_profissional, id_serviço, data_hora, status, pagamento
- **Usuários**:
  - id, nome, email, telefone, role (admin/cabeleireira/cliente)
- **Pagamentos**:
  - id, id_agendamento, valor, status, referência_externa

### Regras de Negócio Principais
1. Cálculo de disponibilidade baseado na duração do serviço
2. Serviços com duração superior a 6 horas não podem ser agendados após 12h
3. Limite de 2 agendamentos por dia para serviços de longa duração
4. Status do agendamento condicionado à confirmação do pagamento
5. Cancelamentos sujeitos a políticas específicas (prazo mínimo de antecedência)

### Desenvolvimento com Claude Code
- Implementação completa de ponta a ponta
- Código limpo, bem documentado e minimalista
- Priorização de performance e segurança
- Documentação detalhada para manutenção futura

## Prioridades de Desenvolvimento

1. Configuração inicial do Supabase (banco de dados, autenticação)
2. Desenvolvimento da interface básica seguindo a identidade visual
3. Implementação do sistema de agendamento com regras inteligentes
4. Integração do sistema de pagamentos
5. Implementação de perfis e controle de acesso
6. Refinamentos visuais e testes
7. Deploy da aplicação completa

---

*Este documento serve como guia de requisitos para o desenvolvimento do sistema Patroas Braids via Claude Code.*
