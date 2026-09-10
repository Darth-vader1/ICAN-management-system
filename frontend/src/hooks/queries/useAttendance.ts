import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/api';
import {
  classSessionService,
  attendanceRecordService,
} from '../../services/attendanceService';
import type {
  ClassSession,
  AttendanceRecord,
  AttendanceMarkRequest,
  AttendanceMarkResponse,
  StudentAttendanceSummary,
  CourseAttendanceStats,
} from '../../types/attendance';

interface AttendanceSessionFilters {
  page?: number;
  instructor?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

interface UseAttendanceSessionsOptions {
  filters?: AttendanceSessionFilters;
  enabled?: boolean;
}

export function useAttendanceSessions(options?: UseAttendanceSessionsOptions | AttendanceSessionFilters) {
  // Support both old API (filters only) and new API (with enabled option)
  const filters = options && 'filters' in options ? options.filters : options;
  const enabled = options && 'enabled' in options ? options.enabled : true;
  
  return useQuery({
    queryKey: QUERY_KEYS.attendance.sessions.list(filters),
    queryFn: () => classSessionService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
    enabled: enabled,
  });
}

export function useAttendanceSession(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.attendance.sessions.detail(id),
    queryFn: () => classSessionService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface MarkAttendanceVariables {
  sessionId: string;
  data: AttendanceMarkRequest;
}

export function useMarkAttendance(sessionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId: sid, data }: MarkAttendanceVariables) =>
      classSessionService.markAttendance(sid, data),
    onSuccess: (response: AttendanceMarkResponse, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.sessions.attendanceRecord(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.attendance.sessions.detail(variables.sessionId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.sessions.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.myAttendance() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.courseStats() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.stats() });
      const successCount = response.created + response.updated;
      showToast.success(`Attendance marked: ${successCount} records processed`);
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface MyAttendanceFilters {
  course_offering?: string;
  [key: string]: unknown;
}

interface UseMyAttendanceOptions {
  filters?: MyAttendanceFilters;
  enabled?: boolean;
}

export function useMyAttendance(options?: UseMyAttendanceOptions | MyAttendanceFilters) {
  // Support both old API (filters only) and new API (with enabled option)
  const filters = options && 'filters' in options ? options.filters : options;
  const enabled = options && 'enabled' in options ? options.enabled : true;
  
  return useQuery({
    queryKey: QUERY_KEYS.attendance.myAttendance(filters),
    queryFn: () => attendanceRecordService.getMyAttendance(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
    enabled: enabled,
  });
}

export function useMyAttendanceSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.attendance.mySummary(),
    queryFn: async () => {
      const records = await attendanceRecordService.getMyAttendance();
      const total = records.length;
      const present = records.filter((r) => r.status === 'present').length;
      const late = records.filter((r) => r.status === 'late').length;
      const absent = records.filter((r) => r.status === 'absent').length;
      const excused = records.filter((r) => r.status === 'excused').length;
      const rate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0;
      return { total, present, late, absent, excused, rate };
    },
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });
}

interface AttendanceCourseStatsFilters {
  [key: string]: unknown;
}

interface UseAttendanceCourseStatsOptions {
  filters?: AttendanceCourseStatsFilters;
  enabled?: boolean;
}

export function useAttendanceCourseStats(options?: UseAttendanceCourseStatsOptions | AttendanceCourseStatsFilters) {
  // Support both old API (filters only) and new API (with enabled option)
  const filters = options && 'filters' in options ? options.filters : options;
  const enabled = options && 'enabled' in options ? options.enabled : true;
  
  return useQuery({
    queryKey: QUERY_KEYS.attendance.courseStats(filters),
    queryFn: () => attendanceRecordService.getCourseStats(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
    enabled: enabled,
  });
}

interface AttendanceStatsFilters {
  [key: string]: unknown;
}

export function useAttendanceStats(filters?: AttendanceStatsFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.attendance.stats(filters),
    queryFn: () => attendanceRecordService.getCourseStats(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}
