import { supabase } from './supabase';
import type { Service, Appointment, Professional, ProfessionalAvailability, Payment, ScheduleBlockout } from '../types/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Tipos de respostas para padronizar
interface ApiResponse<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

// Serviços

export async function getServices(): Promise<ApiResponse<Service[]>> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name');

  return { data, error };
}

export async function getServiceById(id: number): Promise<ApiResponse<Service>> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

// Profissionais

export async function getProfessionals(): Promise<ApiResponse<Professional[]>> {
  // Buscar todos os profissionais com suas especialidades
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, 
      name, 
      email, 
      role
    `)
    .eq('role', 'professional');

  if (error || !data) {
    return { data: null, error };
  }

  // Para cada profissional, buscar suas especialidades
  const enhancedProfessionals = await Promise.all(
    data.map(async (professional) => {
      // Buscar especialidades a partir da tabela de relacionamentos
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from('professional_specialties')
        .select(`
          service_id,
          services:service_id (
            name
          )
        `)
        .eq('professional_id', professional.id);
      
      // Extrair nomes dos serviços para a lista de especialidades
      const specialties = specialtiesError || !specialtiesData 
        ? [] 
        : specialtiesData.map(spec => spec.services?.name || '');

      // Construir objeto completo do profissional com valores padrão para foto
      return {
        ...professional,
        specialties,
        user_id: professional.id, // Para compatibilidade com o tipo Professional
        photo_url: professional.photo_url || 'https://randomuser.me/api/portraits/women/22.jpg',
      } as Professional;
    })
  );

  return { data: enhancedProfessionals, error: null };
}

export async function getProfessionalAvailability(professionalId: string): Promise<ApiResponse<ProfessionalAvailability[]>> {
  const { data, error } = await supabase
    .from('professional_availability')
    .select('*')
    .eq('professional_id', professionalId)
    .order('day_of_week')
    .order('start_time');

  return { data, error };
}

export async function updateProfessionalAvailability(availability: ProfessionalAvailability): Promise<ApiResponse<ProfessionalAvailability>> {
  const { data, error } = await supabase
    .from('professional_availability')
    .upsert(availability)
    .select()
    .single();

  return { data, error };
}

export async function getScheduleBlockouts(professionalId: string, startDate: string, endDate: string): Promise<ApiResponse<ScheduleBlockout[]>> {
  const { data, error } = await supabase
    .from('schedule_blockouts')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('date', startDate)
    .lte('date', endDate);

  return { data, error };
}

export async function createScheduleBlockout(blockout: Omit<ScheduleBlockout, 'id' | 'created_at'>): Promise<ApiResponse<ScheduleBlockout>> {
  const { data, error } = await supabase
    .from('schedule_blockouts')
    .insert(blockout)
    .select()
    .single();

  return { data, error };
}

export async function deleteScheduleBlockout(id: number): Promise<ApiResponse<null>> {
  const { error } = await supabase
    .from('schedule_blockouts')
    .delete()
    .eq('id', id);

  return { data: null, error };
}

// Agendamentos

export async function getAppointmentsByUserId(userId: string): Promise<ApiResponse<Appointment[]>> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      services:service_id(name, duration, price),
      professionals:professional_id(name),
      payments(status, amount)
    `)
    .eq('user_id', userId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  return { data, error };
}

