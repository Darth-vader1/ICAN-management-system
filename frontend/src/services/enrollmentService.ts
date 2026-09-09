import apiClient from '../lib/api';
import type {
  AddCourseData,
  Enrollment,
  EnrollmentActionResponse,
  EnrollmentCreateData,
  EnrollmentFilterParams,
  EnrollmentListItem,
} from '../types/enrollment';

export const enrollmentService = {
  /**
   * Get all enrollments (staff) or own enrollments (students)
   */
  async getAll(params?: EnrollmentFilterParams): Promise<EnrollmentListItem[]> {
    const response = await apiClient.get<{ results?: EnrollmentListItem[] } | EnrollmentListItem[]>(
      '/enrollments/',
      { params }
    );
    // Handle both paginated and non-paginated responses
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results || [];
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get student's own enrollments (student role)
   */
  async getMyEnrollments(): Promise<Enrollment[]> {
    const response = await apiClient.get<{ results?: Enrollment[] } | Enrollment[]>(
      '/enrollments/my_enrollments/'
    );
    // Handle both paginated and non-paginated responses
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return response.data.results || [];
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get a single enrollment by ID
   */
  async getById(id: string): Promise<Enrollment> {
    const response = await apiClient.get<Enrollment>(`/enrollments/${id}/`);
    return response.data;
  },

  /**
   * Create a new enrollment (self-enrollment or staff-assisted)
   */
  async create(data: EnrollmentCreateData): Promise<Enrollment> {
    const response = await apiClient.post<Enrollment>('/enrollments/create_enrollment/', data);
    return response.data;
  },

  /**
   * Update enrollment details (notes, etc.)
   */
  async update(id: string, data: { notes?: string }): Promise<Enrollment> {
    const response = await apiClient.patch<Enrollment>(`/enrollments/${id}/`, data);
    return response.data;
  },

  /**
   * Delete an enrollment
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/enrollments/${id}/`);
  },

  /**
   * Activate an enrollment (change status from draft to active)
   */
  async activate(id: string): Promise<EnrollmentActionResponse> {
    const response = await apiClient.post<EnrollmentActionResponse>(
      `/enrollments/${id}/activate/`
    );
    return response.data;
  },

  /**
   * Complete an enrollment (change status to completed)
   */
  async complete(id: string): Promise<EnrollmentActionResponse> {
    const response = await apiClient.post<EnrollmentActionResponse>(
      `/enrollments/${id}/complete/`
    );
    return response.data;
  },

  /**
   * Withdraw from an enrollment (change status to withdrawn)
   */
  async withdraw(id: string, reason?: string): Promise<EnrollmentActionResponse> {
    const response = await apiClient.post<EnrollmentActionResponse>(
      `/enrollments/${id}/withdraw/`,
      { reason }
    );
    return response.data;
  },

  /**
   * Add a course to an existing enrollment
   */
  async addCourse(enrollmentId: string, data: AddCourseData): Promise<EnrollmentActionResponse> {
    const response = await apiClient.post<EnrollmentActionResponse>(
      `/enrollments/${enrollmentId}/add_course/`,
      data
    );
    return response.data;
  },

  /**
   * Drop a course from an enrollment
   */
  async dropCourse(enrollmentId: string, courseId: string): Promise<EnrollmentActionResponse> {
    const response = await apiClient.post<EnrollmentActionResponse>(
      `/enrollments/${enrollmentId}/drop_course/`,
      { enrollment_course_id: courseId }
    );
    return response.data;
  },
};
