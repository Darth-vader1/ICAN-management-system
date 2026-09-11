/**
 * ProfilePage Component — Redesigned according to Figma Mockup
 * Dynamic data, zero hardcoded values, supports edit mode & password change modal.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMyStudentProfile, useUpdateStudent } from '../hooks/queries';
import { authService } from '../services/authService';
import { showToast } from '../lib/toast';

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const isStudent = user?.role === 'student';
  const { data: profile, isLoading: loading, refetch: refetchProfile } = useMyStudentProfile(isStudent);
  const updateStudentMutation = useUpdateStudent();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    whatsapp_number: '',
    gender: '',
    date_of_birth: '',
    address: '',
    ican_exam_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  // Sync form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone_number: profile.user_phone || profile.phone_number || '',
        whatsapp_number: profile.whatsapp_number || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
        ican_exam_id: profile.ican_exam_id || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    updateStudentMutation.mutate(
      { id: profile.id, data: formData },
      {
        onSuccess: async () => {
          setIsEditing(false);
          await refetchUser();
          await refetchProfile();
          showToast.success('Profile updated successfully!');
        },
        onError: (err: any) => {
          showToast.error(err?.response?.data?.detail || 'Failed to update profile');
        },
      }
    );
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwords.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      showToast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPasswordError(err?.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const firstName = profile?.first_name || user?.first_name || '';
  const lastName = profile?.last_name || user?.last_name || '';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || (user?.email?.charAt(0).toUpperCase() || 'ST');
  const userEmail = profile?.user_email || user?.email || '';
  const studentCode = profile?.student_code || profile?.student_id || 'N/A';
  const icanExamId = profile?.ican_exam_id || 'N/A';

  const genderDisplay = (val: string) => {
    if (val === 'F' || val === 'Female') return 'Female';
    if (val === 'M' || val === 'Male') return 'Male';
    return val || 'Not specified';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span>ICAN Portal</span>
        <span>/</span>
        <span className="text-slate-800 font-semibold">My Profile</span>
      </div>

      {/* ── Top Header Banner Card (Figma Design) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e3a5f] p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar with Camera Icon Badge */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#1e293b] border-2 border-white/20 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-lg">
                {initials}
              </div>
              <button
                type="button"
                onClick={() => showToast.info('Photo upload feature coming soon!')}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center border-2 border-slate-900 shadow-md hover:bg-blue-600 transition-colors cursor-pointer"
                title="Change Photo"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* Email & Badges */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {userEmail}
              </h2>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300">
                {/* Student Code Badge */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md font-mono text-slate-200 border border-white/10">
                  <span className="text-slate-400">#</span>
                  {studentCode}
                </span>

                {/* ICAN Membership Badge */}
                {icanExamId && icanExamId !== 'N/A' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 backdrop-blur-md text-emerald-300 border border-emerald-500/20 font-medium">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {icanExamId} (ICAN Membership)
                  </span>
                )}

                {/* Registered Date Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md text-slate-300 border border-white/10 font-medium">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Registered {formatDate(profile?.created_at || user?.date_joined)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal Information Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#2563eb] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="personal-info-form"
                disabled={updateStudentMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#2563eb] hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {updateStudentMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {!isEditing ? (
          /* View Mode Key-Value Grid */
          <div className="p-6 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Full name</span>
              <span className="sm:col-span-2 text-slate-900 font-bold">{formData.first_name || firstName} {formData.last_name || lastName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Gender</span>
              <span className="sm:col-span-2 text-slate-900 font-semibold">{genderDisplay(formData.gender)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Date of birth</span>
              <span className="sm:col-span-2 text-slate-900 font-semibold">{formatDate(formData.date_of_birth)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Email address</span>
              <span className="sm:col-span-2 text-slate-900 font-semibold">{userEmail}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">Phone</span>
              <span className="sm:col-span-2 text-slate-900 font-semibold font-mono">{formData.phone_number || 'N/A'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
              <span className="text-slate-500 font-medium">WhatsApp</span>
              <span className="sm:col-span-2 text-slate-900 font-semibold font-mono">{formData.whatsapp_number || 'N/A'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 text-sm">
              <span className="text-slate-500 font-medium">Home address</span>
              <span className="sm:col-span-2 text-slate-900 font-semibold">{formData.address || 'N/A'}</span>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <form id="personal-info-form" onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Gender</option>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                  <option value="O">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">ICAN Membership ID</label>
                <input
                  type="text"
                  name="ican_exam_id"
                  value={formData.ican_exam_id}
                  onChange={handleChange}
                  placeholder="e.g. IC/2024/7823"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Home Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </form>
        )}
      </div>

      {/* ── Account & Security Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Account & Security</h3>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Password Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Password</h4>
              <p className="text-xs text-slate-500 mt-0.5">Use a strong password to protect your account</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            >
              Change password
            </button>
          </div>

          {/* Account Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Account status</h4>
              <p className="text-xs text-slate-500 mt-0.5">Contact administration to change your account status</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {profile?.is_active ?? user?.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Student ID Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Student ID</h4>
              <p className="text-xs text-slate-500 mt-0.5">Your unique ICAN Tutorial Centre identifier</p>
            </div>
            <span className="text-sm font-bold font-mono text-slate-900 tracking-wider self-start sm:self-auto">
              {studentCode}
            </span>
          </div>
        </div>
      </div>

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwords.current_password}
                  onChange={(e) => setPasswords((p) => ({ ...p, current_password: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords((p) => ({ ...p, new_password: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwords.confirm_password}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirm_password: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-blue-700 rounded-xl disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
