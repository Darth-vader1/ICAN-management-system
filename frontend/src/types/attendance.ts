/**
 * Attendance types for ICAN Platform
 * Phase 7: Attendance System
 */

export enum ClassSessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export interface ClassSession {
  id: string;
  course_offering: string;
  course_code: string;
  course_name: string;
  session_label: string;
  instructor: string | null;
  instructor_name: string | null;
  title: string;
  description: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  status: ClassSessionStatus;
  status_display: string;
  is_past: boolean;
  duration_minutes: number;
  attendance_rate: number;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  attendance_marked_at: string | null;
  attendance_marked_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  class_session: string;
  student: string;
  student_name: string;
  student_id_number: string;
  status: AttendanceStatus;
  status_display: string;
  marked_at: string;
  marked_by: string | null;
  marked_by_name: string | null;
  notes: string;
  arrival_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceMarkRequest {
  records: AttendanceMarkRecord[];
}

export interface AttendanceMarkRecord {
  student: string;
  status: AttendanceStatus;
  notes?: string;
  arrival_time?: string;
}

export interface AttendanceMarkResponse {
  created: number;
  updated: number;
  errors: Array<{ student: string; error: string }>;
  created_records: AttendanceRecord[];
  updated_records: AttendanceRecord[];
}

export interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  student_id_number: string;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
}

export interface CourseAttendanceStats {
  course_offering_id: string;
  course_code: string;
  course_name: string;
  total_sessions: number;
  total_students: number;
  average_attendance_rate: number;
  sessions_completed: number;
}
