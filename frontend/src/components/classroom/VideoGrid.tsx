import React, { useRef, useEffect } from 'react';
import { MicOff, Hand, User as UserIcon } from 'lucide-react';

export interface ParticipantTrack {
  sid: string;
  identity: string;
  name: string;
  isInstructor?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isHandRaised?: boolean;
  isLocal?: boolean;
  videoTrack?: any;
}

interface VideoGridProps {
  participants: ParticipantTrack[];
  activeSpeakerId?: string;
}

function getInitials(name?: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const ParticipantVideo: React.FC<{ participant: ParticipantTrack }> = ({ participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    const track = participant.videoTrack;

    if (el && track && typeof track.attach === 'function') {
      try {
        track.attach(el);
      } catch (err) {
        console.error('Failed to attach video track:', err);
      }
      return () => {
        if (typeof track.detach === 'function') {
          try {
            track.detach(el);
          } catch (err) {
            // Ignore unattach errors on teardown
          }
        }
      };
    }
  }, [participant.videoTrack]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={participant.isLocal}
      className={`w-full h-full object-cover ${participant.isLocal ? 'transform -scale-x-100' : ''}`}
    />
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  activeSpeakerId,
}) => {
  if (participants.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950">
        <UserIcon className="w-16 h-16 text-slate-700 mb-3 animate-pulse" />
        <p className="text-base font-semibold text-slate-300">Waiting for participants to connect...</p>
        <p className="text-xs text-slate-500 mt-1">Your instructor will begin shortly.</p>
      </div>
    );
  }

  // Layout calculation
  const gridColsClass =
    participants.length === 1
      ? 'grid-cols-1'
      : participants.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : participants.length <= 4
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`flex-1 p-3 sm:p-4 bg-slate-950 overflow-y-auto grid ${gridColsClass} gap-3 sm:gap-4 items-center justify-center`}>
      {participants.map((p) => {
        const isActiveSpeaker = activeSpeakerId === p.sid || p.isSpeaking;

        return (
          <div
            key={p.sid}
            className={`relative w-full h-full min-h-[220px] max-h-[480px] bg-slate-900 rounded-2xl overflow-hidden border-2 transition-all flex items-center justify-center shadow-lg ${
              isActiveSpeaker
                ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Video element container */}
            {!p.isCameraOff && p.videoTrack ? (
              <ParticipantVideo participant={p} />
            ) : (
              /* Camera Off Placeholder */
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-[#0f172a] border border-slate-700 text-white flex items-center justify-center text-xl font-bold shadow-inner">
                  {getInitials(p.name)}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {p.isCameraOff ? 'Camera Off' : 'Connecting Camera...'}
                </span>
              </div>
            )}

            {/* Hand Raised Badge */}
            {p.isHandRaised && (
              <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-xs font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md animate-bounce">
                <Hand className="w-3.5 h-3.5" />
                <span>Raised Hand</span>
              </div>
            )}

            {/* Muted Mic Badge */}
            {p.isMuted && (
              <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-md text-white p-1.5 rounded-lg shadow-md">
                <MicOff className="w-4 h-4" />
              </div>
            )}

            {/* Bottom Overlay: Participant Name & Role Badge */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="bg-slate-950/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800/80 flex items-center gap-2 max-w-[85%] truncate">
                <span className="truncate">{p.name} {p.isLocal ? '(You)' : ''}</span>
                {p.isInstructor && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                    Instructor
                  </span>
                )}
              </div>

              {/* Active Speaker Visualizer */}
              {p.isSpeaking && (
                <div className="flex items-center gap-0.5 bg-emerald-500/20 px-2 py-1.5 rounded-xl border border-emerald-500/40">
                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
