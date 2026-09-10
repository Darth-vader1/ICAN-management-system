/**
 * Students Management Page
 * List, search, and manage students (Staff only)
 * Professional design - no gradients, glassmorphism, or vibecoded patterns
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { StudentProfile } from '../services/studentService';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { NoStudentsFound } from '../components/EmptyState';
import { showToast } from '../lib/toast';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  useStudents,
  useDeleteStudent,
} from '../hooks/queries';

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const {
    data: students = [],
    isLoading,
    error,
    refetch,
  } = useStudents();

  const deleteStudentMutation = useDeleteStudent();

  const studentsList = useMemo<StudentProfile[]>(
    () => (Array.isArray(students) ? students : []),
    [students]
  );

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return studentsList;
    const term = searchTerm.toLowerCase();
    return studentsList.filter(
      (student) =>
        student.first_name.toLowerCase().includes(term) ||
        student.last_name.toLowerCase().includes(term) ||
        (student.student_id || student.student_code || '').toLowerCase().includes(term)
    );
  }, [studentsList, searchTerm]);

  const handleDeleteStudent = async (student: StudentProfile) => {
    const confirmed = await confirm({
      title: 'Delete Student?',
      message: `Are you sure you want to delete ${student.first_name} ${student.last_name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      deleteStudentMutation.mutate({ id: student.id });
    }
  };

  const loading = isLoading || deleteStudentMutation.isPending;
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : 'Failed to load students'
    : '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20"></div> {/* Header space */}
        <div className="h-16"></div> {/* Search space */}
        <TableSkeleton rows={10} columns={5} />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{errorMessage}</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (studentsList.length === 0 && !searchTerm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        </div>
        <NoStudentsFound onAdd={() => window.location.href = '/students/new'} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Clean, professional, NO gradients */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage student profiles and information
          </p>
        </div>
        <Link
          to="/students/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </Link>
      </div>

      {/* Search - Simple, functional, NO glassmorphism */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-3 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Statistics - Clean cards, NO colored borders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600">Total Students</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{studentsList.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600">Search Results</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{filteredStudents.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="text-sm font-medium text-gray-600">Active Students</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {studentsList.filter(s => s.is_active).length}
          </div>
        </div>
      </div>

      {/* Students Table - Professional table, NO fancy effects */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="mt-4 text-gray-600 font-medium">
              {searchTerm ? 'No students found matching your search' : 'No students available'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.student_code || student.student_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-700 font-semibold text-sm">
                          {(student.first_name || '').charAt(0).toUpperCase()}
                          {(student.last_name || '').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name || ''} {student.last_name || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{student.whatsapp_number || student.phone_number || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      student.is_active 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(student.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link
                      to={`/students/${student.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteStudent(student)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}
