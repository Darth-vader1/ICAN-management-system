import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/api';
import { enrollmentService } from '../../services/enrollmentService';
import type {
  Enrollment,
  EnrollmentListItem,
  EnrollmentCreateData,
  EnrollmentFilterParams,
  EnrollmentActionResponse,
  AddCourseData,
} from '../../types/enrollment';

export function useEnrollments(filters?: EnrollmentFilterParams) {
  return useQuery({
    queryKey: QUERY_KEYS.enrollments.list(filters ?? {}),
    queryFn: () => enrollmentService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

interface MyEnrollmentsFilters {
  [key: string]: unknown;
}

export function useMyEnrollments(filters?: MyEnrollmentsFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.enrollments.myEnrollments(filters),
    queryFn: () => enrollmentService.getMyEnrollments(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useEnrollment(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.enrollments.detail(id),
    queryFn: () => enrollmentService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface CreateEnrollmentVariables {
  data: EnrollmentCreateData;
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateEnrollmentVariables) => enrollmentService.create(data),
    onSuccess: (newEnrollment) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.myEnrollments() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.billing.all });
      queryClient.setQueryData(QUERY_KEYS.enrollments.detail(newEnrollment.id), newEnrollment);
      showToast.success('Enrollment created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface ActivateEnrollmentVariables {
  id: string;
}

export function useActivateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: ActivateEnrollmentVariables) => enrollmentService.activate(id),
    onSuccess: (response: EnrollmentActionResponse, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.detail(variables.id) });
      showToast.success(response.message || 'Enrollment activated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface CompleteEnrollmentVariables {
  id: string;
}

export function useCompleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: CompleteEnrollmentVariables) => enrollmentService.complete(id),
    onSuccess: (response: EnrollmentActionResponse, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.detail(variables.id) });
      showToast.success(response.message || 'Enrollment completed successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface WithdrawEnrollmentVariables {
  id: string;
  reason?: string;
}

export function useWithdrawEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: WithdrawEnrollmentVariables) => enrollmentService.withdraw(id, reason),
    onSuccess: (response: EnrollmentActionResponse, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.detail(variables.id) });
      showToast.success(response.message || 'Enrollment withdrawn successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface AddCourseToEnrollmentVariables {
  enrollmentId: string;
  data: AddCourseData;
}

export function useAddCourseToEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, data }: AddCourseToEnrollmentVariables) =>
      enrollmentService.addCourse(enrollmentId, data),
    onSuccess: (response: EnrollmentActionResponse, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.detail(variables.enrollmentId) });
      showToast.success(response.message || 'Course added to enrollment successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DropCourseFromEnrollmentVariables {
  enrollmentId: string;
  courseId: string;
}

export function useDropCourseFromEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, courseId }: DropCourseFromEnrollmentVariables) =>
      enrollmentService.dropCourse(enrollmentId, courseId),
    onSuccess: (response: EnrollmentActionResponse, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.enrollments.detail(variables.enrollmentId) });
      showToast.success(response.message || 'Course dropped from enrollment successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}