export async function getAppointmentsByProfessionalId(professionalId: string): Promise<ApiResponse<Appointment[]>> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      services:service_id(name, duration, price),
      clients:user_id(name, email, phone),
      payments(status, amount)
    `)
    .eq('professional_id', professionalId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false });

  return { data, error };
}

export async function getAppointmentsForDateRange(professionalId: string, startDate: string, endDate: string): Promise<ApiResponse<Appointment[]>> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('professional_id', professionalId)
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate);

  return { data, error };
}

export async function createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<ApiResponse<Appointment>> {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select()
    .single();

  return { data, error };
}

export async function updateAppointmentStatus(id: number, status: Appointment['status']): Promise<ApiResponse<Appointment>> {
  try {
    console.log(`Atualizando status do agendamento ${id} para ${status}`);
    
    if (!id || id <= 0) {
      console.error('ID de agendamento inválido:', id);
      return { 
        data: null, 
        error: new Error(`ID de agendamento inválido: ${id}`) 
      };
    }
    
    // Atualizar o agendamento
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao atualizar agendamento ${id}:`, error);
      
      // Tentativa alternativa sem o .select() e .single()
      if (error.code === '406') {
        console.log('Tentando método alternativo de atualização...');
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ status })
          .eq('id', id);
          
        if (!updateError) {
          console.log('Agendamento atualizado com sucesso (método alternativo)');
          // Buscar o agendamento atualizado
          const { data: fetchedData } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', id)
            .single();
            
          return { data: fetchedData, error: null };
        } else {
          console.error('Erro no método alternativo:', updateError);
          return { data: null, error: updateError };
        }
      }
      
      return { data: null, error };
    }
    
    console.log('Agendamento atualizado com sucesso:', data);
    return { data, error };
  } catch (err) {
    console.error('Erro inesperado ao atualizar agendamento:', err);
    return { data: null, error: err as Error };
  }
}

// Pagamentos

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<ApiResponse<Payment>> {
  try {
    console.log('Criando pagamento:', payment);
    
    // Tenta criar o pagamento diretamente
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
      
    if (!error) {
      console.log('Pagamento criado com sucesso:', data);
      return { data, error };
    }
    
    console.error('Erro ao criar pagamento:', error);
    return { data: null, error };
  } catch (err) {
    console.error('Erro ao criar pagamento:', err);
    return { data: null, error: err as Error };
  }
}

export async function updatePaymentStatus(id: number, status: Payment['status']): Promise<ApiResponse<Payment>> {
  try {
    console.log(`Atualizando status do pagamento ${id} para ${status}`);
    
    // Incluir timestamp de atualização
    const updateData = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    // Tentar método simples primeiro (sem select/single)
    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id);
      
    if (updateError) {
      console.error('Erro ao atualizar status do pagamento:', updateError);
      return { data: null, error: updateError };
    }
    
    // Buscar o pagamento atualizado
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Erro ao buscar pagamento atualizado:', error);
      return { data: null, error };
    }
    
    console.log('Pagamento atualizado com sucesso:', data);
    
    // Atualizar o status do agendamento relacionado
    if (data && data.appointment_id > 0) {
      console.log('Atualizando status do agendamento:', data.appointment_id);
      
      try {
        const appointmentStatus = status === 'approved' ? 'confirmed' : 'pending';
        await updateAppointmentStatus(data.appointment_id, appointmentStatus as Appointment['status']);
        console.log('Status do agendamento atualizado para:', appointmentStatus);
      } catch (err) {
        console.error('Erro ao atualizar status do agendamento:', err);
      }
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Erro ao atualizar status do pagamento:', err);
    return { data: null, error: err as Error };
  }
}

// Webhooks para integração com Mercado Pago
// Estas funções seriam chamadas em uma Edge Function do Supabase
export async function handlePaymentWebhook(paymentId: number, externalReference: string, status: Payment['status']): Promise<ApiResponse<Payment>> {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status,
      external_reference: externalReference
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (!error && data) {
    // Atualizar o status do agendamento relacionado
    const appointmentStatus = status === 'approved' ? 'confirmed' : 'pending';
    await supabase
      .from('appointments')
      .update({ status: appointmentStatus })
      .eq('id', data.appointment_id);
  }

  return { data, error };
}

// Funções para usuários admin

export async function getAllUsers(): Promise<ApiResponse<any[]>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('role')
    .order('name');

  return { data, error };
}

export async function updateUserRole(userId: string, role: 'admin' | 'professional' | 'client'): Promise<ApiResponse<any>> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
}