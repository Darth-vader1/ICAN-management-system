/**
 * Class Management Page - PRODUCTION READY
 * Manage classes and class schedules (Staff only)
 */

import { useState } from 'react';
import { 
  useClasses, 
  useCreateClass, 
  useUpdateClass, 
  useDeleteClass,
  useSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useOfferings
} from '../hooks/queries';
import { StatCardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ButtonWithLoading } from '../components/LoadingSpinner';
import { useConfirm } from '../hooks/useConfirm';
import { showToast } from '../lib/toast';

export default function ClassManagementPage() {
  const { ConfirmDialog: ConfirmDialogComponent, confirm } = useConfirm();

  const [showClassModal, setShowClassModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const [classForm, setClassForm] = useState({
    course_offering: '',
    name: '',
    is_active: true,
  });

  const [scheduleForm, setScheduleForm] = useState({
    class_instance: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    meeting_url: '',
    notes: '',
  });

  // Fetch classes with React Query
  const {
    data: classes = [],
    isLoading: classesLoading,
    error: classesError,
    refetch: refetchClasses,
  } = useClasses();

  // Fetch schedules with React Query
  const {
    data: schedules = [],
    isLoading: schedulesLoading,
    error: schedulesError,
    refetch: refetchSchedules,
  } = useSchedules();

  // Fetch active offerings
  const { data: offerings = [] } = useOfferings({ is_active: true });

  const loading = classesLoading || schedulesLoading;
  const error = classesError || schedulesError;

  // Mutations
  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();
  
  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();

  const resetClassForm = () => {
    setClassForm({ course_offering: '', name: '', is_active: true });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      class_instance: '',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      meeting_url: '',
      notes: '',
    });
  };

  const handleOpenClassModal = (classToEdit?: any) => {
    if (classToEdit) {
      setEditingClass(classToEdit);
      setClassForm({
        course_offering: classToEdit.course_offering?.id || '',
        name: classToEdit.name || '',
        is_active: classToEdit.is_active ?? true,
      });
    } else {
      setEditingClass(null);
      resetClassForm();
    }
    setShowClassModal(true);
  };

  const handleOpenScheduleModal = (scheduleToEdit?: any) => {
    if (scheduleToEdit) {
      setEditingSchedule(scheduleToEdit);
      setScheduleForm({
        class_instance: scheduleToEdit.class_instance?.id || '',
        date: scheduleToEdit.date || '',
        start_time: scheduleToEdit.start_time || '',
        end_time: scheduleToEdit.end_time || '',
        location: scheduleToEdit.location || '',
        meeting_url: scheduleToEdit.meeting_url || '',
        notes: scheduleToEdit.notes || '',
      });
    } else {
      setEditingSchedule(null);
      resetScheduleForm();
    }
    setShowScheduleModal(true);
  };

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!classForm.course_offering) {
      showToast.error('Course offering is required');
      return;
    }
    if (!classForm.name.trim()) {
      showToast.error('Class name is required');
      return;
    }

    if (editingClass) {
      updateClassMutation.mutate(
        { id: editingClass.id.toString(), data: classForm },
        {
          onSuccess: () => {
            setShowClassModal(false);
            resetClassForm();
            setEditingClass(null);
          },
        }
      );
    } else {
      createClassMutation.mutate(
        { data: classForm },
        {
          onSuccess: () => {
            setShowClassModal(false);
            resetClassForm();
          },
        }
      );
    }
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!scheduleForm.class_instance) {
      showToast.error('Class is required');
      return;
    }
    if (!scheduleForm.date) {
      showToast.error('Date is required');
      return;
    }
    if (!scheduleForm.start_time || !scheduleForm.end_time) {
      showToast.error('Start and end times are required');
      return;
    }

    if (editingSchedule) {
      updateScheduleMutation.mutate(
        { id: editingSchedule.id.toString(), data: scheduleForm },
        {
          onSuccess: () => {
            setShowScheduleModal(false);
            resetScheduleForm();
            setEditingSchedule(null);
          },
        }
      );
    } else {
      createScheduleMutation.mutate(
        { data: scheduleForm },
        {
          onSuccess: () => {
            setShowScheduleModal(false);
            resetScheduleForm();
          },
        }
      );
    }
  };

  const handleDeleteClass = async (cls: any) => {
    const confirmed = await confirm({
      title: 'Delete Class',
      message: `Are you sure you want to delete "${cls.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteClassMutation.mutate({ id: cls.id.toString() });
    }
  };

  const handleDeleteSchedule = async (schedule: any) => {
    const confirmed = await confirm({
      title: 'Delete Schedule',
      message: 'Are you sure you want to delete this schedule? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteScheduleMutation.mutate({ id: schedule.id.toString() });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage classes and schedules for course offerings
          </p>
        </div>

        {/* Statistics Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Classes Loading */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Schedules Loading */}
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
        </div>
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
            Failed to load class data
          </h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <button
            onClick={() => {
              refetchClasses();
              refetchSchedules();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmDialogComponent />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage classes and schedules for course offerings
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Classes</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{classes.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Active Classes</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {classes.filter((c) => c.is_active).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Scheduled Sessions</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{schedules.length}</div>
        </div>
      </div>

      {/* Classes Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Classes</h2>
            <button
              onClick={() => handleOpenClassModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              Add Class
            </button>
          </div>
        </div>

        <div className="p-6">
          {classes.length === 0 ? (
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
              title="No classes found"
              description="Get started by creating your first class for a course offering."
              action={{
                label: 'Add Class',
                onClick: () => handleOpenClassModal(),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        cls.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cls.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {cls.course_offering?.course?.code || 'N/A'} -{' '}
                    {cls.course_offering?.session_label || 'N/A'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenClassModal(cls)}
                      className="flex-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls)}
                      disabled={deleteClassMutation.isPending}
                      className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedules Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Class Schedules</h2>
            <button
              onClick={() => handleOpenScheduleModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              Add Schedule
            </button>
          </div>
        </div>

        <div className="p-6">
          {schedules.length === 0 ? (
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
              title="No schedules found"
              description="Create schedules to define when classes meet."
              action={{
                label: 'Add Schedule',
                onClick: () => handleOpenScheduleModal(),
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {schedule.class_instance?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(schedule.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {schedule.start_time} - {schedule.end_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {schedule.location || 'Online'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleOpenScheduleModal(schedule)}
                          className="text-blue-600 hover:text-blue-800 font-medium transition-colors mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule)}
                          disabled={deleteScheduleMutation.isPending}
                          className="text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Class Modal */}
      {showClassModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowClassModal(false);
            setEditingClass(null);
            resetClassForm();
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h2>
            </div>

            <form onSubmit={handleSubmitClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Offering *
                </label>
                <select
                  required
                  value={classForm.course_offering}
                  onChange={(e) =>
                    setClassForm({ ...classForm, course_offering: e.target.value })
                  }
                  disabled={
                    createClassMutation.isPending || updateClassMutation.isPending
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Course Offering</option>
                  {offerings.map((offering) => (
                    <option key={offering.id} value={offering.id}>
                      {offering.course_code} - {offering.session_label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  disabled={
                    createClassMutation.isPending || updateClassMutation.isPending
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Morning Batch, Group A"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="class_active"
                  checked={classForm.is_active}
                  onChange={(e) =>
                    setClassForm({ ...classForm, is_active: e.target.checked })
                  }
                  disabled={
                    createClassMutation.isPending || updateClassMutation.isPending
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label htmlFor="class_active" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <ButtonWithLoading
                  type="submit"
                  loading={
                    createClassMutation.isPending || updateClassMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingClass ? 'Update Class' : 'Create Class'}
                </ButtonWithLoading>
                <button
                  type="button"
                  onClick={() => {
                    setShowClassModal(false);
                    setEditingClass(null);
                    resetClassForm();
                  }}
                  disabled={
                    createClassMutation.isPending || updateClassMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Schedule Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowScheduleModal(false);
            setEditingSchedule(null);
            resetScheduleForm();
          }}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSchedule ? 'Edit Schedule' : 'Add Class Schedule'}
              </h2>
            </div>

            <form onSubmit={handleSubmitSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  required
                  value={scheduleForm.class_instance}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, class_instance: e.target.value })
                  }
                  disabled={
                    createScheduleMutation.isPending || updateScheduleMutation.isPending
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Class</option>
                  {classes.filter((c) => c.is_active).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={scheduleForm.date}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, date: e.target.value })
                  }
                  disabled={
                    createScheduleMutation.isPending || updateScheduleMutation.isPending
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.start_time}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, start_time: e.target.value })
                    }
                    disabled={
                      createScheduleMutation.isPending || updateScheduleMutation.isPending
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.end_time}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, end_time: e.target.value })
                    }
                    disabled={
                      createScheduleMutation.isPending || updateScheduleMutation.isPending
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={scheduleForm.location}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, location: e.target.value })
                  }
                  disabled={
                    createScheduleMutation.isPending || updateScheduleMutation.isPending
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Room 101 or leave empty for online"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting URL
                </label>
                <input
                  type="url"
                  value={scheduleForm.meeting_url}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, meeting_url: e.target.value })
                  }
                  disabled={
                    createScheduleMutation.isPending || updateScheduleMutation.isPending
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://zoom.us/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, notes: e.target.value })
                  }
                  disabled={
                    createScheduleMutation.isPending || updateScheduleMutation.isPending
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <ButtonWithLoading
                  type="submit"
                  loading={
                    createScheduleMutation.isPending || updateScheduleMutation.isPending
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </ButtonWithLoading>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingSchedule(null);
                    resetScheduleForm();
                  }}
                  disabled={
                    createScheduleMutation.isPending || updateScheduleMutation.isPending
                  }
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
}
