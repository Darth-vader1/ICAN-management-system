/**
 * Student Detail Page Component
 * Displays student profile details matching Figma mockup design aesthetic.
 * 100% Dynamic - Zero Hardcoded Values.
 */

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudent } from '../hooks/queries/useStudents';
import { showToast } from '../lib/toast';
import UserAvatar from '../components/UserAvatar';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading: studentLoading, error: queryError } = useStudent(id!);

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (queryError || !student) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
        <p className="text-red-800 font-semibold mb-4">Student record not found</p>
        <Link
          to="/students"
          className="px-5 py-2.5 bg-[#2563eb] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors inline-block"
        >
          ← Back to Students List
        </Link>
      </div>
    );
  }

  // Formatting Helpers
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

  const initials = `${(student.first_name || '').charAt(0)}${(student.last_name || '').charAt(0)}`.toUpperCase() || 'ST';
  const genderDisplay = (val?: string) => {
    if (val === 'F' || val === 'Female') return 'Female';
    if (val === 'M' || val === 'Male') return 'Male';
    return val || 'Not specified';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* ── Breadcrumb & Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/students" className="hover:text-slate-800 transition-colors">
            ICAN Portal
          </Link>
          <span>/</span>
          <Link to="/students" className="hover:text-slate-800 transition-colors">
            Students
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{student.first_name} {student.last_name}</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/students"
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            ← Back to List
          </Link>
          <Link
            to={`/students/${id}/edit`}
            className="px-4 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* ── Top Header Banner Card (Figma Design) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#1e3a5f] p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar Circle */}
            <div className="relative group flex-shrink-0">
              <UserAvatar
                src={student.photo}
                name={student.full_name}
                email={student.user_email}
                size="xl"
                className="border-2 border-white/20 shadow-lg"
              />
            </div>

            {/* Email & Badges */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {student.user_email || 'N/A'}
              </h2>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300">
                {/* Student Code Badge */}
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md font-mono text-slate-200 border border-white/10">
                  <span className="text-slate-400">#</span>
                  {student.student_code || student.student_id || 'N/A'}
                </span>

                {/* ICAN Membership Badge */}
                {student.ican_exam_id && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 backdrop-blur-md text-emerald-300 border border-emerald-500/20 font-medium">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {student.ican_exam_id} (ICAN Membership)
                  </span>
                )}

                {/* Registration Date Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md text-slate-300 border border-white/10 font-medium">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Registered {formatDate(student.created_at)}
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
          <Link
            to={`/students/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#2563eb] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 210.3H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Link>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Full name</span>
            <span className="sm:col-span-2 text-slate-900 font-bold">{student.first_name} {student.last_name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Gender</span>
            <span className="sm:col-span-2 text-slate-900 font-semibold">{genderDisplay(student.gender)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Date of birth</span>
            <span className="sm:col-span-2 text-slate-900 font-semibold">{formatDate(student.date_of_birth)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Email address</span>
            <span className="sm:col-span-2 text-slate-900 font-semibold">{student.user_email || 'N/A'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">Phone</span>
            <span className="sm:col-span-2 text-slate-900 font-semibold font-mono">{student.user_phone || student.phone_number || 'N/A'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
            <span className="text-slate-500 font-medium">WhatsApp</span>
            <span className="sm:col-span-2 text-slate-900 font-semibold font-mono">{student.whatsapp_number || 'N/A'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 text-sm">
            <span className="text-slate-500 font-medium">Home address</span>
            <span className="sm:col-span-2 text-slate-900 font-semibold">{student.address || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* ── Account & Security Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Account & Security</h3>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Account Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Account status</h4>
              <p className="text-xs text-slate-500 mt-0.5">Current active state of student account in ICAN system</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {student.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Student ID Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Student ID</h4>
              <p className="text-xs text-slate-500 mt-0.5">Unique ICAN Tutorial Centre identifier</p>
            </div>
            <span className="text-sm font-bold font-mono text-slate-900 tracking-wider self-start sm:self-auto">
              {student.student_code || student.student_id || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
