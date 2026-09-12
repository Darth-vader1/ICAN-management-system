/**
 * Student Enrollment Dashboard - PRODUCTION READY
 * Student view of their enrollments with safe navigation & course management
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useMyEnrollments,
  useActivateEnrollment,
  useAddCourseToEnrollment,
  useDropCourseFromEnrollment,
  useOfferings,
} from '../hooks/queries';
import type { Enrollment, EnrollmentStatus, EnrollmentCourse } from '../types/enrollment';
import type { CourseOfferingListItem } from '../types/academics';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { ButtonWithLoading } from '../components/LoadingSpinner';
import { NoEnrollmentsFound } from '../components/EmptyState';
import { useConfirm } from '../hooks/useConfirm';
import { showToast } from '../lib/toast';

export const StudentEnrollmentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { data: enrollments = [], isLoading, error, refetch } = useMyEnrollments();
  const activateMutation = useActivateEnrollment();
  const addCourseMutation = useAddCourseToEnrollment();
  const dropCourseMutation = useDropCourseFromEnrollment();

  // State for Modals
  const [selectedEnrollmentForAdd, setSelectedEnrollmentForAdd] = useState<Enrollment | null>(null);
  const [selectedEnrollmentForDetails, setSelectedEnrollmentForDetails] = useState<Enrollment | null>(null);

  // State inside Add Course Modal
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');

  // Offerings query for Add Course Modal
  const { data: offerings = [], isLoading: offeringsLoading } = useOfferings(
    selectedEnrollmentForAdd?.session
      ? { session: selectedEnrollmentForAdd.session, is_active: true }
      : undefined
  );

  // Filter out offerings already enrolled in selected enrollment
  const availableOfferings = React.useMemo(() => {
    if (!selectedEnrollmentForAdd || !Array.isArray(offerings)) return [];
    
    const existingCourses = selectedEnrollmentForAdd.enrollment_courses || selectedEnrollmentForAdd.courses || [];
    const activeCourseCodes = new Set(
      existingCourses.filter((c) => !c.dropped).map((c) => c.course_code)
    );

    return (offerings as CourseOfferingListItem[]).filter((offering) => {
      // Filter by level if level_name matches
      const levelMatches =
        !selectedEnrollmentForAdd.level_name ||
        offering.level_name?.toLowerCase() === selectedEnrollmentForAdd.level_name?.toLowerCase();
      // Exclude courses already enrolled
      const notEnrolledYet = !activeCourseCodes.has(offering.course_code);
      return levelMatches && notEnrolledYet;
    });
  }, [offerings, selectedEnrollmentForAdd]);

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

  const handleAddCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentForAdd || !selectedOfferingId) {
      showToast.error('Please select a course to add');
      return;
    }

    try {
      await addCourseMutation.mutateAsync({
        enrollmentId: selectedEnrollmentForAdd.id,
        data: { course_offering: selectedOfferingId },
      });
      setSelectedEnrollmentForAdd(null);
      setSelectedOfferingId('');
      refetch();
    } catch (err) {
      // Error handled by mutation toast
    }
  };

  const handleDropCourse = async (enrollmentId: string, course: EnrollmentCourse) => {
    const courseTitle = course.course_code
      ? `${course.course_code} - ${course.course_name}`
      : course.course_name || 'this course';

    const confirmed = await confirm({
      title: 'Drop Course',
      message: `Are you sure you want to drop ${courseTitle}?`,
      confirmText: 'Drop Course',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await dropCourseMutation.mutateAsync({
          enrollmentId,
          courseId: course.id || (course as any).course_offering,
        });
        await refetch();
        if (selectedEnrollmentForDetails && selectedEnrollmentForDetails.id === enrollmentId) {
          const updatedCourses = (
            selectedEnrollmentForDetails.enrollment_courses ||
            selectedEnrollmentForDetails.courses ||
            []
          ).map((c) =>
            c.id === course.id || (course.course_offering && c.course_offering === course.course_offering)
              ? { ...c, dropped: true }
              : c
          );
          setSelectedEnrollmentForDetails({
            ...selectedEnrollmentForDetails,
            enrollment_courses: updatedCourses,
          });
        }
      } catch (err) {
        console.error('Failed to drop course:', err);
      }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Enrollments</h1>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
            <svg
              className="h-12 w-12 text-red-500 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Enrollments</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your course enrollments
            </p>
          </div>
          <Link
            to="/enrollments/new"
            className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors font-medium text-sm shadow-sm"
          >
            + New Enrollment
          </Link>
        </div>

        {/* Empty State */}
        {enrollmentsArray.length === 0 ? (
          <NoEnrollmentsFound onEnroll={() => navigate('/enrollments/new')} />
        ) : (
          <div className="space-y-6">
            {enrollmentsArray.map((enrollment) => {
              // Safe navigation: backend returns `enrollment_courses`
              const courses = enrollment.enrollment_courses || enrollment.courses || [];
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
                            ? new Date(enrollment.enrollment_date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
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
                        <p className="text-sm font-medium text-gray-500">Student Code</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {enrollment.student_code || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Active Courses</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {activeCourses.length} course{activeCourses.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {enrollment.approval_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Approved On</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(enrollment.approval_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {enrollment.completion_date && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Completed On</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(enrollment.completion_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Enrolled Courses List */}
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
                                  : 'bg-blue-50/60 border-blue-100'
                              }`}
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {course.course_code || 'N/A'} - {course.course_name || 'Unnamed Course'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Enrolled:{' '}
                                  {course.enrolled_date
                                    ? new Date(course.enrolled_date).toLocaleDateString()
                                    : 'Unknown'}
                                  {course.tutor_name && (
                                    <span className="ml-3 text-gray-600">
                                      Tutor: {course.tutor_name}
                                    </span>
                                  )}
                                  {course.dropped && course.dropped_date && (
                                    <span className="ml-2 text-red-600">
                                      (Dropped:{' '}
                                      {new Date(course.dropped_date).toLocaleDateString()}
                                      )
                                    </span>
                                  )}
                                </p>
                              </div>
                              {course.dropped ? (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                                  Dropped
                                </span>
                              ) : (
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                  Active
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
                        <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-900">{enrollment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar — NOTE: Withdraw button is removed as requested */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-end space-x-3">
                      {enrollment.status === 'draft' && (
                        <ButtonWithLoading
                          onClick={() => handleActivate(enrollment)}
                          isLoading={activateMutation.isPending}
                          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                        >
                          Submit for Activation
                        </ButtonWithLoading>
                      )}

                      {(enrollment.status === 'active' || enrollment.status === 'draft') && (
                        <button
                          onClick={() => {
                            setSelectedOfferingId('');
                            setSelectedEnrollmentForAdd(enrollment);
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 bg-white font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm"
                        >
                          + Add Course
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedEnrollmentForDetails(enrollment)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 bg-white font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm"
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

        {/* MODAL 1: Add Course Modal */}
        {selectedEnrollmentForAdd && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Add Course to Enrollment
                </h3>
                <button
                  onClick={() => setSelectedEnrollmentForAdd(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Enrolling in{' '}
                <span className="font-semibold text-gray-900">
                  {selectedEnrollmentForAdd.session_label} - {selectedEnrollmentForAdd.level_name} Level
                </span>
              </p>

              <form onSubmit={handleAddCourseSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Available Course
                  </label>
                  {offeringsLoading ? (
                    <p className="text-sm text-gray-500">Loading available courses...</p>
                  ) : availableOfferings.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      No additional course offerings available for this level in this session.
                    </div>
                  ) : (
                    <select
                      value={selectedOfferingId}
                      onChange={(e) => setSelectedOfferingId(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Choose a Course Offering --</option>
                      {availableOfferings.map((offering) => (
                        <option key={offering.id} value={offering.id}>
                          {offering.course_code} - {offering.course_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedEnrollmentForAdd(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <ButtonWithLoading
                    type="submit"
                    disabled={!selectedOfferingId || availableOfferings.length === 0}
                    isLoading={addCourseMutation.isPending}
                    className="px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark disabled:opacity-50 text-sm font-medium"
                  >
                    Add Course
                  </ButtonWithLoading>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: View Details Modal */}
        {selectedEnrollmentForDetails && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedEnrollmentForDetails.session_label} Enrollment Details
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedEnrollmentForDetails.level_name} Level
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(selectedEnrollmentForDetails.status)}
                  <button
                    onClick={() => setSelectedEnrollmentForDetails(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Summary Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Student Code
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {selectedEnrollmentForDetails.student_code || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Enrolled Date
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedEnrollmentForDetails.enrollment_date
                      ? new Date(selectedEnrollmentForDetails.enrollment_date).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                {selectedEnrollmentForDetails.approval_date && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                      Approved Date
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedEnrollmentForDetails.approval_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedEnrollmentForDetails.invoice_id && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                      Linked Invoice
                    </span>
                    <button
                      onClick={() => {
                        const invId = selectedEnrollmentForDetails.invoice_id;
                        setSelectedEnrollmentForDetails(null);
                        navigate(`/billing/invoice/${invId}`);
                      }}
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      View Invoice &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* Enrolled Courses Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-base font-bold text-gray-900">
                    Enrolled Courses List
                  </h4>
                  {(selectedEnrollmentForDetails.status === 'active' ||
                    selectedEnrollmentForDetails.status === 'draft') && (
                    <button
                      onClick={() => {
                        const target = selectedEnrollmentForDetails;
                        setSelectedEnrollmentForDetails(null);
                        setSelectedOfferingId('');
                        setSelectedEnrollmentForAdd(target);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      + Add Another Course
                    </button>
                  )}
                </div>

                {(() => {
                  const detailedCourses =
                    selectedEnrollmentForDetails.enrollment_courses ||
                    selectedEnrollmentForDetails.courses ||
                    [];

                  if (detailedCourses.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">
                        No courses currently enrolled in this record.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {detailedCourses.map((course) => (
                        <div
                          key={course.id}
                          className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            course.dropped
                              ? 'bg-gray-50 border-gray-200 opacity-60'
                              : 'bg-white border-gray-200 shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                {course.course_code || 'N/A'}
                              </span>
                              <h5 className="text-sm font-semibold text-gray-900">
                                {course.course_name || 'Unnamed Course'}
                              </h5>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4">
                              <span>
                                Enrolled:{' '}
                                {course.enrolled_date
                                  ? new Date(course.enrolled_date).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                              {course.tutor_name && <span>Tutor: {course.tutor_name}</span>}
                              {course.course_duration && (
                                <span>Duration: {course.course_duration} hrs</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 self-end sm:self-center">
                            {course.dropped ? (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
                                Dropped
                              </span>
                            ) : (
                              <>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                  Active
                                </span>
                                {selectedEnrollmentForDetails.status === 'active' && (
                                  <button
                                    onClick={() =>
                                      handleDropCourse(selectedEnrollmentForDetails.id, course)
                                    }
                                    className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium"
                                  >
                                    Drop
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Notes */}
              {selectedEnrollmentForDetails.notes && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                    Notes
                  </span>
                  <p className="text-sm text-gray-800">{selectedEnrollmentForDetails.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedEnrollmentForDetails(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm font-semibold transition-colors"
                >
                  Close
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
