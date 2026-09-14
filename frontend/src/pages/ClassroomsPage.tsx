import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  User,
  Plus,
  Play,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useVirtualClasses, useCreateVirtualClass, useStartVirtualClass } from '../hooks/queries/useClassroom';
import { useOfferings } from '../hooks/queries/useAcademics';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import type { VirtualClassListItem, VirtualClassStatus } from '../types/classroom';

export const ClassroomsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.is_staff_role;

  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'recent' | 'recordings'>('live');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [startImmediately, setStartImmediately] = useState(false);

  // Queries
  const { data: virtualClasses = [], isLoading } = useVirtualClasses();
  const { data: offerings = [] } = useOfferings();

  // Mutations
  const createClassMutation = useCreateVirtualClass();
  const startClassMutation = useStartVirtualClass();

  // Schedule modal form state
  const [selectedOffering, setSelectedOffering] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recordingEnabled, setRecordingEnabled] = useState(false);

  // Helper to populate current time + 1 hr
  const populateNowDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setStartDate(`${year}-${month}-${day}`);

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setStartTime(`${hours}:${minutes}`);

    const end = new Date(now.getTime() + 60 * 60 * 1000);
    const endHours = String(end.getHours()).padStart(2, '0');
    const endMinutes = String(end.getMinutes()).padStart(2, '0');
    setEndTime(`${endHours}:${endMinutes}`);
  };

  const openModal = (immediate: boolean = false) => {
    setStartImmediately(immediate);
    if (immediate) {
      populateNowDateTime();
    }
    setShowScheduleModal(true);
  };

  // Filter lists
  const liveClasses = useMemo(
    () => virtualClasses.filter((c) => c.status === 'LIVE' || c.status === 'LOBBY'),
    [virtualClasses]
  );

  const upcomingClasses = useMemo(
    () => virtualClasses.filter((c) => c.status === 'SCHEDULED'),
    [virtualClasses]
  );

  const recentClasses = useMemo(
    () => virtualClasses.filter((c) => c.status === 'ENDED' || c.status === 'CANCELLED'),
    [virtualClasses]
  );

  const recordingClasses = useMemo(
    () => virtualClasses.filter((c) => c.recordings_count > 0 || c.recording_status === 'READY'),
    [virtualClasses]
  );

  const currentList = useMemo(() => {
    let list: VirtualClassListItem[] = [];
    if (activeTab === 'live') list = liveClasses;
    else if (activeTab === 'upcoming') list = upcomingClasses;
    else if (activeTab === 'recent') list = recentClasses;
    else if (activeTab === 'recordings') list = recordingClasses;

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.course_code.toLowerCase().includes(term) ||
        c.course_name.toLowerCase().includes(term) ||
        c.instructor_name.toLowerCase().includes(term)
    );
  }, [activeTab, liveClasses, upcomingClasses, recentClasses, recordingClasses, searchTerm]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffering || !title || !startDate || !startTime || !endTime) return;

    const scheduled_start = new Date(`${startDate}T${startTime}`).toISOString();
    const scheduled_end = new Date(`${startDate}T${endTime}`).toISOString();
    const classStatus: VirtualClassStatus = startImmediately ? 'LIVE' : 'SCHEDULED';

    try {
      const newClass = await createClassMutation.mutateAsync({
        course_offering: selectedOffering,
        title,
        description,
        scheduled_start,
        scheduled_end,
        recording_enabled: recordingEnabled,
        status: classStatus,
      });

      setShowScheduleModal(false);
      setTitle('');
      setDescription('');
      setStartDate('');
      setStartTime('');
      setEndTime('');

      if (startImmediately && newClass?.id) {
        navigate(`/classrooms/${newClass.id}/lobby`);
      }
    } catch (err) {
      // Error handled by mutation
    }
  };

  const getStatusBadge = (status: VirtualClassStatus) => {
    if (status === 'LIVE' || status === 'LOBBY') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          LIVE NOW
        </span>
      );
    }
    if (status === 'SCHEDULED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5" />
          Scheduled
        </span>
      );
    }
    if (status === 'ENDED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <CheckCircle className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="w-3.5 h-3.5" />
        Cancelled
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Video className="w-7 h-7 text-blue-600" />
            <span>Virtual Classroom</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Attend live interactive lectures, access recordings, and download class materials.
          </p>
        </div>

        {isStaff && (
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => openModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Start Class Now</span>
            </button>
            <button
              onClick={() => openModal(false)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule for Later</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Live Now ({liveClasses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Upcoming ({upcomingClasses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'recent'
                  ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recent Classes ({recentClasses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('recordings')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'recordings'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-purple-600" />
              <span>Recordings ({recordingClasses.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search class or course..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Classroom Cards Grid */}
      {currentList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No classes found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'live'
              ? 'There are no live virtual classroom sessions in progress right now.'
              : activeTab === 'upcoming'
              ? 'No upcoming virtual classes scheduled for your enrolled courses.'
              : 'No completed class records or recordings found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentList.map((c) => {
            const isLive = c.status === 'LIVE' || c.status === 'LOBBY';

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Top Status & Course Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider font-mono">
                      {c.course_code}
                    </span>
                    {getStatusBadge(c.status)}
                  </div>

                  {/* Title & Course Name */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{c.course_name} ({c.level_name})</p>
                  </div>

                  {/* Instructor & Time details */}
                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-800">{c.instructor_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>
                        {new Date(c.scheduled_start).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>
                        {new Date(c.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(c.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    {c.materials_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {c.materials_count} PDF{c.materials_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <button
                        onClick={() => navigate(`/classrooms/${c.id}/lobby`)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Live</span>
                      </button>
                    ) : c.recordings_count > 0 ? (
                      <Link
                        to={`/classrooms/${c.id}/recording`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Watch</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isStaff && c.status === 'SCHEDULED' && (
                          <button
                            onClick={() => startClassMutation.mutate(c.id)}
                            disabled={startClassMutation.isPending}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Start Class</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/classrooms/${c.id}/lobby`)}
                          className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          View Class
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Schedule / Start Virtual Class Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {startImmediately ? (
                  <Zap className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Calendar className="w-5 h-5 text-blue-600" />
                )}
                <h3 className="font-bold text-lg text-slate-900">
                  {startImmediately ? 'Launch Live Class Now' : 'Schedule Virtual Classroom'}
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              {/* Timing Mode Segmented Toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStartImmediately(false)}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !startImmediately
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule for Later</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStartImmediately(true);
                    populateNowDateTime();
                  }}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    startImmediately
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Start Immediately (Live Now)</span>
                </button>
              </div>

              {startImmediately && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Live Immediately:</span> This class will launch with <strong className="font-bold">LIVE NOW</strong> status right away. Enrolled students will see it live, and you will be redirected straight to the live room lobby.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Course Offering *
                </label>
                <select
                  required
                  value={selectedOffering}
                  onChange={(e) => setSelectedOffering(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Course Offering...</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.course_code} - {o.course_name} ({o.session_label})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Class Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Week 1: Financial Statement Principles"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Agenda
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Topics covered in this session..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="rec_enabled"
                  checked={recordingEnabled}
                  onChange={(e) => setRecordingEnabled(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="rec_enabled" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Enable automatic LiveKit video recording for this class
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClassMutation.isPending}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                    startImmediately
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-[#0f172a] hover:bg-slate-800'
                  }`}
                >
                  {startImmediately ? (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>{createClassMutation.isPending ? 'Launching Live Class...' : 'Launch Live Class Now'}</span>
                    </>
                  ) : (
                    <span>{createClassMutation.isPending ? 'Scheduling...' : 'Schedule Virtual Class'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomsPage;
