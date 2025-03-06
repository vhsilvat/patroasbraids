export type Service = {
  id: number
  name: string
  description: string
  duration: number // em minutos
  price: number
  image_url?: string
  created_at?: string
}

export type Professional = {
  id: string // Usando o ID do usuário
  user_id: string
  name: string
  specialties: string[]
  availability: ProfessionalAvailability[]
  photo_url?: string
  created_at?: string
}

export type ProfessionalAvailability = {
  id: number
  professional_id: string
  day_of_week: number // 0-6 para domingo a sábado
  start_time: string // formato HH:MM
  end_time: string // formato HH:MM
  is_available: boolean
  created_at?: string
}

export type Appointment = {
  id: number
  user_id: string
  professional_id: string
  service_id: number
  appointment_date: string // YYYY-MM-DD
  appointment_time: string // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_id?: number
  notes?: string
  created_at?: string
}

export type User = {
  id: string
  email: string
  name: string
  phone?: string
  role: 'admin' | 'professional' | 'client'
  created_at?: string
}

export type Payment = {
  id: number
  appointment_id: number
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  external_reference?: string
  payment_method?: string
  created_at?: string
}

export type ScheduleBlockout = {
  id: number
  professional_id: string
  date: string // YYYY-MM-DD
  all_day: boolean
  start_time?: string // HH:MM
  end_time?: string // HH:MM
  reason?: string
  created_at?: string
}