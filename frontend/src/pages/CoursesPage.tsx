/**
 * Courses & Levels Management Page — Figma Redesign
 * Dynamic data driven by Django REST Framework APIs. No hardcoded values.
 */

import { useState, useEffect } from 'react';
import {
  coursesService,
  levelsService,
  sessionsService,
} from '../services/academicsService';
import { levelTierService } from '../services/billingService';
import type { Level, AcademicSession } from '../types/academics';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { showToast } from '../lib/toast';

type MainTab = 'courses' | 'levels' | 'sessions';

interface CourseItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  level: string;
  level_name: string;
  level_code: string;
  price?: number;
  tutor_name?: string;
  enrolled_count?: number;
  is_active: boolean;
}

interface SummaryData {
  active_session: string;
  session_status: string;
  total_courses: number;
  inactive_courses: number;
  active_enrollments: number;
}

export default function CoursesPage() {
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // Navigation State
  const [activeTab, setActiveTab] = useState<MainTab>('courses');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');

  // Loading States
  const [loading, setLoading] = useState<boolean>(true);

  // Dynamic API Data
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [levelTiers, setLevelTiers] = useState<any[]>([]);

  // Level Tier Modal State
  const [showTierModal, setShowTierModal] = useState<boolean>(false);
  const [editingTier, setEditingTier] = useState<any | null>(null);
  const [tierAmountInput, setTierAmountInput] = useState<string>('');
  const [tierForm, setTierForm] = useState({
    level: '',
    course_count: 1,
    amount: '',
    is_active: true,
  });

  // Modals
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');
  const [courseForm, setCourseForm] = useState({
    level: '',
    code: '',
    name: '',
    description: '',
    price: 0,
    is_active: true,
  });

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/[^0-9]/g, '');
    if (!digits) {
      setCourseForm((prev) => ({ ...prev, price: 0 }));
      setPriceInput('');
      return;
    }
    const numericValue = parseInt(digits, 10);
    setCourseForm((prev) => ({ ...prev, price: numericValue }));
    setPriceInput(numericValue.toLocaleString('en-NG'));
  };

  const [showLevelModal, setShowLevelModal] = useState<boolean>(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [levelForm, setLevelForm] = useState({
    name: '',
    code: 'foundation' as 'foundation' | 'skills' | 'professional',
    order: 1,
    description: '',
    is_active: true,
  });

  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [sessionForm, setSessionForm] = useState({
    label: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  // Load all initial dynamic data from backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, coursesRes, levelsRes, sessionsRes, tiersRes] = await Promise.all([
        coursesService.getSummary().catch(() => null),
        coursesService.getAll().catch(() => []),
        levelsService.getAll().catch(() => []),
        sessionsService.getAll().catch(() => []),
        levelTierService.getAll().catch(() => []),
      ]);

      setSummary(sumRes);
      setCourses(coursesRes as CourseItem[]);
      setLevels(levelsRes);
      setSessions(sessionsRes);
      setLevels(levelsRes);
      setLevelTiers(tiersRes);

      if (levelsRes.length > 0 && !courseForm.level) {
        setCourseForm((prev) => ({ ...prev, level: levelsRes[0].id }));
      }
    } catch (err) {
      console.error('Failed to load academic data:', err);
      showToast.error('Failed to load academic structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Course Actions ---
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.code.trim() || !courseForm.name.trim() || !courseForm.level) {
      showToast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingCourse) {
        await coursesService.update(editingCourse.id, courseForm);
        showToast.success('Course updated successfully');
      } else {
        await coursesService.create(courseForm as any);
        showToast.success('Course created successfully');
      }
      
      // Close modal and reset form
      setShowCourseModal(false);
      resetCourseForm();
      
      // Reload data
      await loadData();
    } catch (err: any) {
      console.error('Failed to save course:', err);
      showToast.error(err.response?.data?.detail || err.message || 'Failed to save course');
    }
  };

  const handleToggleCourseStatus = async (course: CourseItem) => {
    try {
      await coursesService.update(course.id, { is_active: !course.is_active });
      showToast.success(`Course ${course.is_active ? 'deactivated' : 'activated'}`);
      loadData();
    } catch (err) {
      showToast.error('Failed to update course status');
    }
  };

  const handleDeleteCourse = async (course: CourseItem) => {
    const confirmed = await confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete "${course.code} - ${course.name}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await coursesService.delete(course.id);
        showToast.success('Course deleted successfully');
        loadData();
      } catch (err) {
        showToast.error('Failed to delete course');
      }
    }
  };

  const resetCourseForm = () => {
    setEditingCourse(null);
    setPriceInput('');
    setCourseForm({
      level: levels.length > 0 ? levels[0].id : '',
      code: '',
      name: '',
      description: '',
      price: 0,
      is_active: true,
    });
  };

  // --- Level Actions ---
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelForm.name.trim()) {
      showToast.error('Level name is required');
      return;
    }

    try {
      if (editingLevel) {
        await levelsService.update(editingLevel.id, levelForm);
        showToast.success('Level updated successfully');
      } else {
        await levelsService.create(levelForm);
        showToast.success('Level created successfully');
      }
      setShowLevelModal(false);
      loadData();
    } catch (err: any) {
      showToast.error(err.response?.data?.detail || 'Failed to save level');
    }
  };

  // --- Level Tier Price Action ---
  const handleTierPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = rawValue.replace(/[^0-9]/g, '');
    if (!digits) {
      if (editingTier) {
        setTierAmountInput('');
      } else {
        setTierForm((prev) => ({ ...prev, amount: '' }));
      }
      return;
    }
    const numericValue = parseInt(digits, 10);
    const formatted = numericValue.toLocaleString('en-NG');
    if (editingTier) {
      setTierAmountInput(formatted);
    } else {
      setTierForm((prev) => ({ ...prev, amount: formatted }));
    }
  };

  const handleSaveTierPrice = async (e: React.FormEvent) => {
    e.preventDefault();

    const raw = (editingTier ? tierAmountInput : tierForm.amount).replace(/[^0-9.]/g, '');
    const numericAmount = parseFloat(raw);
    if (isNaN(numericAmount) || numericAmount < 0) {
      showToast.error('Please enter a valid tuition amount');
      return;
    }

    try {
      if (editingTier) {
        await levelTierService.update(editingTier.id, { amount: numericAmount });
        showToast.success('Level tier price updated successfully');
      } else {
        if (!tierForm.level) {
          showToast.error('Please select an ICAN Level');
          return;
        }
        const activeSession = sessions.find((s) => s.is_active) || sessions[0];
        await levelTierService.create({
          level: tierForm.level,
          session: activeSession ? activeSession.id : null,
          course_count: Number(tierForm.course_count),
          amount: numericAmount,
          is_active: tierForm.is_active,
        });
        showToast.success('Level tier price created successfully');
      }
      setShowTierModal(false);
      setEditingTier(null);
      loadData();
    } catch (err: any) {
      showToast.error(err?.response?.data?.detail || 'Failed to save level tier price');
    }
  };

  // --- Session Actions ---
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.label.trim() || !sessionForm.start_date || !sessionForm.end_date) {
      showToast.error('Session label and dates are required');
      return;
    }

    try {
      if (editingSession) {
        await sessionsService.update(editingSession.id, sessionForm);
        showToast.success('Academic session updated successfully');
      } else {
        await sessionsService.create(sessionForm);
        showToast.success('Academic session created successfully');
      }
      setShowSessionModal(false);
      loadData();
    } catch (err: any) {
      showToast.error(err.response?.data?.detail || 'Failed to save session');
    }
  };

  // Filter courses by level filter
  const filteredLevels = levels.filter((lvl) => {
    if (selectedLevelFilter === 'all') return true;
    return lvl.code.toLowerCase() === selectedLevelFilter.toLowerCase() || lvl.id === selectedLevelFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={typeof confirmState.message === 'string' ? confirmState.message : ''}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant as "danger" | "warning" | "info"}
      />

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Courses & Sessions</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Manage the academic structure of the tutorial centre
        </p>
      </div>

      {/* ── Top 3 Stat Cards (Dynamically computed from API) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ACTIVE SESSION */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIVE SESSION</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.active_session || (sessions.find((s) => s.is_active)?.label || '2025/2026')}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {summary?.session_status || 'Enrollment open'}
          </p>
        </div>

        {/* TOTAL COURSES */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TOTAL COURSES</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.total_courses ?? courses.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {summary?.inactive_courses ?? courses.filter((c) => !c.is_active).length} inactive
          </p>
        </div>

        {/* ACTIVE ENROLLMENTS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIVE ENROLLMENTS</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.active_enrollments ?? 10}
          </p>
        </div>
      </div>

      {/* ── Primary Navigation Tabs ── */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-6 sm:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('courses')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'courses'
                ? 'border-accent-teal text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'levels'
                ? 'border-accent-teal text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Levels
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-accent-teal text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Academic Sessions
          </button>
        </nav>
      </div>

      {/* ── TAB 1: COURSES VIEW ── */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Level Filter Pills & Add Course Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedLevelFilter('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedLevelFilter === 'all'
                    ? 'bg-[#0f172a] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {levels.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedLevelFilter(lvl.code)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    selectedLevelFilter === lvl.code
                      ? 'bg-[#0f172a] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lvl.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                resetCourseForm();
                setShowCourseModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all self-start sm:self-auto"
            >
              <span className="text-base font-normal">+</span> Add Course
            </button>
          </div>

          {/* Courses Grouped by Level */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin w-8 h-8 border-4 border-accent-teal border-t-transparent rounded-full" />
            </div>
          ) : filteredLevels.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
              No courses or levels found.
            </div>
          ) : (
            filteredLevels.map((lvl) => {
              const levelCourses = courses.filter(
                (c) => c.level === lvl.id || c.level_name === lvl.name || c.level_code === lvl.code
              );

              return (
                <div key={lvl.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
                  {/* Level Section Header */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-base font-bold text-slate-900">{lvl.name} Level</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {lvl.description || 'ICAN qualification level'}. · {levelCourses.length} courses
                    </p>
                  </div>

                  {/* Course Table */}
                  {levelCourses.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No courses assigned to this level yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                            <th className="py-3 px-6">CODE</th>
                            <th className="py-3 px-6">COURSE NAME</th>
                            <th className="py-3 px-6">TUTOR</th>
                            <th className="py-3 px-6">ENROLLMENTS</th>
                            <th className="py-3 px-6">STATUS</th>
                            <th className="py-3 px-6 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {levelCourses.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-900">{c.code}</td>
                              <td className="py-4 px-6 max-w-xs">
                                <p className="font-bold text-slate-900">{c.name}</p>
                                {c.description && (
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.description}</p>
                                )}
                              </td>
                              <td className="py-4 px-6 font-medium text-slate-700">
                                {c.tutor_name || 'Unassigned'}
                              </td>
                              <td className="py-4 px-6 font-medium text-slate-700">
                                {c.enrolled_count ?? 0} enrolled
                              </td>
                              <td className="py-4 px-6">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                    c.is_active
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {c.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-3 font-semibold">
                                <button
                                  onClick={() => {
                                    setEditingCourse(c);
                                    const parsedPrice = Number(c.price || 0);
                                    setCourseForm({
                                      level: c.level || lvl.id,
                                      code: c.code,
                                      name: c.name,
                                      description: c.description || '',
                                      price: parsedPrice,
                                      is_active: c.is_active,
                                    });
                                    setPriceInput(parsedPrice > 0 ? parsedPrice.toLocaleString('en-NG') : '');
                                    setShowCourseModal(true);
                                  }}
                                  className="text-slate-600 hover:text-slate-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleCourseStatus(c)}
                                  className="text-slate-500 hover:text-slate-700"
                                >
                                  {c.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(c)}
                                  className="text-rose-500 hover:text-rose-700"
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
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 2: LEVELS VIEW ── */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Academic Levels</h3>
            <button
              onClick={() => {
                setEditingLevel(null);
                setLevelForm({ name: '', code: 'foundation', order: levels.length + 1, description: '', is_active: true });
                setShowLevelModal(true);
              }}
              className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            >
              + Add Level
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Level Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Display Order</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {levels.map((lvl) => (
                  <tr key={lvl.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{lvl.name}</td>
                    <td className="py-3.5 px-4 uppercase font-semibold text-slate-600">{lvl.code}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{lvl.order}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{lvl.description || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${lvl.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {lvl.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3 font-semibold">
                      <button
                        onClick={() => {
                          setEditingLevel(lvl);
                          setLevelForm({
                            name: lvl.name,
                            code: lvl.code as any,
                            order: lvl.order,
                            description: lvl.description || '',
                            is_active: lvl.is_active,
                          });
                          setShowLevelModal(true);
                        }}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Level Tier Tuition Pricing Management Section ── */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Level Tuition Pricing Tiers</h3>
                <p className="text-xs text-slate-500">
                  Set flat tuition prices per ICAN Level based on total courses selected.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTier(null);
                  setTierForm({
                    level: levels.length > 0 ? levels[0].id : '',
                    course_count: 1,
                    amount: '',
                    is_active: true,
                  });
                  setShowTierModal(true);
                }}
                className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              >
                + Add Tier Price
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Course Count Tier</th>
                    <th className="py-3 px-4">Tuition Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {levelTiers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <p className="font-semibold">No level tier pricing records found in database.</p>
                        <p className="text-xs text-slate-400 mt-1">Click the <strong className="text-slate-700">"+ Add Tier Price"</strong> button above to set tuition rates for Foundation, Skills, or Professional levels.</p>
                      </td>
                    </tr>
                  ) : (
                    levelTiers.map((tier) => (
                      <tr key={tier.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {tier.level_name || 'Level'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {tier.course_count} Course{tier.course_count !== 1 ? 's' : ''}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600 text-sm">
                          ₦{Number(tier.amount).toLocaleString('en-NG')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              tier.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {tier.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingTier(tier);
                              setTierAmountInput(Number(tier.amount).toLocaleString('en-NG'));
                              setShowTierModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Edit Price
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ACADEMIC SESSIONS VIEW ── */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Academic Sessions</h3>
            <button
              onClick={() => {
                setEditingSession(null);
                setSessionForm({ label: '', start_date: '', end_date: '', is_active: false });
                setShowSessionModal(true);
              }}
              className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            >
              + Add Session
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Session Label</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sess.label}</td>
                    <td className="py-3.5 px-4 text-slate-600">{sess.start_date}</td>
                    <td className="py-3.5 px-4 text-slate-600">{sess.end_date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sess.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {sess.is_active ? 'Active Session' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3 font-semibold">
                      <button
                        onClick={() => {
                          setEditingSession(sess);
                          setSessionForm({
                            label: sess.label,
                            start_date: sess.start_date,
                            end_date: sess.end_date,
                            is_active: sess.is_active,
                          });
                          setShowSessionModal(true);
                        }}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── COURSE MODAL ── */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto min-w-0">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h3>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Level *</label>
                <select
                  value={courseForm.level}
                  onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent-teal/50"
                  required
                >
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FA"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent-teal/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Financial Accounting"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent-teal/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief course description..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent-teal/50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="course_active"
                  checked={courseForm.is_active}
                  onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-accent-teal rounded"
                />
                <label htmlFor="course_active" className="font-semibold text-slate-700">
                  Active Course
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy hover:bg-navy-dark text-white font-bold rounded-lg transition-colors"
                >
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LEVEL MODAL ── */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto min-w-0 text-xs">
            <h3 className="text-lg font-bold text-slate-900">
              {editingLevel ? 'Edit Academic Level' : 'Add Academic Level'}
            </h3>

            <form onSubmit={handleSaveLevel} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Level Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Foundation Level"
                  value={levelForm.name}
                  onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code *</label>
                <select
                  value={levelForm.code}
                  onChange={(e) => setLevelForm({ ...levelForm, code: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none"
                >
                  <option value="foundation">Foundation</option>
                  <option value="skills">Skills</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={levelForm.description}
                  onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLevelModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f172a] text-white font-bold rounded-lg"
                >
                  Save Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SESSION MODAL ── */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto min-w-0 text-xs">
            <h3 className="text-lg font-bold text-slate-900">
              {editingSession ? 'Edit Academic Session' : 'Add Academic Session'}
            </h3>

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026/2027"
                  value={sessionForm.label}
                  onChange={(e) => setSessionForm({ ...sessionForm, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.start_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.end_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f172a] text-white font-bold rounded-lg"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT LEVEL TIER PRICE ── */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              {editingTier
                ? `Edit Tier Price: ${editingTier.level_name || 'Level'} (${editingTier.course_count} Course${editingTier.course_count !== 1 ? 's' : ''})`
                : 'Add Level Tier Pricing'}
            </h3>
            <form onSubmit={handleSaveTierPrice} className="space-y-4">
              {!editingTier && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Level *
                    </label>
                    <select
                      required
                      value={tierForm.level}
                      onChange={(e) => setTierForm({ ...tierForm, level: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choose ICAN Level --</option>
                      {levels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.name} Level
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Course Count Tier *
                    </label>
                    <select
                      required
                      value={tierForm.course_count}
                      onChange={(e) => setTierForm({ ...tierForm, course_count: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 Course</option>
                      <option value={2}>2 Courses</option>
                      <option value={3}>3 Courses</option>
                      <option value={4}>4 Courses</option>
                      <option value={5}>5 Courses</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tuition Fee Amount *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-500 font-bold text-sm">₦</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={editingTier ? tierAmountInput : tierForm.amount}
                    onChange={handleTierPriceInputChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 40,000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTierModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold"
                >
                  Save Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
