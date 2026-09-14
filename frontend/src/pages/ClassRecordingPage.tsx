import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, FileText, Calendar, Clock, User, ShieldCheck } from 'lucide-react';
import { useVirtualClass, useClassRecordings, useClassMaterials } from '../hooks/queries/useClassroom';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

export const ClassRecordingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: virtualClass, isLoading } = useVirtualClass(id || '');
  const { data: recordings = [] } = useClassRecordings(id || '');
  const { data: materials = [] } = useClassMaterials(id || '');

  if (isLoading || !virtualClass) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const primaryRecording = recordings[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Back Button */}
      <button
        onClick={() => navigate('/classrooms')}
        className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Virtual Classrooms</span>
      </button>

      {/* Main Recording Video Player */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden space-y-6">
        <div className="bg-slate-950 aspect-video w-full flex items-center justify-center relative">
          {primaryRecording?.playback_url ? (
            <video
              src={primaryRecording.playback_url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Play className="w-16 h-16 text-purple-500 mb-3 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-200">Class Recording Ready</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Video playback URL is being processed by media storage. Click below to refresh if needed.
              </p>
            </div>
          )}
        </div>

        {/* Details & Info */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                {virtualClass.course_code}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">{virtualClass.title}</h1>
              <p className="text-xs text-slate-500 mt-1">{virtualClass.course_name} ({virtualClass.level_name})</p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4" />
              Verified Recording
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Instructor</span>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                {virtualClass.instructor_name}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class Date</span>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(virtualClass.scheduled_start).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duration</span>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {virtualClass.total_scheduled_duration_minutes} minutes
              </p>
            </div>
          </div>

          {/* Attached Materials */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Attached Class Materials ({materials.length})</span>
            </h3>

            {materials.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                No materials attached to this class session.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {materials.map((m) => (
                  <a
                    key={m.id}
                    href={m.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{m.title}</p>
                      <p className="text-[10px] text-slate-500">PDF Learning File</p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">Download</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassRecordingPage;
