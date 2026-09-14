import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Hand,
  MessageSquare,
  Users,
  LogOut,
  PhoneOff,
  Clock,
} from 'lucide-react';

interface ControlBarProps {
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  unreadChatCount?: number;
  participantCount: number;
  isInstructor: boolean;
  meetingDuration?: string;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreenShare?: () => void;
  onToggleRaiseHand: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
  onEndClass?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isMicOn,
  isCamOn,
  isScreenSharing,
  isHandRaised,
  unreadChatCount = 0,
  participantCount,
  isInstructor,
  meetingDuration,
  onToggleMic,
  onToggleCam,
  onToggleScreenShare,
  onToggleRaiseHand,
  onToggleChat,
  onToggleParticipants,
  onLeave,
  onEndClass,
}) => {
  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-md text-white px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-2 shadow-2xl">
      {/* Left: Room Status / Participants count */}
      <div className="hidden sm:flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE</span>
          {meetingDuration && (
            <>
              <span className="text-emerald-500/40">|</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold tracking-wider">{meetingDuration}</span>
            </>
          )}
        </span>
        <button
          onClick={onToggleParticipants}
          className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Users className="w-4 h-4 text-slate-400" />
          <span>{participantCount} In Class</span>
        </button>
      </div>

      {/* Center: Main Media Controls */}
      <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
        {/* Mic */}
        <button
          onClick={onToggleMic}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          className={`p-3 rounded-full transition-all cursor-pointer ${
            isMicOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-lg ring-2 ring-red-500/50'
          }`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Cam */}
        <button
          onClick={onToggleCam}
          title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
          className={`p-3 rounded-full transition-all cursor-pointer ${
            isCamOn
              ? 'bg-slate-800 hover:bg-slate-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white shadow-lg ring-2 ring-red-500/50'
          }`}
        >
          {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Screen Share (Instructor only) */}
        {isInstructor && onToggleScreenShare && (
          <button
            onClick={onToggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg ring-2 ring-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </button>
        )}

        {/* Raise Hand */}
        <button
          onClick={onToggleRaiseHand}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          className={`p-3 rounded-full transition-all cursor-pointer ${
            isHandRaised
              ? 'bg-amber-500 text-slate-900 font-bold shadow-lg ring-2 ring-amber-400/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Chat Drawer Toggle */}
        <button
          onClick={onToggleChat}
          title="Open Classroom Chat"
          className="relative p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Participants Mobile Trigger */}
        <button
          onClick={onToggleParticipants}
          title="View Participants"
          className="sm:hidden p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Leave / End Class */}
      <div className="flex items-center gap-2">
        {isInstructor && onEndClass ? (
          <button
            onClick={onEndClass}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden sm:inline">End Class</span>
          </button>
        ) : (
          <button
            onClick={onLeave}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        )}
      </div>
    </div>
  );
};
