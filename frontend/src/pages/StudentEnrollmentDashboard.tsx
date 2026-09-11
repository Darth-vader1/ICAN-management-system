/**
 * Student Enrollment Dashboard - PRODUCTION READY
 * Student view of their enrollments with safe navigation
 * Features: DashboardSkeleton, ConfirmDialog, Toast, EmptyState, Crash-safe
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyEnrollments, useActivateEnrollment, useWithdrawEnrollment } from '../hooks/queries';
import type { Enrollment, EnrollmentStatus } from '../types/enrollment';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { ButtonWithLoading } from '../components/LoadingSpinner';
import { NoEnrollmentsFound } from '../components/EmptyState';
import { useConfirm } from '../hooks/useConfirm';
import { showToast } from '../lib/toast';

const StudentEnrollmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { data: enrollments = [], isLoading, error, refetch } = useMyEnrollments();
  const activateMutation = useActivateEnrollment();
  const withdrawMutation = useWithdrawEnrollment();

  const handleActivate = async (enrollment: Enrollment) => {
    const confirmed = await confirm({
      title: 'Submit for Activation',
      message: `Submit ${enrollment.session_label} - ${enrollment.level_name} enrollment for approval?`,
      confirmText: 'Submit',
      variant: 'info',
    });

    if (confirmed) {
      activateMutation.mutate({ id: enrollment.id });
    }
  };

  const handleWithdrawClick = async (enrollment: Enrollment) => {
    const confirmed = await confirm({
      title: 'Withdraw from Enrollment',
      message: `Are you sure you want to withdraw from ${enrollment.session_label} - ${enrollment.level_name} Level? This action cannot be undone.`,
      confirmText: 'Withdraw',
      variant: 'danger',
    });

    if (confirmed) {
      withdrawMutation.mutate({ id: enrollment.id });
    }
  };

  const getStatusBadge = (status: EnrollmentStatus) => {
    const styles: Record<EnrollmentStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      withdrawn: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full ${
          styles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Enrollments</h1>
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Enrollments</h1>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 mb-4">Failed to load enrollments</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dialog rendered by ConfirmDialogProvider */}
        
        {/* Header - Professional, clean */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Enrollments</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your course enrollments
            </p>
          </div>
          <Link 
            to="/enrollments/new" 
            className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors"
          >
            + New Enrollment
          </Link>
        </div>

        {/* Empty State */}
        {enrollmentsArray.length === 0 ? (
          <NoEnrollmentsFound onEnroll={() => navigate('/enrollments/new')} />
        ) : (
          /* Enrollments List - Clean, NO fancy effects */
          <div className="space-y-6">
            {enrollmentsArray.map((enrollment) => {
              // Safe navigation - prevent crashes
              const courses = enrollment.courses || [];
              const activeCourses = courses.filter((c) => !c.dropped);
              
              return (
                <div
                  key={enrollment.id}
                  className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Enrollment Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {enrollment.session_label || 'Unknown Session'} - {enrollment.level_name || 'Unknown Level'} Level
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Enrolled on{' '}
                          {enrollment.enrollment_date 
                            ? new Date(enrollment.enrollment_date).toLocaleDateString()
                            : 'Unknown date'}
                        </p>
                      </div>
                      {getStatusBadge(enrollment.status)}
                    </div>
                  </div>

                  {/* Enrollment Details */}
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Student Code
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {enrollment.student_code || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Active Courses
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {enrollment.approval_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Approved On
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(enrollment.approval_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {enrollment.completion_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Completed On
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(enrollment.completion_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Courses List - Safe navigation */}
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        Enrolled Courses
                      </h3>
                      <div className="space-y-2">
                        {courses.length > 0 ? (
                          courses.map((course) => (
                            <div
                              key={course.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                course.dropped
                                  ? 'bg-gray-50 border-gray-200 opacity-60'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {course.course_code || 'N/A'} - {course.course_name || 'Unnamed Course'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Enrolled:{' '}
                                  {course.enrolled_date 
                                    ? new Date(course.enrolled_date).toLocaleDateString()
                                    : 'Unknown'}
                                  {course.dropped && course.dropped_date && (
                                    <span className="ml-2 text-red-600">
                                      (Dropped:{' '}
                                      {new Date(course.dropped_date).toLocaleDateString()}
                                      )
                                    </span>
                                  )}
                                </p>
                              </div>
                              {course.dropped && (
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">
                                  Dropped
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                            No courses enrolled
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {enrollment.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-gray-900">{enrollment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions - Professional buttons */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-end space-x-3">
                      {enrollment.status === 'draft' && (
                        <>
                          <ButtonWithLoading
                            onClick={() => handleActivate(enrollment)}
                            isLoading={activateMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                          >
                            Submit for Activation
                          </ButtonWithLoading>
                          <button
                            onClick={() =>
                              navigate(`/enrollments/${enrollment.id}/edit`)
                            }
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Edit
                          </button>
                        </>
                      )}

                      {enrollment.status === 'active' && (
                        <>
                          <button
                            onClick={() =>
                              navigate(`/enrollments/${enrollment.id}/add-course`)
                            }
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Add Course
                          </button>
                          <button
                            onClick={() => handleWithdrawClick(enrollment)}
                            disabled={withdrawMutation.isPending}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
                          >
                            Withdraw
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => navigate(`/enrollments/${enrollment.id}`)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEnrollmentDashboard;
