/**
 * Course Management Page - PRODUCTION READY ✨
 * Full CRUD operations for courses (Staff only)
 * Features: TableSkeleton, ConfirmDialog, Toast, EmptyState, Professional Design
 */

import { useState } from 'react';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '../hooks/queries';
import type { Course } from '../types/academics';
import { TableSkeleton, StatCardSkeleton } from '../components/LoadingSkeleton';
import { ButtonWithLoading } from '../components/LoadingSpinner';
import { NoCoursesFound } from '../components/EmptyState';
import { useConfirm } from '../hooks/useConfirm';
import { showToast } from '../lib/toast';

export default function CoursesPage() {
  const { ConfirmDialog, confirm } = useConfirm();
  
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    credit_hours: 3,
    is_active: true,
  });

  // Fetch courses with React Query
  const { data: courses = [], isLoading, error, refetch } = useCourses();

  // Mutations
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim()) {
      showToast.error('Course code is required');
      return;
    }
    if (!formData.title.trim()) {
      showToast.error('Course title is required');
      return;
    }

    if (editingCourse) {
      updateCourse.mutate(
        { id: editingCourse.id.toString(), data: formData as any },
        { 
          onSuccess: () => {
            setShowModal(false);
            resetForm();
          } 
        }
      );
    } else {
      createCourse.mutate(
        { data: formData as any },
        { 
          onSuccess: () => {
            setShowModal(false);
            resetForm();
          } 
        }
      );
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      title: course.title,
      description: course.description || '',
      credit_hours: course.credit_hours,
      is_active: course.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (course: Course) => {
    const confirmed = await confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete "${course.code} - ${course.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      deleteCourse.mutate({ id: course.id.toString() });
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      credit_hours: 3,
      is_active: true,
    });
  };

  const isSubmitting = createCourse.isPending || updateCourse.isPending;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 mb-4">Failed to load courses</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const coursesArray = Array.isArray(courses) ? courses : [];
  const activeCourses = coursesArray.filter(c => c.is_active);
  const inactiveCourses = coursesArray.filter(c => !c.is_active);

  return (
    <div className="space-y-6">
      <ConfirmDialog />
      
      {/* Header - Professional, clean */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage courses offered at ICAN Tutorial Centre
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add New Course
        </button>
      </div>

      {/* Statistics - Clean, NO gradients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Total Courses</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{coursesArray.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Active Courses</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{activeCourses.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600">Inactive Courses</div>
          <div className="text-3xl font-bold text-gray-400 mt-2">{inactiveCourses.length}</div>
        </div>
      </div>

      {/* Empty State */}
      {coursesArray.length === 0 ? (
        <NoCoursesFound
          onAdd={() => {
            resetForm();
            setShowModal(true);
          }}
        />
      ) : (
        /* Courses Grid - Professional, NO fancy hover effects */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesArray.map((course) => (
            <div 
              key={course.id} 
              className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{course.code}</h3>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                    course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit course"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(course)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete course"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <h4 className="font-medium text-gray-900 mb-2">{course.title}</h4>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {course.description || 'No description available'}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Credit Hours: {course.credit_hours}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Professional design, NO glassmorphism */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ACC101"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Introduction to Accounting"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Course description..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Hours <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={formData.credit_hours}
                  onChange={(e) => setFormData({ ...formData, credit_hours: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (available for enrollment)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <ButtonWithLoading
                  type="submit"
                  isLoading={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </ButtonWithLoading>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
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
