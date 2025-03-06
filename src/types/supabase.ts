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
  id: number
  name: string
  specialties: string[]
  availability: string[]
  photo_url?: string
  created_at?: string
}

export type Appointment = {
  id: number
  user_id: string
  professional_id: number
  service_id: number
  date_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_id?: number
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
  created_at?: string
}