/**
 * Academics Page - PRODUCTION READY
 * Manage academic sessions, levels, courses, and course offerings
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ButtonWithLoading } from '../components/LoadingSpinner';
import { useConfirm } from '../hooks/useConfirm';
import {
  useAcademicSessions,
  useLevels,
  useCourses,
  useOfferings,
  useCreateAcademicSession,
  useUpdateAcademicSession,
  useDeleteAcademicSession,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useCreateOffering,
  useUpdateOffering,
  useDeleteOffering,
} from '../hooks/queries';
import type {
  AcademicSession,
  Course,
  CourseOffering,
} from '../types/academics';

const AcademicsPage: React.FC = () => {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'sessions' | 'levels' | 'courses' | 'offerings'>('sessions');

  // Modal states
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(null);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    label: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const [courseForm, setCourseForm] = useState({
    level: '',
    name: '',
    code: '',
    description: '',
    duration: 12,
    is_active: true,
  });

  const [offeringForm, setOfferingForm] = useState({
    course: '',
    session: '',
    capacity: 50,
    is_active: true,
  });

  // Query hooks
  const {
    data: sessionsData = [],
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useAcademicSessions();

  const {
    data: levelsData = [],
    isLoading: levelsLoading,
    error: levelsError,
    refetch: refetchLevels,
  } = useLevels();

  const {
    data: coursesData = [],
    isLoading: coursesLoading,
    error: coursesError,
    refetch: refetchCourses,
  } = useCourses();

  const {
    data: offeringsData = [],
    isLoading: offeringsLoading,
    error: offeringsError,
    refetch: refetchOfferings,
  } = useOfferings();

  const sessions = useMemo<AcademicSession[]>(
    () => (Array.isArray(sessionsData) ? sessionsData : []),
    [sessionsData]
  );
  const levels = useMemo(
    () => (Array.isArray(levelsData) ? levelsData : []),
    [levelsData]
  );
  const courses = useMemo<Course[]>(
    () => (Array.isArray(coursesData) ? coursesData : []),
    [coursesData]
  );
  const offerings = useMemo<CourseOffering[]>(
    () => (Array.isArray(offeringsData) ? offeringsData : []),
    [offeringsData]
  );

  const isManager = user?.role === 'manager' || user?.role === 'super_admin';

  // Session mutations
  const createSessionMutation = useCreateAcademicSession();
  const updateSessionMutation = useUpdateAcademicSession();
  const deleteSessionMutation = useDeleteAcademicSession();

  // Course mutations
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  // Offering mutations
  const createOfferingMutation = useCreateOffering();
  const updateOfferingMutation = useUpdateOffering();
  const deleteOfferingMutation = useDeleteOffering();

  // Form reset functions
  const resetSessionForm = () => {
    setSessionForm({ label: '', start_date: '', end_date: '', is_active: true });
  };

  const resetCourseForm = () => {
    setCourseForm({ level: '', name: '', code: '', description: '', duration: 12, is_active: true });
  };

  const resetOfferingForm = () => {
    setOfferingForm({ course: '', session: '', capacity: 50, is_active: true });
  };

  // Modal open functions
  const handleOpenSessionModal = (session?: any) => {
    if (session) {
      setEditingSession(session);
      setSessionForm({
        label: session.label || '',
        start_date: session.start_date || '',
        end_date: session.end_date || '',
        is_active: session.is_active ?? true,
      });
    } else {
      setEditingSession(null);
      resetSessionForm();
    }
    setShowSessionModal(true);
  };

  const handleOpenCourseModal = (course?: any) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        level: course.level || '',
        name: course.name || '',
        code: course.code || '',
        description: course.description || '',
        duration: course.duration || 12,
        is_active: course.is_active ?? true,
      });
    } else {
      setEditingCourse(null);
      resetCourseForm();
    }
    setShowCourseModal(true);
  };

  const handleOpenOfferingModal = (offering?: any) => {
    if (offering) {
      setEditingOffering(offering);
      setOfferingForm({
        course: offering.course || '',
        session: offering.session || '',
        capacity: offering.capacity || 50,
        is_active: offering.is_active ?? true,
      });
    } else {
      setEditingOffering(null);
      resetOfferingForm();
    }
    setShowOfferingModal(true);
  };

  // Form submit handlers
  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionForm.label.trim()) {
      return;
    }
    if (!sessionForm.start_date || !sessionForm.end_date) {
      return;
    }

    if (editingSession) {
      updateSessionMutation.mutate({ id: String(editingSession.id), data: sessionForm });
    } else {
      createSessionMutation.mutate({ data: sessionForm });
    }
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseForm.level) {
      return;
    }
    if (!courseForm.code.trim()) {
      return;
    }
    if (!courseForm.name.trim()) {
      return;
    }

    if (editingCourse) {
      updateCourseMutation.mutate({ id: String(editingCourse.id), data: courseForm });
    } else {
      createCourseMutation.mutate({ data: courseForm });
    }
  };

  const handleSubmitOffering = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!offeringForm.course) {
      return;
    }
    if (!offeringForm.session) {
      return;
    }

    if (editingOffering) {
      updateOfferingMutation.mutate({ id: String(editingOffering.id), data: offeringForm });
    } else {
      createOfferingMutation.mutate({ data: offeringForm });
    }
  };

  // Delete handlers
  const handleDeleteSession = async (session: AcademicSession) => {
    const confirmed = await confirm({
      title: 'Delete Session',
      message: `Are you sure you want to delete "${session.label}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteSessionMutation.mutate({ id: String(session.id) });
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    const confirmed = await confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete "${course.code} - ${course.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteCourseMutation.mutate({ id: String(course.id) });
    }
  };

  const handleDeleteOffering = async (offering: CourseOffering) => {
    const confirmed = await confirm({
      title: 'Delete Offering',
      message: 'Are you sure you want to delete this course offering? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteOfferingMutation.mutate({ id: String(offering.id) });
    }
  };

  const tabs = [
    { key: 'sessions' as const, label: 'Academic Sessions', count: sessions.length },
    { key: 'levels' as const, label: 'Levels', count: levels.length },
    { key: 'courses' as const, label: 'Courses', count: courses.length },
    { key: 'offerings' as const, label: 'Course Offerings', count: offerings.length },
  ];

  const currentLoading = 
    (activeTab === 'sessions' && sessionsLoading) ||
    (activeTab === 'levels' && levelsLoading) ||
    (activeTab === 'courses' && coursesLoading) ||
    (activeTab === 'offerings' && offeringsLoading);

  const currentError =
    (activeTab === 'sessions' && sessionsError) ||
    (activeTab === 'levels' && levelsError) ||
    (activeTab === 'courses' && coursesError) ||
    (activeTab === 'offerings' && offeringsError);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dialog is rendered by ConfirmDialogProvider */}
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Academic Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage sessions, levels, courses, and offerings
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {currentLoading ? (
          <div className="bg-white shadow rounded-lg p-6">
            {activeTab === 'levels' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
            ) : (
              <TableSkeleton rows={5} columns={4} />
            )}
          </div>
        ) : currentError ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <svg
                className="h-12 w-12 text-red-400 mx-auto mb-4"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to load data
              </h3>
              <p className="text-gray-600 mb-4">
                {currentError instanceof Error ? currentError.message : 'An error occurred'}
              </p>
              <button
                onClick={() => {
                  if (activeTab === 'sessions') refetchSessions();
                  else if (activeTab === 'levels') refetchLevels();
                  else if (activeTab === 'courses') refetchCourses();
                  else refetchOfferings();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            {/* Academic Sessions Tab */}
            {activeTab === 'sessions' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Academic Sessions</h2>
                  {isManager && (
                    <button 
                      onClick={() => handleOpenSessionModal()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                    >
                      <svg
                        className="h-5 w-5 inline-block mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Session
                    </button>
                  )}
                </div>

                {sessions.length === 0 ? (
                  <EmptyState
                    icon={
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    }
                    title="No sessions found"
                    description="Create academic sessions to organize your courses by time period."
                    action={isManager ? {
                      label: 'Add Session',
                      onClick: () => handleOpenSessionModal(),
                    } : undefined}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Session
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Start Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            End Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          {isManager && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessions.map((session) => (
                          <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {session.label}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(session.start_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(session.end_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  session.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {session.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            {isManager && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleOpenSessionModal(session)}
                                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(session)}
                                  disabled={deleteSessionMutation.isPending}
                                  className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Levels Tab */}
            {activeTab === 'levels' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">ICAN Levels</h2>
                </div>

                {levels.length === 0 ? (
                  <EmptyState
                    icon={
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    }
                    title="No levels found"
                    description="ICAN levels define the hierarchy of courses in the program."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {levels.map((level) => (
                      <div key={level.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {level.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">{level.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Order: {level.order}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              level.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {level.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Courses</h2>
                  {isManager && (
                    <button 
                      onClick={() => handleOpenCourseModal()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                    >
                      <svg
                        className="h-5 w-5 inline-block mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Course
                    </button>
                  )}
                </div>

                {courses.length === 0 ? (
                  <EmptyState
                    icon={
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    }
                    title="No courses found"
                    description="Create courses to define what students will learn at each level."
                    action={isManager ? {
                      label: 'Add Course',
                      onClick: () => handleOpenCourseModal(),
                    } : undefined}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          {isManager && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {course.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {course.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {course.level_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  course.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {course.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            {isManager && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleOpenCourseModal(course)}
                                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course)}
                                  disabled={deleteCourseMutation.isPending}
                                  className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Course Offerings Tab */}
            {activeTab === 'offerings' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Course Offerings</h2>
                  {isManager && (
                    <button 
                      onClick={() => handleOpenOfferingModal()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                    >
                      <svg
                        className="h-5 w-5 inline-block mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Offering
                    </button>
                  )}
                </div>

                {offerings.length === 0 ? (
                  <EmptyState
                    icon={
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    }
                    title="No offerings found"
                    description="Course offerings combine courses with sessions to create enrollment opportunities."
                    action={isManager ? {
                      label: 'Add Offering',
                      onClick: () => handleOpenOfferingModal(),
                    } : undefined}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Session
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Level
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          {isManager && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {offerings.map((offering) => (
                          <tr key={offering.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-medium">{offering.course_code}</div>
                              <div className="text-gray-600">{offering.course_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {offering.session_label}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {offering.level_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  offering.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {offering.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            {isManager && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => handleOpenOfferingModal(offering)}
                                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteOffering(offering)}
                                  disabled={deleteOfferingMutation.isPending}
                                  className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals - Session */}
      {showSessionModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowSessionModal(false);
            setEditingSession(null);
            resetSessionForm();
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSession ? 'Edit Session' : 'Add Academic Session'}
              </h2>
            </div>

            <form onSubmit={handleSubmitSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Label * (e.g., 2026/2027)
                </label>
                <input
                  type="text"
                  required
                  value={sessionForm.label}
                  onChange={(e) => setSessionForm({ ...sessionForm, label: e.target.value })}
                  disabled={createSessionMutation.isPending || updateSessionMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="2026/2027"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionForm.start_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
                    disabled={createSessionMutation.isPending || updateSessionMutation.isPending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionForm.end_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
                    disabled={createSessionMutation.isPending || updateSessionMutation.isPending}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="session_active"
                  checked={sessionForm.is_active}
                  onChange={(e) => setSessionForm({ ...sessionForm, is_active: e.target.checked })}
                  disabled={createSessionMutation.isPending || updateSessionMutation.isPending}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="session_active" className="ml-2 text-sm text-gray-700">
                  Active Session
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <ButtonWithLoading
                  type="submit"
                  loading={createSessionMutation.isPending || updateSessionMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingSession ? 'Update Session' : 'Create Session'}
                </ButtonWithLoading>
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionModal(false);
                    setEditingSession(null);
                    resetSessionForm();
                  }}
                  disabled={createSessionMutation.isPending || updateSessionMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal - Keep original but add edit support */}
      {showCourseModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowCourseModal(false);
            setEditingCourse(null);
            resetCourseForm();
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Add Course'}
              </h2>
            </div>

            <form onSubmit={handleSubmitCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level *
                </label>
                <select
                  required
                  value={courseForm.level}
                  onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Level</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code * (e.g., FA101)
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="FA101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Financial Accounting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Course description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (weeks)
                </label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={courseForm.duration}
                  onChange={(e) => setCourseForm({ ...courseForm, duration: parseInt(e.target.value) })}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="course_active"
                  checked={courseForm.is_active}
                  onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.checked })}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="course_active" className="ml-2 text-sm text-gray-700">
                  Active (available for enrollment)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <ButtonWithLoading
                  type="submit"
                  loading={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </ButtonWithLoading>
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseModal(false);
                    setEditingCourse(null);
                    resetCourseForm();
                  }}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Offering Modal - Keep original but add edit support */}
      {showOfferingModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowOfferingModal(false);
            setEditingOffering(null);
            resetOfferingForm();
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingOffering ? 'Edit Course Offering' : 'Add Course Offering'}
              </h2>
            </div>

            <form onSubmit={handleSubmitOffering} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course *
                </label>
                <select
                  required
                  value={offeringForm.course}
                  onChange={(e) => setOfferingForm({ ...offeringForm, course: e.target.value })}
                  disabled={createOfferingMutation.isPending || updateOfferingMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Session *
                </label>
                <select
                  required
                  value={offeringForm.session}
                  onChange={(e) => setOfferingForm({ ...offeringForm, session: e.target.value })}
                  disabled={createOfferingMutation.isPending || updateOfferingMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Session</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (maximum students)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={offeringForm.capacity}
                  onChange={(e) => setOfferingForm({ ...offeringForm, capacity: parseInt(e.target.value) })}
                  disabled={createOfferingMutation.isPending || updateOfferingMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="offering_active"
                  checked={offeringForm.is_active}
                  onChange={(e) => setOfferingForm({ ...offeringForm, is_active: e.target.checked })}
                  disabled={createOfferingMutation.isPending || updateOfferingMutation.isPending}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="offering_active" className="ml-2 text-sm text-gray-700">
                  Active (available for enrollment)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <ButtonWithLoading
                  type="submit"
                  loading={createOfferingMutation.isPending || updateOfferingMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingOffering ? 'Update Offering' : 'Create Offering'}
                </ButtonWithLoading>
                <button
                  type="button"
                  onClick={() => {
                    setShowOfferingModal(false);
                    setEditingOffering(null);
                    resetOfferingForm();
                  }}
                  disabled={createOfferingMutation.isPending || updateOfferingMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicsPage;
