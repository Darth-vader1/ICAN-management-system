import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { enrollmentService } from '../services/enrollmentService';
import type { Enrollment, EnrollmentStatus } from '../types/enrollment';

const StudentEnrollmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  // Fetch enrollments
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentService.getMyEnrollments,
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (id: string) => enrollmentService.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      enrollmentService.withdraw(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      setShowWithdrawModal(false);
      setSelectedEnrollment(null);
      setWithdrawReason('');
    },
  });

  const handleActivate = (enrollment: Enrollment) => {
    if (window.confirm('Are you sure you want to submit this enrollment for activation?')) {
      activateMutation.mutate(enrollment.id);
    }
  };

  const handleWithdrawClick = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowWithdrawModal(true);
  };

  const handleWithdrawConfirm = () => {
    if (selectedEnrollment) {
      withdrawMutation.mutate({
        id: selectedEnrollment.id,
        reason: withdrawReason || undefined,
      });
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
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          styles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading enrollments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Enrollments</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your course enrollments
            </p>
          </div>
          <Link to="/enrollments/new" className="btn-primary">
            + New Enrollment
          </Link>
        </div>

        {/* Enrollments List */}
        {enrollments && enrollments.length > 0 ? (
          <div className="space-y-6">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                {/* Enrollment Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {enrollment.session_label} - {enrollment.level_name} Level
                      </h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Enrolled on{' '}
                        {new Date(enrollment.enrollment_date).toLocaleDateString()}
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
                        {enrollment.student_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Number of Courses
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {enrollment.courses.filter((c) => !c.dropped).length} active
                        courses
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

                  {/* Courses List */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Enrolled Courses
                    </h3>
                    <div className="space-y-2">
                      {enrollment.courses.length > 0 ? (
                        enrollment.courses.map((course) => (
                          <div
                            key={course.id}
                            className={`flex items-center justify-between p-3 rounded-md ${
                              course.dropped
                                ? 'bg-gray-50 opacity-60'
                                : 'bg-blue-50'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {course.course_code} - {course.course_name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Enrolled:{' '}
                                {new Date(course.enrolled_date).toLocaleDateString()}
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
                        <p className="text-sm text-gray-500">No courses enrolled</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {enrollment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Notes
                      </p>
                      <p className="text-sm text-gray-900">{enrollment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    {enrollment.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleActivate(enrollment)}
                          className="btn-primary text-sm"
                          disabled={activateMutation.isPending}
                        >
                          {activateMutation.isPending
                            ? 'Activating...'
                            : 'Submit for Activation'}
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/enrollments/${enrollment.id}/edit`)
                          }
                          className="btn-secondary text-sm"
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
                          className="btn-secondary text-sm"
                        >
                          Add Course
                        </button>
                        <button
                          onClick={() => handleWithdrawClick(enrollment)}
                          className="text-sm px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                          disabled={withdrawMutation.isPending}
                        >
                          Withdraw
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => navigate(`/enrollments/${enrollment.id}`)}
                      className="btn-secondary text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">
              You don't have any enrollments yet
            </p>
            <Link to="/enrollments/new" className="btn-primary">
              Create Your First Enrollment
            </Link>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && selectedEnrollment && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Withdraw from Enrollment
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to withdraw from{' '}
                <strong>
                  {selectedEnrollment.session_label} -{' '}
                  {selectedEnrollment.level_name} Level
                </strong>
                ? This action cannot be undone.
              </p>

              <div className="mb-4">
                <label
                  htmlFor="withdraw-reason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Reason for Withdrawal (Optional)
                </label>
                <textarea
                  id="withdraw-reason"
                  rows={3}
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setSelectedEnrollment(null);
                    setWithdrawReason('');
                  }}
                  className="btn-secondary text-sm"
                  disabled={withdrawMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawConfirm}
                  className="text-sm px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  disabled={withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEnrollmentDashboard;
