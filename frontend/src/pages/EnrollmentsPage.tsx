/**
 * Role-Based Enrollment Router Page
 * Renders StaffEnrollmentDashboard for staff (managers/admin/officers)
 * and StudentEnrollmentDashboard for student users ("My Enrollments").
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import StudentEnrollmentDashboard from './StudentEnrollmentDashboard';
import StaffEnrollmentDashboard from './StaffEnrollmentDashboard';

export const EnrollmentsPage: React.FC = () => {
  const { user } = useAuth();

  const isStaff =
    user?.is_staff_role ||
    ['super_admin', 'manager', 'student_officer', 'finance', 'it_admin'].includes(
      user?.role || ''
    );

  if (isStaff) {
    return <StaffEnrollmentDashboard />;
  }

  return <StudentEnrollmentDashboard />;
};

export default EnrollmentsPage;
