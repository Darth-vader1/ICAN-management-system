/**
 * Student Detail Page
 * View detailed information about a specific student
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/queries';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading: loading, error: queryError } = useStudent(id!);
  const error = queryError ? (queryError as Error).message : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error || 'Student not found'}</p>
        <Link to="/students" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/students" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to Students
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Student Details</h1>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/students/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Edit Student
          </Link>
        </div>
      </div>

      {/* Student Profile Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-3xl">
              {(student.first_name || '').charAt(0).toUpperCase()}
              {(student.last_name || '').charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-gray-600 mb-4">Student ID: {student.student_id}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-gray-900">
                  {new Date(student.date_of_birth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                <p className="text-gray-900">{student.phone_number || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{student.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Contact Name</label>
            <p className="text-gray-900">{student.emergency_contact_name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Contact Phone</label>
            <p className="text-gray-900">{student.emergency_contact_phone || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Registered</label>
            <p className="text-gray-900">
              {new Date(student.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Last Updated</label>
            <p className="text-gray-900">
              {new Date(student.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(`/enrollments?student=${id}`)}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-900">View Enrollments</div>
            <div className="text-sm text-gray-500">See enrollment history</div>
          </button>

          <button
            onClick={() => navigate(`/billing?student=${id}`)}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="font-medium text-gray-900">View Billing</div>
            <div className="text-sm text-gray-500">Check payment status</div>
          </button>

          <button
            onClick={() => navigate(`/attendance?student=${id}`)}
            className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-2xl mb-2">✓</div>
            <div className="font-medium text-gray-900">View Attendance</div>
            <div className="text-sm text-gray-500">Check attendance records</div>
          </button>
        </div>
      </div>
    </div>
  );
}
