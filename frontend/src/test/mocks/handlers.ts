/**
 * MSW (Mock Service Worker) request handlers
 * Define mock API responses for testing
 */
import { http, HttpResponse } from 'msw';
import { mockStudent, mockStaff, mockAdmin, mockTokens } from '../test-utils';

const API_URL = 'http://localhost:8000/api';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/users/login/`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    if (body.email === 'student@ican.edu' && body.password === 'testpass123') {
      return HttpResponse.json({
        ...mockTokens,
        user: mockStudent,
      });
    }
    
    if (body.email === 'staff@ican.edu' && body.password === 'testpass123') {
      return HttpResponse.json({
        ...mockTokens,
        user: mockStaff,
      });
    }
    
    return HttpResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/users/register/`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    return HttpResponse.json({
      ...mockTokens,
      user: {
        id: '999',
        email: body.email,
        role: 'student',
        is_active: true,
      },
    }, { status: 201 });
  }),

  http.get(`${API_URL}/users/me/`, () => {
    return HttpResponse.json(mockStudent);
  }),

  // Students endpoints
  http.get(`${API_URL}/students/`, () => {
    return HttpResponse.json({
      count: 2,
      results: [
        {
          id: '1',
          student_code: 'ICAN-000001',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@ican.edu',
          is_active: true,
        },
        {
          id: '2',
          student_code: 'ICAN-000002',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@ican.edu',
          is_active: true,
        },
      ],
    });
  }),

  http.get(`${API_URL}/students/me/`, () => {
    return HttpResponse.json({
      id: '1',
      student_code: 'ICAN-000001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'student@ican.edu',
      user: mockStudent.id,
    });
  }),

  // Academics endpoints
  http.get(`${API_URL}/academics/levels/`, () => {
    return HttpResponse.json({
      results: [
        { id: '1', name: 'Foundation', code: 'FOUND', order: 1 },
        { id: '2', name: 'Skill', code: 'SKILL', order: 2 },
        { id: '3', name: 'Professional', code: 'PROF', order: 3 },
      ],
    });
  }),

  http.get(`${API_URL}/academics/sessions/`, () => {
    return HttpResponse.json({
      results: [
        {
          id: '1',
          name: '2024/2025',
          start_date: '2024-09-01',
          end_date: '2025-08-31',
          is_active: true,
        },
      ],
    });
  }),

  http.get(`${API_URL}/academics/courses/`, () => {
    return HttpResponse.json({
      results: [
        {
          id: '1',
          name: 'Financial Accounting',
          code: 'FAC101',
          level: '1',
        },
        {
          id: '2',
          name: 'Management Accounting',
          code: 'MAC101',
          level: '1',
        },
      ],
    });
  }),

  // Enrollments endpoints
  http.get(`${API_URL}/enrollments/`, () => {
    return HttpResponse.json({
      results: [
        {
          id: '1',
          student: {
            id: '1',
            student_code: 'ICAN-000001',
            full_name: 'John Doe',
          },
          session: {
            id: '1',
            name: '2024/2025',
          },
          level: {
            id: '1',
            name: 'Foundation',
          },
          status: 'active',
          student_code: 'EN-000001',
          courses: [],
        },
      ],
    });
  }),

  // Billing endpoints
  http.get(`${API_URL}/billing/invoices/`, () => {
    return HttpResponse.json({
      results: [
        {
          id: '1',
          invoice_number: 'INV-000001',
          amount: '50000.00',
          amount_paid: '20000.00',
          balance: '30000.00',
          status: 'pending',
          due_date: '2026-12-31',
        },
      ],
    });
  }),

  http.get(`${API_URL}/billing/payments/`, () => {
    return HttpResponse.json({
      results: [
        {
          id: '1',
          reference: 'PAY-000001',
          amount: '20000.00',
          payment_method: 'paystack',
          status: 'completed',
          created_at: '2026-09-01T10:00:00Z',
        },
      ],
    });
  }),

  // Attendance endpoints
  http.get(`${API_URL}/attendance/records/`, () => {
    return HttpResponse.json({
      results: [],
    });
  }),

  // Notifications endpoints
  http.get(`${API_URL}/notifications/`, () => {
    return HttpResponse.json({
      results: [
        {
          id: '1',
          title: 'Welcome',
          message: 'Welcome to ICAN Platform',
          is_read: false,
          created_at: '2026-09-01T10:00:00Z',
        },
      ],
    });
  }),

  // Reports endpoints
  http.get(`${API_URL}/reports/dashboard/`, () => {
    return HttpResponse.json({
      total_students: 150,
      active_enrollments: 120,
      total_revenue: '7500000.00',
      pending_payments: '2500000.00',
    });
  }),
];
