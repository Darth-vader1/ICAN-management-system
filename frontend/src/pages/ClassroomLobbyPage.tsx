import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, ArrowLeft, Volume2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useVirtualClass, useJoinVirtualClass } from '../hooks/queries/useClassroom';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

export const ClassroomLobbyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: virtualClass, isLoading } = useVirtualClass(id || '');
  const joinMutation = useJoinVirtualClass();

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize media devices preview
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      try {
        setPermissionError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        if (isMounted) {
          setPermissionError('Camera/Microphone permission denied or device not found. You can still join without video.');
          setIsCamOn(false);
        }
      }
    }

    initMedia();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !isCamOn;
      });
    }
    setIsCamOn(!isCamOn);
  };

  const handleEnterClassroom = () => {
    if (!id) return;
    joinMutation.mutate(id, {
      onSuccess: (data) => {
        // Stop local preview stream before entering LiveKit room
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        // Pass token data via state navigation
        navigate(`/classrooms/${id}/live`, { state: { tokenData: data, initialMic: isMicOn, initialCam: isCamOn } });
      },
    });
  };

  if (isLoading || !virtualClass) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-6 px-4 bg-slate-900 rounded-3xl text-white my-4 max-w-4xl mx-auto shadow-2xl border border-slate-800">
      {/* Back Header */}
      <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <button
          onClick={() => navigate('/classrooms')}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Classrooms</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          Pre-Class Device Check
        </span>
      </div>

      {/* Main Content Layout */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Camera Preview Window */}
        <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl flex items-center justify-center">
          {isCamOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                <VideoOff className="w-8 h-8" />
              </div>
              <span className="text-xs font-medium">Camera is Off</span>
            </div>
          )}

          {/* Media Control Toggles Overlay */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
              className={`p-3 rounded-full transition-all cursor-pointer shadow-lg ${
                isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white ring-2 ring-red-500/50'
              }`}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleCam}
              title={isCamOn ? 'Turn Off Cam' : 'Turn On Cam'}
              className={`p-3 rounded-full transition-all cursor-pointer shadow-lg ${
                isCamOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white ring-2 ring-red-500/50'
              }`}
            >
              {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Right: Class Summary & Entry Action */}
        <div className="space-y-6">
          <div>
            <span className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
              {virtualClass.course_code}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-2">{virtualClass.title}</h2>
            <p className="text-xs text-slate-400 mt-1">Instructor: {virtualClass.instructor_name}</p>
          </div>

          {permissionError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{permissionError}</span>
            </div>
          )}

          <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Audio Testing:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> {isMicOn ? 'Microphone Ready' : 'Muted'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Class Room:</span>
              <span className="font-mono text-slate-300">{virtualClass.room_name}</span>
            </div>
          </div>

          <button
            onClick={handleEnterClassroom}
            disabled={joinMutation.isPending}
            className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Video className="w-5 h-5" />
            <span>{joinMutation.isPending ? 'Connecting to Room...' : 'Enter Live Classroom'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassroomLobbyPage;
