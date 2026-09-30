/**
 * Schedules Page — Redesigned according to Figma Mockup
 * Features Weekly Calendar, Sessions List, and Timetable Manager (Recurring Templates).
 * 100% Dynamic data fetched from Django REST API backend.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { schedulesService, scheduleTemplatesService } from '../services/academicsService';
import type { ClassScheduleListItem, ScheduleTemplateItem } from '../types/academics';
import { showToast } from '../lib/toast';
import { Calendar, Clock, User, MapPin, Pencil, Trash2, Settings, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';

type TabType = 'calendar' | 'sessions' | 'manager';

export default function SchedulesPage() {
  const { user } = useAuth();
  const isStaff = user?.is_staff_role ?? ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'].includes(user?.role ?? '');

  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [schedules, setSchedules] = useState<ClassScheduleListItem[]>([]);
  const [templates, setTemplates] = useState<ScheduleTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplateItem | null>(null);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

  const [templateForm, setTemplateForm] = useState({
    course_code: 'FA',
    course_name: 'Financial Accounting',
    level_code: 'foundation',
    day_of_week: 'Saturdays',
    frequency: 'Weekly',
    start_time: '09:00',
    end_time: '12:00',
    tutor_name: '',
    room: 'Room A1',
    status: 'active' as 'active' | 'paused',
    status_subtext: '',
  });

  // Session search / filter
  const [sessionSearch, setSessionSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  // Load backend data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedData, tmplData] = await Promise.all([
        schedulesService.getAll(),
        scheduleTemplatesService.getAll(),
      ]);
      setSchedules(schedData);
      setTemplates(tmplData);
    } catch (err) {
      console.error('Failed to load schedules/templates:', err);
      showToast.error('Failed to load class schedules data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute week range label (e.g. 08 Sept – 13 Sept 2025)
  const getWeekRangeLabel = (monday: Date) => {
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const formatShort = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const formatYear = (d: Date) => d.getFullYear();

    return `${formatShort(monday)} – ${formatShort(saturday)} ${formatYear(saturday)}`;
  };

  // Week days array (Monday to Saturday)
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();
    const dateStr = d.toISOString().split('T')[0];
    const isToday = new Date().toISOString().split('T')[0] === dateStr;
    return { dateStr, dayName, dayNum, isToday };
  });

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleThisWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  // Handle Template Create/Update
  const handleOpenTemplateModal = (tmpl?: ScheduleTemplateItem) => {
    if (tmpl) {
      setEditingTemplate(tmpl);
      setTemplateForm({
        course_code: tmpl.course_code,
        course_name: tmpl.course_name,
        level_code: tmpl.level_code,
        day_of_week: tmpl.day_of_week,
        frequency: tmpl.frequency,
        start_time: tmpl.start_time.slice(0, 5),
        end_time: tmpl.end_time.slice(0, 5),
        tutor_name: tmpl.tutor_name,
        room: tmpl.room,
        status: tmpl.status as 'active' | 'paused',
        status_subtext: tmpl.status_subtext || '',
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        course_code: 'FA',
        course_name: 'Financial Accounting',
        level_code: 'foundation',
        day_of_week: 'Saturdays',
        frequency: 'Weekly',
        start_time: '09:00',
        end_time: '12:00',
        tutor_name: '',
        room: 'Room A1',
        status: 'active',
        status_subtext: '',
      });
    }
    setShowTemplateModal(true);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateSubmitting(true);
    try {
      if (editingTemplate) {
        await scheduleTemplatesService.update(editingTemplate.id, templateForm);
        showToast.success('Schedule template updated!');
      } else {
        await scheduleTemplatesService.create(templateForm);
        showToast.success('Schedule template created!');
      }
      setShowTemplateModal(false);
      await fetchData();
    } catch (err: any) {
      console.error('Template submit error:', err);
      showToast.error(err?.response?.data?.detail || 'Failed to save template');
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const handleToggleTemplateStatus = async (tmpl: ScheduleTemplateItem) => {
    const newStatus = tmpl.status === 'active' ? 'paused' : 'active';
    try {
      await scheduleTemplatesService.update(tmpl.id, {
        status: newStatus,
        status_subtext: newStatus === 'paused' ? 'Suspended pending renewal' : '',
      });
      showToast.success(`Template ${newStatus === 'active' ? 'activated' : 'paused'}`);
      await fetchData();
    } catch (err) {
      showToast.error('Failed to update template status');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule template?')) return;
    try {
      await scheduleTemplatesService.delete(id);
      showToast.success('Template deleted');
      await fetchData();
    } catch (err) {
      showToast.error('Failed to delete template');
    }
  };

  // Group templates by level
  const foundationTemplates = templates.filter((t) => t.level_code.toLowerCase() === 'foundation');
  const skillsTemplates = templates.filter((t) => t.level_code.toLowerCase() === 'skills');
  const professionalTemplates = templates.filter((t) => t.level_code.toLowerCase() === 'professional');

  // Filter sessions
  const filteredSchedules = schedules.filter((item) => {
    const matchSearch =
      (item.course_name || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (item.class_name || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (item.tutor_name || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(sessionSearch.toLowerCase());
    const matchLevel =
      levelFilter === 'all' || (item.level_code || '').toLowerCase() === levelFilter;
    return matchSearch && matchLevel;
  });

  const SESSIONS_PER_PAGE = 25;
  const [currentSessionPage, setCurrentSessionPage] = useState(1);
  
  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentSessionPage(1);
  }, [sessionSearch, levelFilter]);

  const totalSessionPages = Math.ceil(filteredSchedules.length / SESSIONS_PER_PAGE);
  const paginatedSchedules = filteredSchedules.slice(
    (currentSessionPage - 1) * SESSIONS_PER_PAGE,
    currentSessionPage * SESSIONS_PER_PAGE
  );

  const timeGridHours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span>ICAN Portal</span>
        <span>/</span>
        <span className="text-slate-800 font-semibold">schedules</span>
      </div>

      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-serif">Class Schedules</h1>
        <p className="mt-1 text-sm text-slate-500">
          Weekly timetable, session records, and recurring schedule templates.
        </p>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="border-b border-slate-200 flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center gap-4 sm:gap-8 text-sm font-semibold text-slate-500 min-w-max">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'calendar' ? 'text-[#2563eb] font-bold' : 'hover:text-slate-800'
            }`}
          >
            Weekly Calendar
            {activeTab === 'calendar' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'sessions' ? 'text-[#2563eb] font-bold' : 'hover:text-slate-800'
            }`}
          >
            Sessions List
            {activeTab === 'sessions' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manager')}
            className={`pb-3 transition-colors relative cursor-pointer ${
              activeTab === 'manager' ? 'text-[#2563eb] font-bold' : 'hover:text-slate-800'
            }`}
          >
            Timetable Manager
            {activeTab === 'manager' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] rounded-full" />
            )}
          </button>
        </div>

        {activeTab === 'manager' && isStaff && (
          <button
            type="button"
            onClick={() => handleOpenTemplateModal()}
            className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="text-base leading-none">+</span>
            <span>New template</span>
          </button>
        )}
      </div>

      {/* ── TAB 1: WEEKLY CALENDAR ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Week Navigator */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              >
                ‹
              </button>
              <span className="text-sm font-bold text-slate-800">
                {getWeekRangeLabel(currentWeekStart)}
              </span>
              <button
                type="button"
                onClick={handleNextWeek}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              >
                ›
              </button>
            </div>

            {/* Level Legend & Today button */}
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0f172a]" /> Foundation
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Skills
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Professional
                </span>
              </div>

              <button
                type="button"
                onClick={handleThisWeek}
                className="text-xs font-semibold text-[#2563eb] hover:underline"
              >
                This week
              </button>
            </div>
          </div>

          {/* Timetable Grid Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-bold text-slate-500 py-3 bg-slate-50/50">
                <div className="text-slate-400">TIME</div>
                {weekDays.map((d, idx) => (
                  <div
                    key={idx}
                    className={`space-y-0.5 ${
                      d.isToday ? 'text-[#2563eb] font-extrabold' : 'text-slate-700'
                    }`}
                  >
                    <div className="text-[10px] tracking-wider uppercase text-slate-400">{d.dayName}</div>
                    <div className="text-base">{d.dayNum}</div>
                  </div>
                ))}
              </div>

              {/* Grid Time Slots */}
              {timeGridHours.map((hourStr, hourIdx) => (
                <div
                  key={hourIdx}
                  className="grid grid-cols-7 border-b border-slate-100 min-h-[64px] items-stretch text-xs text-slate-400"
                >
                  {/* Time Label */}
                  <div className="p-2 border-r border-slate-100 font-medium text-[11px] text-slate-400">
                    {hourStr}
                  </div>

                  {/* Day Cells */}
                  {weekDays.map((d, dayIdx) => {
                    // Find schedules matching date + start_time hour
                    const dayEvents = schedules.filter((s) => {
                      if (s.date && s.date === d.dateStr) {
                        const startHour = s.start_time ? s.start_time.split(':')[0] : '';
                        const gridHour = hourStr.split(':')[0];
                        return startHour === gridHour;
                      }
                      return false;
                    });

                    // Also generate template events if no schedule models are present
                    const templateEvents =
                      dayEvents.length === 0
                        ? templates.filter((t) => {
                            const tmplDayName = t.day_of_week.substring(0, 3).toUpperCase();
                            const matchDay = d.dayName.startsWith(tmplDayName.substring(0, 2));
                            const tmplStartHour = t.start_time ? t.start_time.split(':')[0] : '';
                            const gridHour = hourStr.split(':')[0];
                            return matchDay && tmplStartHour === gridHour && t.status === 'active';
                          })
                        : [];

                    return (
                      <div
                        key={dayIdx}
                        className={`p-1.5 border-r border-slate-100 transition-colors ${
                          d.isToday ? 'bg-sky-50/20' : ''
                        }`}
                      >
                        {/* Render Schedules */}
                        {dayEvents.map((evt) => {
                          const lvl = (evt.level_code || 'foundation').toLowerCase();
                          const isFoundation = lvl === 'foundation';
                          const isSkills = lvl === 'skills';
                          return (
                            <div
                              key={evt.id}
                              className={`p-2 rounded-xl border text-xs space-y-1 shadow-2xs ${
                                isFoundation
                                  ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                                  : isSkills
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                  : 'bg-purple-50/80 border-purple-200 text-purple-900'
                              }`}
                            >
                              <div className="font-bold flex items-center justify-between">
                                <span>{evt.course_code || evt.course_name}</span>
                                <span className="text-[10px] opacity-75">{evt.start_time?.slice(0, 5)}</span>
                              </div>
                              <div className="text-[11px] truncate opacity-90">{evt.course_name}</div>
                              <div className="text-[10px] opacity-75 flex items-center gap-2">
                                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {evt.location || 'Room A1'}</span>
                                {evt.tutor_name && <span className="flex items-center gap-0.5"><User className="w-3 h-3 text-slate-400" /> {evt.tutor_name}</span>}
                              </div>
                            </div>
                          );
                        })}

                        {/* Render Template Previews if no specific date event exists */}
                        {templateEvents.map((tmpl) => {
                          const lvl = tmpl.level_code.toLowerCase();
                          const isFoundation = lvl === 'foundation';
                          const isSkills = lvl === 'skills';
                          return (
                            <div
                              key={tmpl.id}
                              className={`p-2 rounded-xl border text-xs space-y-1 shadow-2xs ${
                                isFoundation
                                  ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                                  : isSkills
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                  : 'bg-purple-50/80 border-purple-200 text-purple-900'
                              }`}
                            >
                              <div className="font-bold flex items-center justify-between">
                                <span>{tmpl.course_code}</span>
                                <span className="text-[10px] opacity-75">{tmpl.start_time?.slice(0, 5)}</span>
                              </div>
                              <div className="text-[11px] truncate opacity-90">{tmpl.course_name}</div>
                              <div className="text-[10px] opacity-75 flex items-center gap-2">
                                <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {tmpl.room}</span>
                                <span className="flex items-center gap-0.5"><User className="w-3 h-3 text-slate-400" /> {tmpl.tutor_name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SESSIONS LIST ── */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Search & Level Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by course, class, tutor, or room..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="foundation">Foundation</option>
                <option value="skills">Skills</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>

          {/* Sessions List Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {filteredSchedules.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <p className="text-base font-semibold text-slate-800">No class sessions found</p>
                <p className="text-xs text-slate-500">Try adjusting your search criteria or create a new session.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Course & Class</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Tutor</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {paginatedSchedules.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{item.date}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.course_name || 'Course Session'}</div>
                          <div className="text-slate-400 text-[11px]">{item.class_name || 'Regular Batch'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-50 text-[#2563eb] font-semibold border border-blue-100 px-2.5 py-0.5 rounded-md text-[11px]">
                            {item.level_name || item.level_code || 'Foundation'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location || 'Room A1'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {item.tutor_name || 'Assigned Tutor'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.is_cancelled ? (
                            <span className="bg-red-50 text-red-600 font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
                              Cancelled
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-0.5 rounded-md text-[11px]">
                              Scheduled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Session Pagination Controls */}
            {totalSessionPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentSessionPage((p) => Math.max(1, p - 1))}
                    disabled={currentSessionPage === 1}
                    className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                    disabled={currentSessionPage === totalSessionPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-slate-700 font-medium">
                      Showing <span className="font-bold">{(currentSessionPage - 1) * SESSIONS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-bold">
                        {Math.min(currentSessionPage * SESSIONS_PER_PAGE, filteredSchedules.length)}
                      </span>{' '}
                      of <span className="font-bold">{filteredSchedules.length}</span> sessions
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentSessionPage((p) => Math.max(1, p - 1))}
                        disabled={currentSessionPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-1.5 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="relative inline-flex items-center px-4 py-1.5 text-xs font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0">
                        Page {currentSessionPage} of {totalSessionPages}
                      </span>
                      <button
                        onClick={() => setCurrentSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                        disabled={currentSessionPage === totalSessionPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-1.5 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: TIMETABLE MANAGER ── */}
      {activeTab === 'manager' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-500">
            Recurring schedule templates drive automatic session generation.
          </p>

          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="animate-spin w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* ── Foundation Section ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#0f172a] text-white text-xs font-bold rounded-lg">
                    Foundation
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {foundationTemplates.length} templates
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {foundationTemplates.map((tmpl) => (
                    <TemplateCard
                      key={tmpl.id}
                      item={tmpl}
                      isStaff={isStaff}
                      onEdit={() => handleOpenTemplateModal(tmpl)}
                      onToggleStatus={() => handleToggleTemplateStatus(tmpl)}
                      onDelete={() => handleDeleteTemplate(tmpl.id)}
                    />
                  ))}
                </div>
              </div>

              {/* ── Skills Section ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">
                    Skills
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {skillsTemplates.length} templates
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skillsTemplates.map((tmpl) => (
                    <TemplateCard
                      key={tmpl.id}
                      item={tmpl}
                      isStaff={isStaff}
                      onEdit={() => handleOpenTemplateModal(tmpl)}
                      onToggleStatus={() => handleToggleTemplateStatus(tmpl)}
                      onDelete={() => handleDeleteTemplate(tmpl.id)}
                    />
                  ))}
                </div>
              </div>

              {/* ── Professional Section ── */}
              {professionalTemplates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg">
                      Professional
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {professionalTemplates.length} templates
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {professionalTemplates.map((tmpl) => (
                      <TemplateCard
                        key={tmpl.id}
                        item={tmpl}
                        isStaff={isStaff}
                        onEdit={() => handleOpenTemplateModal(tmpl)}
                        onToggleStatus={() => handleToggleTemplateStatus(tmpl)}
                        onDelete={() => handleDeleteTemplate(tmpl.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── NEW / EDIT TEMPLATE MODAL ── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTemplate ? 'Edit Template' : 'New Schedule Template'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FA"
                    value={templateForm.course_code}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, course_code: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Qualification Level
                  </label>
                  <select
                    value={templateForm.level_code}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, level_code: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="foundation">Foundation</option>
                    <option value="skills">Skills</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Financial Accounting"
                  value={templateForm.course_name}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, course_name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Day of Week
                  </label>
                  <select
                    value={templateForm.day_of_week}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, day_of_week: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Saturdays">Saturdays</option>
                    <option value="Sundays">Sundays</option>
                    <option value="Mondays">Mondays</option>
                    <option value="Tuesdays">Tuesdays</option>
                    <option value="Wednesdays">Wednesdays</option>
                    <option value="Thursdays">Thursdays</option>
                    <option value="Fridays">Fridays</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Frequency
                  </label>
                  <select
                    value={templateForm.frequency}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, frequency: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Every 2 weeks">Every 2 weeks</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={templateForm.start_time}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={templateForm.end_time}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, end_time: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Tutor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Adeyemi Balogun"
                    value={templateForm.tutor_name}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, tutor_name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Room / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room A1"
                    value={templateForm.room}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, room: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={templateForm.status}
                    onChange={(e) =>
                      setTemplateForm((p) => ({
                        ...p,
                        status: e.target.value as 'active' | 'paused',
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Subtext (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Suspended pending tutor renewal"
                    value={templateForm.status_subtext}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, status_subtext: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={templateSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0f172a] hover:bg-slate-800 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {templateSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── REUSABLE TEMPLATE CARD COMPONENT ── */
interface TemplateCardProps {
  item: ScheduleTemplateItem;
  isStaff: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

function TemplateCard({ item, isStaff, onEdit, onToggleStatus, onDelete }: TemplateCardProps) {
  const isPaused = item.status === 'paused';

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-4 transition-all hover:shadow-sm ${
        isPaused ? 'opacity-80 bg-slate-50/50' : ''
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            <span className="text-slate-800 font-extrabold">{item.course_code}</span> ·{' '}
            <span className="text-slate-600 font-normal">{item.course_name}</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {isPaused ? (
            <span className="bg-slate-100 text-slate-500 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-slate-200">
              Paused
            </span>
          ) : (
            <span className="bg-emerald-50 text-emerald-600 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
              Active
            </span>
          )}

          {/* Action Icons for Staff */}
          {isStaff && (
            <div className="flex items-center gap-1 text-slate-400">
              <button
                type="button"
                onClick={onEdit}
                title="Edit Template"
                className="p-1 hover:text-slate-700 transition-colors text-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onToggleStatus}
                title={isPaused ? 'Activate' : 'Pause'}
                className="p-1 hover:text-slate-700 transition-colors text-xs"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                title="Delete Template"
                className="p-1 hover:text-red-600 transition-colors text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Body Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 font-medium pt-1">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {item.day_of_week} — {item.frequency}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.tutor_name || 'Unassigned Tutor'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.room || 'Room A1'}</span>
        </div>
      </div>

      {/* Subtext if Paused */}
      {isPaused && item.status_subtext && (
        <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
          {item.status_subtext}
        </div>
      )}
    </div>
  );
}
