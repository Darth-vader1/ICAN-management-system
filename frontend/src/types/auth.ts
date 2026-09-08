export type UserRole =
  | 'super_admin'
  | 'manager'
  | 'finance'
  | 'student_officer'
  | 'it_admin'
  | 'student';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  profile: StudentProfile | StaffProfile | null;
}

export interface StudentProfile {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  other_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string;
  whatsapp_number: string;
  address: string;
  ican_exam_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  photo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  first_name: string;
  last_name: string;
  department: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  role: UserRole;
  email: string;
  is_verified: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  phone?: string;
  first_name: string;
  last_name: string;
}
