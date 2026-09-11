import type { UserRole } from './auth';
import type { EnrollmentListItem } from './enrollment';

export interface AttendanceSummary {
  total_sessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_rate: number;
  per_course: Array<{
    course_code: string;
    course_name: string;
    sessions: number;
    present: number;
    attendance_rate: number;
  }>;
}

export interface StudentListItem {
  id: string;
  student_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  other_name: string;
  full_name: string;
  email: string;
  whatsapp_number: string;
  phone_number: string;
  level_name: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user: string;
  user_email?: string;
  user_role?: UserRole;
  student_id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  other_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string;
  phone_number: string;
  whatsapp_number: string;
  address: string;
  ican_exam_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  photo: string | null;
  is_active: boolean;
  level_name?: string;
  total_fees?: number | string;
  amount_paid?: number | string;
  balance?: number | string;
  payment_status?: string;
  payments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentCreateData {
  first_name: string;
  last_name: string;
  other_name?: string;
  email: string;
  phone_number?: string;
  whatsapp_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  ican_exam_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  password?: string;
}

export interface StudentUpdateData extends Partial<StudentCreateData> {
  is_active?: boolean;
}

export interface StudentSearchResult {
  id: string;
  student_code: string;
  full_name: string;
  email: string;
  level_name?: string;
}

export interface StudentImportResult {
  created: number;
  updated: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

export interface StudentEnrollments {
  student_id: string;
  enrollments: EnrollmentListItem[];
}

export interface StudentAttendanceSummary extends AttendanceSummary {
  student_id: string;
}
