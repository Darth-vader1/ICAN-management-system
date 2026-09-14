import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/api';
import { studentService, type StudentProfile } from '../../services/studentService';

interface StudentListParams {
  page?: number;
  search?: string;
  enabled?: boolean;
}

export function useStudents(params?: StudentListParams, enabled: boolean = true) {
  const isEnabled = params?.enabled ?? enabled;
  return useQuery({
    queryKey: QUERY_KEYS.students.list(params ?? {}),
    queryFn: () => studentService.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    enabled: isEnabled,
    throwOnError: false,
  });
}

export function useStudent(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.students.detail(id),
    queryFn: () => studentService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

export function useMyStudentProfile(enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.students.myProfile(),
    queryFn: () => studentService.getMyProfile(),
    staleTime: 5 * 60 * 1000,
    enabled,
    throwOnError: false,
  });
}

interface CreateStudentVariables {
  data: Partial<StudentProfile>;
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateStudentVariables) => studentService.create(data),
    onSuccess: (newStudent) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students.lists() });
      queryClient.setQueryData(QUERY_KEYS.students.detail(newStudent.id), newStudent);
      showToast.success('Student created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateStudentVariables {
  id: string;
  data: Partial<StudentProfile>;
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateStudentVariables) => studentService.update(id, data),
    onSuccess: (updatedStudent) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students.lists() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students.myProfile() });
      queryClient.setQueryData(QUERY_KEYS.students.detail(updatedStudent.id), updatedStudent);
      showToast.success('Student updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteStudentVariables {
  id: string;
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteStudentVariables) => studentService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students.lists() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.students.detail(variables.id) });
      showToast.success('Student deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}
