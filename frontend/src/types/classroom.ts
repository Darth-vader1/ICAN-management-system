// TypeScript definitions for Virtual Classroom Module

export type VirtualClassStatus = 'SCHEDULED' | 'LOBBY' | 'LIVE' | 'ENDED' | 'CANCELLED';
export type RecordingStatus = 'NOT_STARTED' | 'RECORDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type AttendanceStatus = 'PRESENT' | 'PARTIAL' | 'ABSENT';

export interface ClassMaterial {
  id: string;
  virtual_class: string;
  title: string;
  description?: string;
  file: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface ClassRecording {
  id: string;
  virtual_class: string;
  provider: string;
  egress_id?: string;
  playback_url: string;
  duration_seconds: number;
  status: RecordingStatus;
  available_at?: string;
  created_at: string;
}

export interface ClassParticipation {
  id: string;
  joined_at: string;
  left_at?: string;
  duration_seconds: number;
}

export interface ClassAttendance {
  id: string;
  virtual_class: string;
  student: string;
  student_name: string;
  student_code: string;
  first_joined_at?: string;
  last_left_at?: string;
  total_duration_seconds: number;
  total_duration_minutes: number;
  attendance_status: AttendanceStatus;
  participations: ClassParticipation[];
  updated_at: string;
}

export interface VirtualClassListItem {
  id: string;
  course_offering: string;
  course_code: string;
  course_name: string;
  level_name: string;
  session_label: string;
  instructor?: string;
  instructor_name: string;
  title: string;
  description: string;
  scheduled_start: string;
  scheduled_end: string;
  status: VirtualClassStatus;
  room_name: string;
  recording_enabled: boolean;
  recording_status: RecordingStatus;
  materials_count: number;
  recordings_count: number;
  created_at: string;
}

export interface VirtualClassDetail extends VirtualClassListItem {
  materials: ClassMaterial[];
  recordings: ClassRecording[];
  is_instructor: boolean;
  is_joinable: boolean;
}

export interface JoinTokenResponse {
  token: string;
  url: string;
  room_name: string;
  identity: string;
  display_name: string;
  role: 'instructor' | 'student';
  is_instructor: boolean;
  can_screen_share: boolean;
  can_moderate: boolean;
}

export interface CreateVirtualClassData {
  course_offering: string;
  instructor?: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  recording_enabled?: boolean;
  status?: VirtualClassStatus;
}

export interface ClassroomFilterParams {
  course_offering?: string;
  status?: VirtualClassStatus;
  session?: string;
  date?: string;
}
