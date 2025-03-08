-- Script para corrigir as políticas de Row Level Security (RLS) na tabela payments
-- Este script adiciona políticas que permitem usuários criarem pagamentos para seus próprios agendamentos

-- 1. Remover políticas existentes que podem estar causando conflitos
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos" ON public.payments;
DROP POLICY IF EXISTS "Admins podem gerenciar pagamentos" ON public.payments;
DROP POLICY IF EXISTS "Usuários podem criar pagamentos para seus agendamentos" ON public.payments;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios pagamentos" ON public.payments;

-- 2. Garantir que RLS está ativado na tabela
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para permitir a SELEÇÃO de pagamentos
CREATE POLICY "Usuários podem ver seus próprios pagamentos" 
  ON public.payments 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a 
      WHERE a.id = appointment_id AND (a.user_id = auth.uid() OR a.professional_id = auth.uid())
    ) OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Criar política para permitir a INSERÇÃO de pagamentos
CREATE POLICY "Usuários podem criar pagamentos para seus agendamentos" 
  ON public.payments 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a 
      WHERE a.id = appointment_id AND a.user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'professional')
    )
  );

-- 5. Criar política para permitir a ATUALIZAÇÃO de pagamentos
CREATE POLICY "Usuários podem atualizar seus próprios pagamentos" 
  ON public.payments 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a 
      WHERE a.id = appointment_id AND a.user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'professional')
    )
  );

-- 6. Criar política para permitir que administradores gerenciem todos os pagamentos
CREATE POLICY "Admins podem gerenciar todos os pagamentos" 
  ON public.payments 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Política temporária (opcional) - para desenvolvimento apenas
-- Remover em produção ou ajustar conforme necessário
CREATE POLICY "Permitir temporariamente todas as operações" 
  ON public.payments 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);