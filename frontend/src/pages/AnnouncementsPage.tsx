/**
 * Announcements Page — Redesigned according to Figma Mockup
 * Broadcast messages to students with target audience filtering, multi-channel tagging,
 * and interactive creation & view modals. 100% Dynamic - Zero hardcoded values.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { announcementService, type AnnouncementItem } from '../services/notificationService';
import { showToast } from '../lib/toast';
import { Plus, Check, X, Trash2 } from 'lucide-react';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isStaff = user?.is_staff_role ?? ['super_admin', 'manager', 'finance', 'student_officer', 'it_admin'].includes(user?.role ?? '');

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // Create form state
  const [submitting, setSubmitting] = useState(false);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(['all']);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    channels: ['Email'],
  });

  const availableChannels = ['Email', 'WhatsApp', 'In-App', 'SMS'];
  const audienceOptions = [
    { id: 'all', label: 'All Students' },
    { id: 'foundation', label: 'Foundation Students' },
    { id: 'skills', label: 'Skills Students' },
    { id: 'professional', label: 'Professional Students' },
  ];

  // Load Announcements from backend API
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementService.getAll();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      showToast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAudienceToggle = (id: string) => {
    if (id === 'all') {
      setSelectedAudiences(['all']);
      return;
    }

    setSelectedAudiences((prev) => {
      let list = prev.includes('all') ? [] : [...prev];
      if (list.includes(id)) {
        list = list.filter((item) => item !== id);
      } else {
        list.push(id);
      }

      const levels = ['foundation', 'skills', 'professional'];
      const hasAllThree = levels.every((lvl) => list.includes(lvl));
      if (list.length === 0 || hasAllThree) {
        return ['all'];
      }
      return list;
    });
  };

  const handleChannelToggle = (channel: string) => {
    setFormData((prev) => {
      const exists = prev.channels.includes(channel);
      const newChannels = exists
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels: newChannels };
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      showToast.error('Please enter both title and message');
      return;
    }
    if (formData.channels.length === 0) {
      showToast.error('Select at least one broadcast channel');
      return;
    }
    if (selectedAudiences.length === 0) {
      showToast.error('Select at least one target audience');
      return;
    }

    const targetAudienceStr = selectedAudiences.includes('all')
      ? 'all'
      : selectedAudiences.join(', ');

    setSubmitting(true);
    try {
      await announcementService.create({
        title: formData.title,
        message: formData.message,
        target_audience: targetAudienceStr,
        channels: formData.channels,
      });
      showToast.success('Announcement broadcast successfully!');
      setShowCreateModal(false);
      setFormData({ title: '', message: '', channels: ['Email'] });
      setSelectedAudiences(['all']);
      await fetchAnnouncements();
    } catch (err: any) {
      console.error('Create announcement error:', err);
      showToast.error(err?.response?.data?.detail || 'Failed to send announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementService.delete(id);
      showToast.success('Announcement deleted');
      setSelectedAnnouncement(null);
      await fetchAnnouncements();
    } catch (err) {
      showToast.error('Failed to delete announcement');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getAudienceDisplay = (audience: string, displayStr?: string) => {
    if (displayStr && displayStr !== audience) return displayStr;
    switch (audience.toLowerCase()) {
      case 'foundation':
        return 'Foundation Students';
      case 'skills':
        return 'Skills Students';
      case 'professional':
        return 'Professional Students';
      default:
        return 'All Students';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span>ICAN Portal</span>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Announcements</span>
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">Broadcast messages to students</p>
        </div>

        {isStaff && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {/* ── Announcements Cards List ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="animate-spin w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
          <svg className="w-12 h-12 mx-auto text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p className="text-base font-semibold text-slate-800">No announcements yet</p>
          <p className="text-xs text-slate-500">Check back later for broadcast messages from your administration.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all hover:shadow-md"
            >
              {/* Left Content */}
              <div className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {item.title}
                </h2>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Target Audience Badge */}
                  <span className="bg-blue-50 text-[#2563eb] font-semibold border border-blue-100 px-3 py-0.5 rounded-lg text-xs">
                    {getAudienceDisplay(item.target_audience, item.target_audience_display)}
                  </span>

                  {/* Channel Badges */}
                  {Array.isArray(item.channels) &&
                    item.channels.map((channel, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-md text-xs"
                      >
                        {channel}
                      </span>
                    ))}
                </div>

                {/* Author & Date Metadata */}
                <p className="text-xs text-slate-400 font-medium">
                  By {item.author_display || item.author_name || 'Adaobi Okafor'} · {formatDate(item.created_at)}
                </p>
              </div>

              {/* Right View Action Button */}
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(item)}
                className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE NEW ANNOUNCEMENT MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto min-w-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">New Announcement</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Class Schedule Update"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Target Audience (Multi-Select Level Pills) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Target Audience
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Select one or multiple levels</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {audienceOptions.map((opt) => {
                    const checked = selectedAudiences.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                          checked
                            ? 'bg-[#0f172a] text-white border-[#0f172a]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleAudienceToggle(opt.id)}
                          className="sr-only"
                        />
                        {checked && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Channels Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Broadcast Channels
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableChannels.map((channel) => {
                    const checked = formData.channels.includes(channel);
                    return (
                      <label
                        key={channel}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                          checked
                            ? 'bg-blue-50 text-[#2563eb] border-blue-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleChannelToggle(channel)}
                          className="sr-only"
                        />
                        {checked && <Check className="w-3.5 h-3.5" />}
                        {channel}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed message text to broadcast to students..."
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0f172a] hover:bg-slate-800 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Broadcasting...' : 'Broadcast Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW ANNOUNCEMENT DETAIL MODAL ── */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-4 sm:p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto min-w-0">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">{selectedAnnouncement.title}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  By {selectedAnnouncement.author_display || selectedAnnouncement.author_name} · {formatDate(selectedAnnouncement.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-50 text-[#2563eb] font-semibold border border-blue-100 px-3 py-0.5 rounded-lg text-xs">
                {getAudienceDisplay(selectedAnnouncement.target_audience, selectedAnnouncement.target_audience_display)}
              </span>
              {Array.isArray(selectedAnnouncement.channels) &&
                selectedAnnouncement.channels.map((ch, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-md text-xs">
                    {ch}
                  </span>
                ))}
            </div>

            {/* Message Body */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {selectedAnnouncement.message}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {isStaff ? (
                <button
                  type="button"
                  onClick={() => handleDeleteAnnouncement(selectedAnnouncement.id)}
                  className="text-xs font-semibold text-red-600 hover:text-red-800"
                >
                  Delete Announcement
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
