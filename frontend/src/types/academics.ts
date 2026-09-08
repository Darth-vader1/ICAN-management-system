// Academic entity types for ICAN Platform

export type LevelCode = 'foundation' | 'skills' | 'professional';

export interface Level {
  id: string;
  name: string;
  code: LevelCode;
  order: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicSession {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  level: string;
  level_name: string;
  level_code: LevelCode;
  name: string;
  code: string;
  description: string;
  duration: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseListItem {
  id: string;
  code: string;
  name: string;
  level_name: string;
  is_active: boolean;
}

export interface CourseOffering {
  id: string;
  course: string;
  course_name: string;
  course_code: string;
  session: string;
  session_label: string;
  tutor: string | null;
  tutor_name: string | null;
  level_name: string;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseOfferingListItem {
  id: string;
  course_code: string;
  course_name: string;
  session_label: string;
  level_name: string;
  is_active: boolean;
}

export interface Class {
  id: string;
  course_offering: string;
  course_offering_display: string;
  course_name: string;
  session_label: string;
  name: string;
  tutor: string | null;
  tutor_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassSchedule {
  id: string;
  class_instance: string;
  class_name: string;
  course_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  meeting_url: string;
  notes: string;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassScheduleListItem {
  id: string;
  class_name: string;
  course_name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  is_cancelled: boolean;
}

// Form data types for creating/updating
export interface LevelFormData {
  name: string;
  code: LevelCode;
  order: number;
  description?: string;
  is_active?: boolean;
}

export interface AcademicSessionFormData {
  label: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface CourseFormData {
  level: string;
  name: string;
  code: string;
  description?: string;
  duration?: number;
  is_active?: boolean;
}

export interface CourseOfferingFormData {
  course: string;
  session: string;
  tutor?: string;
  capacity?: number;
  is_active?: boolean;
}

export interface ClassFormData {
  course_offering: string;
  name: string;
  tutor?: string;
  is_active?: boolean;
}

export interface ClassScheduleFormData {
  class_instance: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  notes?: string;
  is_cancelled?: boolean;
}
