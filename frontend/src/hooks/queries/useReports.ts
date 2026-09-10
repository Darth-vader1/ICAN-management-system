import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { reportService } from '../../services/reportService';
import type {
  FinancialSummary,
  StudentReport,
  AttendanceReport,
  PaymentReport,
  EnrollmentReport,
  ReportParams,
} from '../../types/report';

export function useFinancialReport(filters?: ReportParams) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.financial(filters),
    queryFn: () => reportService.getFinancialSummary(filters),
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
}

export function useAttendanceReport(filters?: ReportParams) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.attendance(filters),
    queryFn: () => reportService.getAttendanceReport(filters),
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
}

export function usePaymentsReport(filters?: ReportParams) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.payments(filters),
    queryFn: () => reportService.getPaymentReport(filters),
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
}

export function useEnrollmentReport(filters?: ReportParams) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.enrollments(filters),
    queryFn: () => reportService.getEnrollmentReport(filters),
    staleTime: 10 * 60 * 1000,
    throwOnError: false,
  });
}

export function useStudentReport(studentId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.reports.student(studentId),
    queryFn: () => reportService.getStudentReport(studentId!),
    staleTime: 10 * 60 * 1000,
    enabled: enabled && Boolean(studentId),
    throwOnError: false,
  });
}
