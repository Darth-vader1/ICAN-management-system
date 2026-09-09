/**
 * Report Service for ICAN Platform
 * Phase 8: Reporting System
 */

import api from '../lib/api';
import type {
  FinancialSummary,
  StudentReport,
  AttendanceReport,
  PaymentReport,
  EnrollmentReport,
  ReportParams,
} from '../types/report';

/**
 * Report Service
 */
export const reportService = {
  /**
   * Get financial summary report
   */
  getFinancialSummary: async (params?: ReportParams): Promise<FinancialSummary> => {
    const response = await api.get('/reports/financial-summary/', { params });
    return response.data;
  },

  /**
   * Export financial summary report
   */
  exportFinancialSummary: async (format: 'csv' | 'excel' | 'pdf', params?: ReportParams): Promise<Blob> => {
    const response = await api.get('/reports/financial-summary/', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get student report
   */
  getStudentReport: async (studentId: string, params?: ReportParams): Promise<StudentReport> => {
    const response = await api.get('/reports/students/', {
      params: { ...params, student_id: studentId },
    });
    return response.data;
  },

  /**
   * Export student report
   */
  exportStudentReport: async (
    studentId: string,
    format: 'csv' | 'excel' | 'pdf',
    params?: ReportParams
  ): Promise<Blob> => {
    const response = await api.get('/reports/students/', {
      params: { ...params, student_id: studentId, format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get attendance report
   */
  getAttendanceReport: async (params?: ReportParams): Promise<AttendanceReport> => {
    const response = await api.get('/reports/attendance/', { params });
    return response.data;
  },

  /**
   * Export attendance report
   */
  exportAttendanceReport: async (format: 'csv' | 'excel' | 'pdf', params?: ReportParams): Promise<Blob> => {
    const response = await api.get('/reports/attendance/', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get payment report
   */
  getPaymentReport: async (params?: ReportParams): Promise<PaymentReport> => {
    const response = await api.get('/reports/payments/', { params });
    return response.data;
  },

  /**
   * Export payment report
   */
  exportPaymentReport: async (format: 'csv' | 'excel' | 'pdf', params?: ReportParams): Promise<Blob> => {
    const response = await api.get('/reports/payments/', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get enrollment report
   */
  getEnrollmentReport: async (params?: ReportParams): Promise<EnrollmentReport> => {
    const response = await api.get('/reports/enrollments/', { params });
    return response.data;
  },

  /**
   * Export enrollment report
   */
  exportEnrollmentReport: async (format: 'csv' | 'excel' | 'pdf', params?: ReportParams): Promise<Blob> => {
    const response = await api.get('/reports/enrollments/', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Helper: Download blob as file
   */
  downloadBlob: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

export default reportService;
