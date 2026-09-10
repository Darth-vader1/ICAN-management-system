import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../lib/queryKeys';
import { showToast } from '../../lib/toast';
import { getErrorMessage } from '../../lib/api';
import {
  sessionsService,
  levelsService,
  coursesService,
  offeringsService,
  classesService,
  schedulesService,
} from '../../services/academicsService';
import type {
  AcademicSession,
  AcademicSessionFormData,
  Level,
  LevelFormData,
  Course,
  CourseListItem,
  CourseFormData,
  CourseOffering,
  CourseOfferingListItem,
  CourseOfferingFormData,
  Class,
  ClassFormData,
  ClassSchedule,
  ClassScheduleListItem,
  ClassScheduleFormData,
} from '../../types/academics';

interface AcademicSessionFilters {
  [key: string]: unknown;
}

export function useAcademicSessions(filters?: AcademicSessionFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.sessions.list(filters),
    queryFn: () => sessionsService.getAll(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useAcademicSession(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.sessions.detail(id),
    queryFn: () => sessionsService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface CreateAcademicSessionVariables {
  data: AcademicSessionFormData;
}

export function useCreateAcademicSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateAcademicSessionVariables) => sessionsService.create(data),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.sessions.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.sessions.detail(newSession.id), newSession);
      showToast.success('Academic session created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateAcademicSessionVariables {
  id: string;
  data: Partial<AcademicSessionFormData>;
}

export function useUpdateAcademicSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateAcademicSessionVariables) => sessionsService.update(id, data),
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.sessions.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.sessions.detail(updatedSession.id), updatedSession);
      showToast.success('Academic session updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteAcademicSessionVariables {
  id: string;
}

export function useDeleteAcademicSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteAcademicSessionVariables) => sessionsService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.sessions.list() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.academics.sessions.detail(variables.id) });
      showToast.success('Academic session deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface LevelFilters {
  [key: string]: unknown;
}

export function useLevels(filters?: LevelFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.levels.list(filters),
    queryFn: () => levelsService.getAll(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useLevel(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.levels.detail(id),
    queryFn: () => levelsService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface CreateLevelVariables {
  data: LevelFormData;
}

export function useCreateLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateLevelVariables) => levelsService.create(data),
    onSuccess: (newLevel) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.levels.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.levels.detail(newLevel.id), newLevel);
      showToast.success('Level created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateLevelVariables {
  id: string;
  data: Partial<LevelFormData>;
}

export function useUpdateLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateLevelVariables) => levelsService.update(id, data),
    onSuccess: (updatedLevel) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.levels.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.levels.detail(updatedLevel.id), updatedLevel);
      showToast.success('Level updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteLevelVariables {
  id: string;
}

export function useDeleteLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteLevelVariables) => levelsService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.levels.list() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.academics.levels.detail(variables.id) });
      showToast.success('Level deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface CourseFilters {
  level?: string;
  is_active?: boolean;
}

export function useCourses(filters?: CourseFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.courses.list(filters),
    queryFn: () => coursesService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useCourse(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.courses.detail(id),
    queryFn: () => coursesService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface OfferingFilters {
  session?: string;
  course?: string;
  is_active?: boolean;
}

export function useOfferings(filters?: OfferingFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.offerings.list(filters),
    queryFn: () => offeringsService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useOffering(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.offerings.detail(id),
    queryFn: () => offeringsService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface ClassFilters {
  course_offering?: string;
  is_active?: boolean;
}

export function useClasses(filters?: ClassFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.classes.list(filters),
    queryFn: () => classesService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useClass(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.classes.detail(id),
    queryFn: () => classesService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && Boolean(id),
    throwOnError: false,
  });
}

interface CreateCourseVariables {
  data: CourseFormData;
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateCourseVariables) => coursesService.create(data),
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.courses.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.courses.detail(newCourse.id), newCourse);
      showToast.success('Course created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateCourseVariables {
  id: string;
  data: Partial<CourseFormData>;
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateCourseVariables) => coursesService.update(id, data),
    onSuccess: (updatedCourse) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.courses.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.courses.detail(updatedCourse.id), updatedCourse);
      showToast.success('Course updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteCourseVariables {
  id: string;
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteCourseVariables) => coursesService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.courses.list() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.academics.courses.detail(variables.id) });
      showToast.success('Course deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface CreateOfferingVariables {
  data: CourseOfferingFormData;
}

export function useCreateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateOfferingVariables) => offeringsService.create(data),
    onSuccess: (newOffering) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.offerings.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.offerings.detail(newOffering.id), newOffering);
      showToast.success('Course offering created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateOfferingVariables {
  id: string;
  data: Partial<CourseOfferingFormData>;
}

export function useUpdateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateOfferingVariables) => offeringsService.update(id, data),
    onSuccess: (updatedOffering) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.offerings.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.offerings.detail(updatedOffering.id), updatedOffering);
      showToast.success('Course offering updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteOfferingVariables {
  id: string;
}

export function useDeleteOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteOfferingVariables) => offeringsService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.offerings.list() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.academics.offerings.detail(variables.id) });
      showToast.success('Course offering deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface ScheduleFilters {
  class_instance?: string;
  date?: string;
  is_cancelled?: boolean;
}

export function useSchedules(filters?: ScheduleFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.schedules.list(filters),
    queryFn: () => schedulesService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

export function useUpcomingSchedules(filters?: ScheduleFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.schedules.upcoming(filters),
    queryFn: () => schedulesService.getUpcoming(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

interface TimetableFilters {
  [key: string]: unknown;
}

export function useMyTimetable(filters?: TimetableFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.academics.schedules.myTimetable(filters),
    queryFn: () => schedulesService.getUpcoming(),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    throwOnError: false,
  });
}

// ─── Class Mutations ────────────────────────────────────────────────────────

interface CreateClassVariables {
  data: ClassFormData;
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateClassVariables) => classesService.create(data),
    onSuccess: (newClass) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.classes.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.classes.detail(newClass.id), newClass);
      showToast.success('Class created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateClassVariables {
  id: string;
  data: Partial<ClassFormData>;
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateClassVariables) => classesService.update(id, data),
    onSuccess: (updatedClass) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.classes.list() });
      queryClient.setQueryData(QUERY_KEYS.academics.classes.detail(updatedClass.id), updatedClass);
      showToast.success('Class updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteClassVariables {
  id: string;
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteClassVariables) => classesService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.classes.list() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.academics.classes.detail(variables.id) });
      showToast.success('Class deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

// ─── Schedule Mutations ─────────────────────────────────────────────────────

interface CreateScheduleVariables {
  data: ClassScheduleFormData;
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateScheduleVariables) => schedulesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.schedules.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.schedules.upcoming() });
      showToast.success('Schedule created successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface UpdateScheduleVariables {
  id: string;
  data: Partial<ClassScheduleFormData>;
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateScheduleVariables) => schedulesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.schedules.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.schedules.upcoming() });
      showToast.success('Schedule updated successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}

interface DeleteScheduleVariables {
  id: string;
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteScheduleVariables) => schedulesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.schedules.list() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.academics.schedules.upcoming() });
      showToast.success('Schedule deleted successfully');
    },
    onError: (error) => {
      showToast.error(getErrorMessage(error));
    },
  });
}
