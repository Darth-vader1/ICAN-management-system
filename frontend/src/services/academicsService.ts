import apiClient from '../lib/api';
import type {
  AcademicSession,
  AcademicSessionFormData,
  Class,
  ClassFormData,
  ClassSchedule,
  ClassScheduleFormData,
  ClassScheduleListItem,
  Course,
  CourseFormData,
  CourseListItem,
  CourseOffering,
  CourseOfferingFormData,
  CourseOfferingListItem,
  Level,
  LevelFormData,
} from '../types/academics';

// Levels
export const levelsService = {
  async getAll(): Promise<Level[]> {
    const response = await apiClient.get<Level[]>('/academics/levels/');
    return response.data;
  },

  async getById(id: string): Promise<Level> {
    const response = await apiClient.get<Level>(`/academics/levels/${id}/`);
    return response.data;
  },

  async create(data: LevelFormData): Promise<Level> {
    const response = await apiClient.post<Level>('/academics/levels/', data);
    return response.data;
  },

  async update(id: string, data: Partial<LevelFormData>): Promise<Level> {
    const response = await apiClient.patch<Level>(`/academics/levels/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/academics/levels/${id}/`);
  },
};

// Academic Sessions
export const sessionsService = {
  async getAll(): Promise<AcademicSession[]> {
    const response = await apiClient.get<AcademicSession[]>('/academics/sessions/');
    return response.data;
  },

  async getById(id: string): Promise<AcademicSession> {
    const response = await apiClient.get<AcademicSession>(`/academics/sessions/${id}/`);
    return response.data;
  },

  async getActive(): Promise<AcademicSession> {
    const response = await apiClient.get<AcademicSession>('/academics/sessions/active/');
    return response.data;
  },

  async create(data: AcademicSessionFormData): Promise<AcademicSession> {
    const response = await apiClient.post<AcademicSession>('/academics/sessions/', data);
    return response.data;
  },

  async update(id: string, data: Partial<AcademicSessionFormData>): Promise<AcademicSession> {
    const response = await apiClient.patch<AcademicSession>(`/academics/sessions/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/academics/sessions/${id}/`);
  },
};

// Courses
export const coursesService = {
  async getAll(params?: { level?: string; is_active?: boolean }): Promise<CourseListItem[]> {
    const response = await apiClient.get<CourseListItem[]>('/academics/courses/', { params });
    return response.data;
  },

  async getById(id: string): Promise<Course> {
    const response = await apiClient.get<Course>(`/academics/courses/${id}/`);
    return response.data;
  },

  async create(data: CourseFormData): Promise<Course> {
    const response = await apiClient.post<Course>('/academics/courses/', data);
    return response.data;
  },

  async update(id: string, data: Partial<CourseFormData>): Promise<Course> {
    const response = await apiClient.patch<Course>(`/academics/courses/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/academics/courses/${id}/`);
  },
};

// Course Offerings
export const offeringsService = {
  async getAll(params?: { 
    session?: string; 
    course?: string; 
    is_active?: boolean 
  }): Promise<CourseOfferingListItem[]> {
    const response = await apiClient.get<CourseOfferingListItem[]>('/academics/offerings/', { params });
    return response.data;
  },

  async getById(id: string): Promise<CourseOffering> {
    const response = await apiClient.get<CourseOffering>(`/academics/offerings/${id}/`);
    return response.data;
  },

  async create(data: CourseOfferingFormData): Promise<CourseOffering> {
    const response = await apiClient.post<CourseOffering>('/academics/offerings/', data);
    return response.data;
  },

  async update(id: string, data: Partial<CourseOfferingFormData>): Promise<CourseOffering> {
    const response = await apiClient.patch<CourseOffering>(`/academics/offerings/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/academics/offerings/${id}/`);
  },
};

// Classes
export const classesService = {
  async getAll(params?: { course_offering?: string; is_active?: boolean }): Promise<Class[]> {
    const response = await apiClient.get<Class[]>('/academics/classes/', { params });
    return response.data;
  },

  async getById(id: string): Promise<Class> {
    const response = await apiClient.get<Class>(`/academics/classes/${id}/`);
    return response.data;
  },

  async create(data: ClassFormData): Promise<Class> {
    const response = await apiClient.post<Class>('/academics/classes/', data);
    return response.data;
  },

  async update(id: string, data: Partial<ClassFormData>): Promise<Class> {
    const response = await apiClient.patch<Class>(`/academics/classes/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/academics/classes/${id}/`);
  },
};

// Class Schedules
export const schedulesService = {
  async getAll(params?: { 
    class_instance?: string; 
    date?: string;
    is_cancelled?: boolean 
  }): Promise<ClassScheduleListItem[]> {
    const response = await apiClient.get<ClassScheduleListItem[]>('/academics/schedules/', { params });
    return response.data;
  },

  async getUpcoming(): Promise<ClassScheduleListItem[]> {
    const response = await apiClient.get<ClassScheduleListItem[]>('/academics/schedules/upcoming/');
    return response.data;
  },

  async getById(id: string): Promise<ClassSchedule> {
    const response = await apiClient.get<ClassSchedule>(`/academics/schedules/${id}/`);
    return response.data;
  },

  async create(data: ClassScheduleFormData): Promise<ClassSchedule> {
    const response = await apiClient.post<ClassSchedule>('/academics/schedules/', data);
    return response.data;
  },

  async update(id: string, data: Partial<ClassScheduleFormData>): Promise<ClassSchedule> {
    const response = await apiClient.patch<ClassSchedule>(`/academics/schedules/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/academics/schedules/${id}/`);
  },
};
