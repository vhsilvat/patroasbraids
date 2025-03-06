-- Configurações iniciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis para armazenar dados adicionais de usuários
-- Esta tabela será criada automaticamente com o Supabase Auth
-- mas podemos adicionar mais campos a ela
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'professional', 'client')) DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de serviços oferecidos
CREATE TABLE IF NOT EXISTS public.services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL, -- em minutos
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de disponibilidade dos profissionais
CREATE TABLE IF NOT EXISTS public.professional_availability (
  id SERIAL PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Domingo, 6 = Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de bloqueios de horário (férias, feriados, etc.)
CREATE TABLE IF NOT EXISTS public.schedule_blockouts (
  id SERIAL PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT check_times CHECK (
    (all_day = TRUE) OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
  )
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  external_reference TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Criação de políticas RLS (Row Level Security)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "Usuários podem ver seus próprios perfis" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem criar seus próprios perfis"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis" 
  ON public.profiles FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins podem atualizar todos os perfis" 
  ON public.profiles FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para serviços
CREATE POLICY "Serviços são visíveis para todos" 
  ON public.services FOR SELECT 
  USING (TRUE);

CREATE POLICY "Somente admins podem modificar serviços" 
  ON public.services FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Políticas para disponibilidade
CREATE POLICY "Disponibilidade é visível para todos" 
  ON public.professional_availability FOR SELECT 
  USING (TRUE);

CREATE POLICY "Profissionais podem gerenciar sua própria disponibilidade" 
  ON public.professional_availability FOR ALL 
  USING (professional_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Políticas para bloqueios de horário
CREATE POLICY "Bloqueios são visíveis para todos" 
  ON public.schedule_blockouts FOR SELECT 
  USING (TRUE);

CREATE POLICY "Profissionais podem gerenciar seus próprios bloqueios" 
  ON public.schedule_blockouts FOR ALL 
  USING (professional_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Políticas para agendamentos
CREATE POLICY "Usuários podem ver seus próprios agendamentos" 
  ON public.appointments FOR SELECT 
  USING (user_id = auth.uid() OR professional_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Clientes podem criar agendamentos" 
  ON public.appointments FOR INSERT 
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Usuários podem atualizar seus próprios agendamentos" 
  ON public.appointments FOR UPDATE 
  USING (user_id = auth.uid() OR professional_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Políticas para pagamentos
CREATE POLICY "Usuários podem ver seus próprios pagamentos" 
  ON public.payments FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.appointments a 
    WHERE a.id = appointment_id AND (a.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  ));

CREATE POLICY "Admins podem gerenciar pagamentos" 
  ON public.payments FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Gatilhos para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar automaticamente um perfil quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar um perfil quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Aplicar gatilho a todas as tabelas
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_availability_updated_at
  BEFORE UPDATE ON public.professional_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_blockouts_updated_at
  BEFORE UPDATE ON public.schedule_blockouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais para testes
INSERT INTO public.services (name, description, duration, price, image_url)
VALUES 
  ('Box Braids', 'Tranças Box Braids tradicionais', 300, 250.00, 'https://source.unsplash.com/random/?boxbraids'),
  ('Knotless Braids', 'Tranças Box Braids sem nós na raiz', 330, 300.00, 'https://source.unsplash.com/random/?knotlessbraids'),
  ('Crochet Braids', 'Aplicação de tranças sintéticas com técnica de crochê', 180, 180.00, 'https://source.unsplash.com/random/?crochetbraids'),
  ('Goddess Braids', 'Tranças estilo Deusa, ideais para ocasiões especiais', 240, 220.00, 'https://source.unsplash.com/random/?goddessbraids'),
  ('Passion Twists', 'Twists estilosos e volumosos', 210, 200.00, 'https://source.unsplash.com/random/?passiontwists'),
  ('Fulani Braids', 'Estilo tradicional de tranças com padrões decorativos', 270, 230.00, 'https://source.unsplash.com/random/?fulanibraids'),
  ('Butterfly Locs', 'Locs messy com aparência desestruturada', 240, 210.00, 'https://source.unsplash.com/random/?butterflylocs'),
  ('Flat Twists', 'Twists feitos rente ao couro cabeludo', 150, 170.00, 'https://source.unsplash.com/random/?flattwists');