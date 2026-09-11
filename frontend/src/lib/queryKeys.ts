export const QUERY_KEYS = {
  auth: {
    all: ['auth'] as const,
    me: () => [...QUERY_KEYS.auth.all, 'me'] as const,
    profile: () => [...QUERY_KEYS.auth.all, 'profile'] as const,
    permissions: () => [...QUERY_KEYS.auth.all, 'permissions'] as const,
  },

  students: {
    all: ['students'] as const,
    lists: () => [...QUERY_KEYS.students.all, 'list'] as const,
    list: (filters: Record<string, unknown> = {}) =>
      [...QUERY_KEYS.students.lists(), filters] as const,
    details: () => [...QUERY_KEYS.students.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.students.details(), id] as const,
    myProfile: () => [...QUERY_KEYS.students.all, 'my-profile'] as const,
    enrollments: (studentId: string) =>
      [...QUERY_KEYS.students.details(), studentId, 'enrollments'] as const,
    attendanceSummary: (studentId: string) =>
      [...QUERY_KEYS.students.details(), studentId, 'attendance-summary'] as const,
    search: (query: string) => [...QUERY_KEYS.students.all, 'search', query] as const,
  },

  academics: {
    all: ['academics'] as const,

    sessions: {
      all: ['academics', 'sessions'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['academics', 'sessions', 'list'], filters] as const,
      detail: (id: string) => ['academics', 'sessions', 'detail', id] as const,
    },

    levels: {
      all: ['academics', 'levels'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['academics', 'levels', 'list'], filters] as const,
      detail: (id: string) => ['academics', 'levels', 'detail', id] as const,
    },

    courses: {
      all: ['academics', 'courses'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['academics', 'courses', 'list'], filters] as const,
      detail: (id: string) => ['academics', 'courses', 'detail', id] as const,
    },

    offerings: {
      all: ['academics', 'offerings'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['academics', 'offerings', 'list'], filters] as const,
      detail: (id: string) => ['academics', 'offerings', 'detail', id] as const,
      roster: (id: string) => ['academics', 'offerings', 'detail', id, 'roster'] as const,
    },

    classes: {
      all: ['academics', 'classes'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['academics', 'classes', 'list'], filters] as const,
      detail: (id: string) => ['academics', 'classes', 'detail', id] as const,
      schedules: (id: string) =>
        ['academics', 'classes', 'detail', id, 'schedules'] as const,
    },

    schedules: {
      all: ['academics', 'schedules'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['academics', 'schedules', 'list'], filters] as const,
      upcoming: (filters?: Record<string, unknown>) =>
        [...['academics', 'schedules', 'upcoming'], filters] as const,
      myTimetable: (filters?: Record<string, unknown>) =>
        [...['academics', 'schedules', 'my-timetable'], filters] as const,
    },
  },

  enrollments: {
    all: ['enrollments'] as const,
    lists: () => [...QUERY_KEYS.enrollments.all, 'list'] as const,
    list: (filters: Record<string, unknown> = {}) =>
      [...QUERY_KEYS.enrollments.lists(), filters] as const,
    myEnrollments: (filters?: Record<string, unknown>) =>
      [...QUERY_KEYS.enrollments.all, 'my', filters] as const,
    details: () => [...QUERY_KEYS.enrollments.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.enrollments.details(), id] as const,
  },

  billing: {
    all: ['billing'] as const,

    fees: {
      all: ['billing', 'fees'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['billing', 'fees', 'list'], filters] as const,
      detail: (id: string) => ['billing', 'fees', 'detail', id] as const,
    },

    invoices: {
      all: ['billing', 'invoices'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['billing', 'invoices', 'list'], filters] as const,
      detail: (id: string) => ['billing', 'invoices', 'detail', id] as const,
      myInvoices: (filters?: Record<string, unknown>) =>
        [...['billing', 'invoices', 'my'], filters] as const,
    },

    payments: {
      all: ['billing', 'payments'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['billing', 'payments', 'list'], filters] as const,
      detail: (id: string) => ['billing', 'payments', 'detail', id] as const,
      myPayments: (filters?: Record<string, unknown>) =>
        [...['billing', 'payments', 'my'], filters] as const,
    },

    refunds: {
      all: ['billing', 'refunds'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['billing', 'refunds', 'list'], filters] as const,
      detail: (id: string) => ['billing', 'refunds', 'detail', id] as const,
    },

    financialSummary: (filters?: Record<string, unknown>) =>
      [...['billing', 'financial-summary'], filters] as const,
    studentFinancialProfile: (studentId: string) =>
      [...['billing', 'student-financial-profile'], studentId] as const,
  },

  attendance: {
    all: ['attendance'] as const,

    sessions: {
      all: ['attendance', 'sessions'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['attendance', 'sessions', 'list'], filters] as const,
      detail: (id: string) => ['attendance', 'sessions', 'detail', id] as const,
      attendanceRecord: (sessionId: string) =>
        ['attendance', 'sessions', 'detail', sessionId, 'attendance-record'] as const,
    },

    myAttendance: (filters?: Record<string, unknown>) =>
      [...['attendance', 'my'], filters] as const,
    mySummary: () => [...['attendance', 'my-summary']] as const,
    courseStats: (filters?: Record<string, unknown>) =>
      [...['attendance', 'course-stats'], filters] as const,
    stats: (filters?: Record<string, unknown>) =>
      [...['attendance', 'stats'], filters] as const,
  },

  reports: {
    all: ['reports'] as const,
    financial: (filters?: Record<string, unknown>) =>
      [...['reports', 'financial'], filters] as const,
    attendance: (filters?: Record<string, unknown>) =>
      [...['reports', 'attendance'], filters] as const,
    payments: (filters?: Record<string, unknown>) =>
      [...['reports', 'payments'], filters] as const,
    enrollments: (filters?: Record<string, unknown>) =>
      [...['reports', 'enrollments'], filters] as const,
    student: (studentId?: string) => [...['reports', 'student'], studentId] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...['notifications', 'list'], filters] as const,
    unreadCount: () => [...['notifications', 'unread-count']] as const,

    templates: {
      all: ['notifications', 'templates'] as const,
      list: () => [...['notifications', 'templates', 'list']] as const,
      detail: (id: string) => ['notifications', 'templates', 'detail', id] as const,
    },
    logs: {
      all: ['notifications', 'message-logs'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['notifications', 'message-logs', 'list'], filters] as const,
      detail: (id: string) => ['notifications', 'message-logs', 'detail', id] as const,
    },
  },

  audit: {
    all: ['audit'] as const,
    logs: {
      all: ['audit', 'logs'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['audit', 'logs', 'list'], filters] as const,
      detail: (id: string) => ['audit', 'logs', 'detail', id] as const,
    },
  },

  admin: {
    all: ['admin'] as const,
    staff: {
      all: ['admin', 'staff'] as const,
      list: (filters?: Record<string, unknown>) =>
        [...['admin', 'staff', 'list'], filters] as const,
      detail: (id: string) => ['admin', 'staff', 'detail', id] as const,
    },
    settings: () => [...['admin', 'settings']] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    overview: () => [...['dashboard', 'overview']] as const,
  },
} as const;

export type QueryKey = typeof QUERY_KEYS;
export default QUERY_KEYS;
