// Enrollment entity types for ICAN Platform

export type EnrollmentStatus = 'draft' | 'active' | 'completed' | 'withdrawn' | 'suspended';

export interface EnrollmentCourse {
  id: string;
  course_offering: string;
  course_code: string;
  course_name: string;
  session_label: string;
  level_name: string;
  tutor_name: string | null;
  enrolled_date: string;
  dropped: boolean;
  dropped_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student: string;
  student_name: string;
  student_code: string;
  session: string;
  session_label: string;
  level: string;
  level_name: string;
  level_code: string;
  status: EnrollmentStatus;
  enrollment_date: string;
  approval_date: string | null;
  completion_date: string | null;
  notes: string;
  courses: EnrollmentCourse[];
  created_at: string;
  updated_at: string;
}

export interface EnrollmentListItem {
  id: string;
  student_name: string;
  student_code: string;
  session_label: string;
  level_name: string;
  status: EnrollmentStatus;
  enrollment_date: string;
  course_count: number;
}

// Form data types for creating/updating
export interface EnrollmentCreateData {
  session: string;
  level: string;
  course_offerings: string[];
  notes?: string;
  student?: string; // Optional for staff creating enrollment for a student
}

export interface AddCourseData {
  course_offering: string;
}

export interface EnrollmentFilterParams {
  session?: string;
  level?: string;
  status?: EnrollmentStatus;
  student?: string;
}

// Response types for custom actions
export interface EnrollmentActionResponse {
  success: boolean;
  message: string;
  enrollment?: Enrollment;
}
