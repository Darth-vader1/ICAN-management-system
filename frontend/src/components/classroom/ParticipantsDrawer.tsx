import React, { useState } from 'react';
import { X, Search, Mic, MicOff, Video, VideoOff, Hand, ShieldAlert, UserX } from 'lucide-react';
import type { ParticipantTrack } from './VideoGrid';

interface ParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participants: ParticipantTrack[];
  isInstructor: boolean;
  onMuteParticipant?: (sid: string) => void;
  onRemoveParticipant?: (sid: string) => void;
  onLowerHand?: (sid: string) => void;
}

function getInitials(name?: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const ParticipantsDrawer: React.FC<ParticipantsDrawerProps> = ({
  isOpen,
  onClose,
  participants,
  isInstructor,
  onMuteParticipant,
  onRemoveParticipant,
  onLowerHand,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-slate-900 border-l border-slate-800 text-white shadow-2xl flex flex-col transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-100">Participants ({participants.length})</h3>
          <p className="text-xs text-slate-400">Classroom Roster</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search participant..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Participant Roster List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((p) => (
          <div
            key={p.sid}
            className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 flex items-center justify-between gap-2 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white font-bold text-xs flex items-center justify-center border border-slate-700 flex-shrink-0">
                {getInitials(p.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {p.name} {p.isLocal ? '(You)' : ''}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {p.isInstructor && (
                    <span className="text-[9px] bg-blue-600/30 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                      Instructor
                    </span>
                  )}
                  {p.isHandRaised && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                      <Hand className="w-2.5 h-2.5" /> Hand Raised
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media status indicators & Moderation */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {p.isMuted ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className="w-4 h-4 text-emerald-400" />
              )}
              {p.isCameraOff ? (
                <VideoOff className="w-4 h-4 text-slate-500" />
              ) : (
                <Video className="w-4 h-4 text-emerald-400" />
              )}

              {/* Instructor Moderation Controls */}
              {isInstructor && !p.isLocal && (
                <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-700">
                  {p.isHandRaised && onLowerHand && (
                    <button
                      onClick={() => onLowerHand(p.sid)}
                      title="Lower Hand"
                      className="p-1 hover:bg-slate-700 rounded text-amber-400 transition-colors"
                    >
                      <Hand className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!p.isMuted && onMuteParticipant && (
                    <button
                      onClick={() => onMuteParticipant(p.sid)}
                      title="Mute Participant"
                      className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                    >
                      <MicOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onRemoveParticipant && (
                    <button
                      onClick={() => onRemoveParticipant(p.sid)}
                      title="Remove from Class"
                      className="p-1 hover:bg-red-600/30 rounded text-red-500 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
