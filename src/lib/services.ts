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
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('role', 'professional');

  return { data, error };
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
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

// Pagamentos

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<ApiResponse<Payment>> {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();

  return { data, error };
}

export async function updatePaymentStatus(id: number, status: Payment['status']): Promise<ApiResponse<Payment>> {
  const { data, error } = await supabase
    .from('payments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
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