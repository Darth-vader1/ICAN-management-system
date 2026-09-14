import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomService } from '../../services/classroomService';
import { showToast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/api';
import type { ClassroomFilterParams, CreateVirtualClassData } from '../../types/classroom';

export const CLASSROOM_QUERY_KEYS = {
  all: ['classrooms'] as const,
  lists: () => [...CLASSROOM_QUERY_KEYS.all, 'list'] as const,
  list: (filters: ClassroomFilterParams) => [...CLASSROOM_QUERY_KEYS.lists(), filters] as const,
  details: () => [...CLASSROOM_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CLASSROOM_QUERY_KEYS.details(), id] as const,
  materials: (id: string) => [...CLASSROOM_QUERY_KEYS.detail(id), 'materials'] as const,
  attendance: (id: string) => [...CLASSROOM_QUERY_KEYS.detail(id), 'attendance'] as const,
  recordings: (id: string) => [...CLASSROOM_QUERY_KEYS.detail(id), 'recordings'] as const,
};

export function useVirtualClasses(filters?: ClassroomFilterParams) {
  return useQuery({
    queryKey: CLASSROOM_QUERY_KEYS.list(filters ?? {}),
    queryFn: () => classroomService.getAll(filters),
    staleTime: 5000,
    refetchInterval: 5000,
    placeholderData: [],
  });
}

export function useVirtualClass(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: CLASSROOM_QUERY_KEYS.detail(id),
    queryFn: () => classroomService.getById(id),
    staleTime: 3000,
    refetchInterval: 3000,
    enabled: enabled && Boolean(id),
  });
}

export function useCreateVirtualClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVirtualClassData) => classroomService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSROOM_QUERY_KEYS.lists() });
      showToast.success('Virtual classroom scheduled successfully!');
    },
    onError: (err) => {
      showToast.error(getErrorMessage(err));
    },
  });
}

export function useJoinVirtualClass() {
  return useMutation({
    mutationFn: (id: string) => classroomService.joinClass(id),
    onError: (err) => {
      showToast.error(getErrorMessage(err));
    },
  });
}

export function useStartVirtualClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classroomService.startClass(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CLASSROOM_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: CLASSROOM_QUERY_KEYS.lists() });
      showToast.success('Class is now LIVE!');
    },
    onError: (err) => {
      showToast.error(getErrorMessage(err));
    },
  });
}

export function useEndVirtualClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classroomService.endClass(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: CLASSROOM_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: CLASSROOM_QUERY_KEYS.lists() });
      showToast.success('Classroom session ended.');
    },
    onError: (err) => {
      showToast.error(getErrorMessage(err));
    },
  });
}

export function useClassMaterials(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: CLASSROOM_QUERY_KEYS.materials(id),
    queryFn: () => classroomService.getMaterials(id),
    enabled: enabled && Boolean(id),
  });
}

export function useUploadClassMaterial(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => classroomService.uploadMaterial(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASSROOM_QUERY_KEYS.materials(id) });
      queryClient.invalidateQueries({ queryKey: CLASSROOM_QUERY_KEYS.detail(id) });
      showToast.success('Material uploaded successfully!');
    },
    onError: (err) => {
      showToast.error(getErrorMessage(err));
    },
  });
}

export function useClassAttendance(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: CLASSROOM_QUERY_KEYS.attendance(id),
    queryFn: () => classroomService.getAttendance(id),
    enabled: enabled && Boolean(id),
  });
}

export function useClassRecordings(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: CLASSROOM_QUERY_KEYS.recordings(id),
    queryFn: () => classroomService.getRecordings(id),
    enabled: enabled && Boolean(id),
  });
}
