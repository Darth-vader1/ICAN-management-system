import React, { useRef, useEffect, useState } from 'react';
import { MicOff, Hand, User as UserIcon, Monitor, Maximize2, Minimize2 } from 'lucide-react';

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
  audioTrack?: any;
  screenShareTrack?: any;
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

/**
 * Renders remote audio tracks into hidden <audio> elements for browser playback
 */
const RemoteAudioPlayer: React.FC<{ track: any }> = ({ track }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (el && track && typeof track.attach === 'function') {
      try {
        track.attach(el);
      } catch (err) {
        console.error('Failed to attach remote audio track:', err);
      }
      return () => {
        if (typeof track.detach === 'function') {
          try {
            track.detach(el);
          } catch (err) {
            // Ignore unattach errors
          }
        }
      };
    }
  }, [track]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
};

/**
 * Camera Video Tile
 */
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

/**
 * Screen Share Main Viewport
 */
const ScreenShareViewport: React.FC<{ track: any; presenterName: string }> = ({ track, presenterName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (el && track && typeof track.attach === 'function') {
      try {
        track.attach(el);
      } catch (err) {
        console.error('Failed to attach screen share track:', err);
      }
      return () => {
        if (typeof track.detach === 'function') {
          try {
            track.detach(el);
          } catch (err) {
            // Ignore detach errors
          }
        }
      };
    }
  }, [track]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-2xl group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />

      {/* Screen Share Overlay Header */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-lg">
        <Monitor className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>{presenterName} is sharing screen</span>
      </div>

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white rounded-xl border border-slate-700 transition-all opacity-80 hover:opacity-100 cursor-pointer"
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Screen Share'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  activeSpeakerId,
}) => {
  // Check if any participant is sharing screen
  const screenShareParticipant = participants.find((p) => Boolean(p.screenShareTrack));

  // Render hidden audio elements for all remote participants with audio tracks
  const remoteAudioElements = participants
    .filter((p) => !p.isLocal && p.audioTrack)
    .map((p) => <RemoteAudioPlayer key={`audio-${p.sid}`} track={p.audioTrack} />);

  if (participants.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950">
        <UserIcon className="w-16 h-16 text-slate-700 mb-3 animate-pulse" />
        <p className="text-base font-semibold text-slate-300">Waiting for participants to connect...</p>
        <p className="text-xs text-slate-500 mt-1">Your instructor will begin shortly.</p>
        {remoteAudioElements}
      </div>
    );
  }

  // ---- THEATER / SCREEN SHARE STAGE LAYOUT ----
  if (screenShareParticipant) {
    return (
      <div className="flex-1 p-3 sm:p-4 bg-slate-950 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
        {/* Main Stage: Screen Share */}
        <ScreenShareViewport
          track={screenShareParticipant.screenShareTrack}
          presenterName={screenShareParticipant.name}
        />

        {/* Side / Bottom Thumbnail Strip */}
        <div className="w-full lg:w-72 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto max-h-[160px] lg:max-h-none shrink-0">
          {participants.map((p) => {
            const isActiveSpeaker = activeSpeakerId === p.sid || p.isSpeaking;

            return (
              <div
                key={p.sid}
                className={`relative min-w-[140px] sm:min-w-[180px] lg:min-w-0 lg:w-full h-28 lg:h-40 bg-slate-900 rounded-xl overflow-hidden border-2 transition-all flex items-center justify-center shrink-0 shadow-md ${
                  isActiveSpeaker
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {!p.isCameraOff && p.videoTrack ? (
                  <ParticipantVideo participant={p} />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-[#0f172a] border border-slate-700 text-white flex items-center justify-center text-sm font-bold">
                      {getInitials(p.name)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Camera Off</span>
                  </div>
                )}

                {p.isMuted && (
                  <div className="absolute top-2 right-2 bg-red-600/90 text-white p-1 rounded-md">
                    <MicOff className="w-3 h-3" />
                  </div>
                )}

                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md truncate">
                  {p.name} {p.isLocal ? '(You)' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {remoteAudioElements}
      </div>
    );
  }

  // ---- STANDARD GRID LAYOUT ----
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

      {remoteAudioElements}
    </div>
  );
};
