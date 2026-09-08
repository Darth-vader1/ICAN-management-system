import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                ICAN Tutorial Centre
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {user.profile?.first_name || user.email}!
            </h2>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Account Information
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {user.role.replace('_', ' ')}
                  </dd>
                </div>
                {user.profile && 'student_code' in user.profile && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Student Code
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.profile.student_code}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_verified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Phase 1 Complete!</strong> Authentication system is working.
                Additional features (enrollments, payments, etc.) will be added in
                subsequent phases.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
