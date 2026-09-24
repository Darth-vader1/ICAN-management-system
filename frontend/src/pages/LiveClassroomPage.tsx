import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Room, RoomEvent, DataPacket_Kind, Track, isLiveKitAvailable } from '../lib/livekitClient';
import { useAuth } from '../contexts/AuthContext';
import {
  useVirtualClass,
  useJoinVirtualClass,
  useEndVirtualClass,
  useClassMaterials,
  useUploadClassMaterial,
} from '../hooks/queries/useClassroom';
import { VideoGrid, ParticipantTrack } from '../components/classroom/VideoGrid';
import { ControlBar } from '../components/classroom/ControlBar';
import { ParticipantsDrawer } from '../components/classroom/ParticipantsDrawer';
import { ChatDrawer, ChatMessage } from '../components/classroom/ChatDrawer';
import { MaterialsModal } from '../components/classroom/MaterialsModal';
import { showToast } from '../lib/toast';
import { classroomService } from '../services/classroomService';
import type { JoinTokenResponse } from '../types/classroom';
import { Clock } from 'lucide-react';

export const LiveClassroomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if LiveKit is properly configured
  useEffect(() => {
    if (!isLiveKitAvailable()) {
      showToast.error(
        'Virtual Classroom feature is not properly configured. Please contact support.'
      );
      navigate('/classrooms');
    }
  }, [navigate]);

  // Route state
  const stateTokenData = (location.state as any)?.tokenData as JoinTokenResponse | undefined;
  const initialMic = (location.state as any)?.initialMic ?? true;
  const initialCam = (location.state as any)?.initialCam ?? true;

  // Queries & Mutations
  const { data: virtualClass } = useVirtualClass(id || '');
  const joinMutation = useJoinVirtualClass();
  const endMutation = useEndVirtualClass();
  const { data: materials = [] } = useClassMaterials(id || '');
  const uploadMaterialMutation = useUploadClassMaterial(id || '');

  // LiveKit Room state
  const [roomToken, setRoomToken] = useState<JoinTokenResponse | null>(stateTokenData || null);
  const [participants, setParticipants] = useState<ParticipantTrack[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | undefined>();
  const [isMicOn, setIsMicOn] = useState(initialMic);
  const [isCamOn, setIsCamOn] = useState(initialCam);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecordingLocal, setIsRecordingLocal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const remoteHandsRef = useRef<Record<string, boolean>>({});

  // Meeting Duration Timer
  useEffect(() => {
    if (!roomToken) return;
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [roomToken]);

  const formatDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  const formattedDuration = formatDuration(elapsedSeconds);

  // Drawers & Modals
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const roomRef = useRef<Room | null>(null);

  // Auto exit classroom if class is marked ENDED
  useEffect(() => {
    if (virtualClass?.status === 'ENDED') {
      showToast.info('This live class session has ended.');
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      navigate('/classrooms');
    }
  }, [virtualClass?.status, navigate]);

  // Fetch token if not supplied via navigation state (only once on mount or when id changes)
  useEffect(() => {
    if (!roomToken && id && !joinMutation.isPending) {
      joinMutation.mutate(id, {
        onSuccess: (data) => setRoomToken(data),
        onError: () => navigate(`/classrooms/${id}/lobby`),
      });
    }
  }, [id]); // Only re-run when id changes, not when roomToken changes

  // Connect to LiveKit Room
  useEffect(() => {
    if (!roomToken) return;

    let isCleanedUp = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    roomRef.current = room;

    async function connectRoom() {
      if (isCleanedUp) return; // Prevent connection if already cleaned up
      
      try {
        await room.connect(roomToken.url, roomToken.token);
        
        if (isCleanedUp) {
          // If cleanup happened during connection, disconnect immediately
          room.disconnect();
          return;
        }
        
        showToast.success(`Connected to ${virtualClass?.title || 'Classroom'}`);

        // Set initial media state
        if (room.localParticipant) {
          try {
            await room.localParticipant.setMicrophoneEnabled(initialMic);
            await room.localParticipant.setCameraEnabled(initialCam);
          } catch (e) {
            // Devices may not be connected or permitted
          }
          setIsMicOn(initialMic);
          setIsCamOn(initialCam);
        }

        updateParticipantList(room);
      } catch (err) {
        if (!isCleanedUp) {
          console.error('Room connection error:', err);
          showToast.error('Failed to connect to real-time classroom server.');
        }
      }
    }

    // Room Event Listeners - use stable references
    const handleParticipantChanged = () => {
      if (!isCleanedUp && roomRef.current) {
        updateParticipantList(roomRef.current);
      }
    };

    const handleLocalTrackUnpublished = (publication: any) => {
      if (publication?.source === Track?.Source?.ScreenShare || publication?.trackName === 'screen_share') {
        setIsScreenSharing(false);
      }
      if (!isCleanedUp && roomRef.current) {
        updateParticipantList(roomRef.current);
      }
    };
    
    const handleActiveSpeakerChanged = (speakers: any[]) => {
      if (!isCleanedUp && speakers.length > 0) {
        setActiveSpeakerId(speakers[0].sid);
      } else if (!isCleanedUp) {
        setActiveSpeakerId(undefined);
      }
    };

    const handleDataReceived = async (payload: Uint8Array, participant?: any) => {
      if (isCleanedUp) return;
      
      try {
        const textDecoder = new TextDecoder();
        const str = textDecoder.decode(payload);
        const data = JSON.parse(str);

        if (data.type === 'CHAT_MESSAGE') {
          const newMsg: ChatMessage = {
            id: String(Date.now()),
            senderId: participant?.sid || 'unknown',
            senderName: participant?.identity || data.senderName || 'Participant',
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: false,
          };
          setChatMessages((prev) => [...prev, newMsg]);
          setUnreadChatCount((prev) => prev + 1);
        } else if (data.type === 'RAISE_HAND') {
          const senderSid = participant?.sid || data.senderSid;
          if (senderSid) {
            remoteHandsRef.current[senderSid] = Boolean(data.isHandRaised);
          }
          if (roomRef.current) {
            updateParticipantList(roomRef.current);
          }
        } else if (data.type === 'MUTE_PARTICIPANT') {
          if (roomRef.current?.localParticipant?.sid === data.targetSid) {
            try {
              await roomRef.current.localParticipant.setMicrophoneEnabled(false);
            } catch (e) {}
            setIsMicOn(false);
            showToast.warning('You were muted by the instructor.');
            if (roomRef.current) updateParticipantList(roomRef.current);
          }
        } else if (data.type === 'KICK_PARTICIPANT') {
          if (roomRef.current?.localParticipant?.sid === data.targetSid) {
            showToast.error('You were removed from the class by the instructor.');
            if (roomRef.current) roomRef.current.disconnect();
            navigate('/classrooms');
          }
        } else if (data.type === 'LOWER_HAND') {
          if (roomRef.current?.localParticipant?.sid === data.targetSid) {
            setIsHandRaised(false);
            if (roomRef.current) updateParticipantList(roomRef.current, false);
          }
        }
      } catch (e) {
        // Silently ignore malformed data
      }
    };

    const handleTokenWillExpire = async () => {
      if (isCleanedUp || !id) return;
      try {
        const freshToken = await classroomService.joinClass(id);
        if (freshToken?.token && roomRef.current) {
          if (typeof (roomRef.current as any).setToken === 'function') {
            (roomRef.current as any).setToken(freshToken.token);
          }
          setRoomToken(freshToken);
          console.log('LiveKit classroom token refreshed automatically.');
        }
      } catch (err) {
        console.error('Failed to refresh classroom token:', err);
      }
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantChanged);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantChanged);
    room.on(RoomEvent.TrackSubscribed, handleParticipantChanged);
    room.on(RoomEvent.TrackUnsubscribed, handleParticipantChanged);
    room.on(RoomEvent.TrackPublished, handleParticipantChanged);
    room.on(RoomEvent.TrackUnpublished, handleParticipantChanged);
    room.on(RoomEvent.TrackMuted, handleParticipantChanged);
    room.on(RoomEvent.TrackUnmuted, handleParticipantChanged);
    room.on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);
    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChanged);
    room.on(RoomEvent.DataReceived, handleDataReceived);
    if ((RoomEvent as any).TokenWillExpire) {
      room.on((RoomEvent as any).TokenWillExpire, handleTokenWillExpire);
    }

    // Refresh token every 3.5 hours to prevent 6-hour expiration
    const tokenRefreshTimer = setInterval(handleTokenWillExpire, 3.5 * 60 * 60 * 1000);

    connectRoom();

    // Cleanup function
    return () => {
      isCleanedUp = true;
      clearInterval(tokenRefreshTimer);
      
      // Remove all event listeners
      room.off(RoomEvent.ParticipantConnected, handleParticipantChanged);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantChanged);
      room.off(RoomEvent.TrackSubscribed, handleParticipantChanged);
      room.off(RoomEvent.TrackUnsubscribed, handleParticipantChanged);
      room.off(RoomEvent.TrackPublished, handleParticipantChanged);
      room.off(RoomEvent.TrackUnpublished, handleParticipantChanged);
      room.off(RoomEvent.TrackMuted, handleParticipantChanged);
      room.off(RoomEvent.TrackUnmuted, handleParticipantChanged);
      room.off(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakerChanged);
      room.off(RoomEvent.DataReceived, handleDataReceived);
      if ((RoomEvent as any).TokenWillExpire) {
        room.off((RoomEvent as any).TokenWillExpire, handleTokenWillExpire);
      }
      
      // Disconnect room and cleanup resources
      room.disconnect();
      roomRef.current = null;
    };
  }, [roomToken?.token]); // Only reconnect if token actually changes

  const updateParticipantList = (room: Room, overrideLocalHand?: boolean) => {
    const list: ParticipantTrack[] = [];
    const localHandState = overrideLocalHand !== undefined ? overrideLocalHand : isHandRaised;

    // Helper to separate camera track vs screen share track
    const extractTracks = (p: any) => {
      const videoPubs = Array.from(p.videoTrackPublications?.values() || []) as any[];
      const audioPubs = Array.from(p.audioTrackPublications?.values() || []) as any[];

      const screenPub = videoPubs.find(
        (pub) => pub.source === Track?.Source?.ScreenShare || pub.trackName === 'screen_share'
      );

      const cameraPub = videoPubs.find(
        (pub) => pub !== screenPub && (pub.source === Track?.Source?.Camera || pub.trackName === 'camera' || true)
      );

      const audioPub = audioPubs.find((pub) => pub.track);

      return {
        cameraTrack: cameraPub?.track,
        screenShareTrack: screenPub?.track,
        audioTrack: audioPub?.track,
      };
    };

    // Local participant
    if (room.localParticipant) {
      const lp = room.localParticipant as any;
      const tracks = extractTracks(lp);
      list.push({
        sid: lp.sid,
        identity: lp.identity,
        name: roomToken?.display_name || lp.name || 'You',
        isInstructor: roomToken?.is_instructor,
        isMuted: !lp.isMicrophoneEnabled,
        isCameraOff: !lp.isCameraEnabled,
        isHandRaised: localHandState,
        isSpeaking: lp.isSpeaking,
        isLocal: true,
        videoTrack: tracks.cameraTrack,
        screenShareTrack: tracks.screenShareTrack,
      });
    }

    // Remote participants
    room.remoteParticipants.forEach((rp: any) => {
      const tracks = extractTracks(rp);
      list.push({
        sid: rp.sid,
        identity: rp.identity,
        name: rp.name || rp.identity.split('@')[0],
        isInstructor: false,
        isMuted: !rp.isMicrophoneEnabled,
        isCameraOff: !rp.isCameraEnabled,
        isHandRaised: Boolean(remoteHandsRef.current[rp.sid]),
        isSpeaking: rp.isSpeaking,
        isLocal: false,
        videoTrack: tracks.cameraTrack,
        screenShareTrack: tracks.screenShareTrack,
        audioTrack: tracks.audioTrack,
      });
    });

    setParticipants(list);
  };

  // Media Actions
  const handleToggleMic = async () => {
    if (roomRef.current?.localParticipant) {
      try {
        const nextState = !isMicOn;
        await roomRef.current.localParticipant.setMicrophoneEnabled(nextState);
        setIsMicOn(nextState);
        if (roomRef.current) updateParticipantList(roomRef.current);
      } catch (err: any) {
        showToast.error(err?.message || 'Could not access microphone.');
      }
    }
  };

  const handleToggleCam = async () => {
    if (roomRef.current?.localParticipant) {
      try {
        const nextState = !isCamOn;
        await roomRef.current.localParticipant.setCameraEnabled(nextState);
        setIsCamOn(nextState);
        if (roomRef.current) updateParticipantList(roomRef.current);
      } catch (err: any) {
        showToast.error(err?.message || 'Could not access camera.');
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (roomRef.current?.localParticipant) {
      try {
        const nextState = !isScreenSharing;
        await roomRef.current.localParticipant.setScreenShareEnabled(nextState);
        setIsScreenSharing(nextState);
      } catch (err: any) {
        if (err?.name !== 'NotAllowedError') {
          showToast.error(err?.message || 'Could not start screen sharing.');
        }
      }
    }
  };

  const handleToggleRaiseHand = async () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);

    if (roomRef.current?.localParticipant) {
      try {
        const data = JSON.stringify({ type: 'RAISE_HAND', isHandRaised: nextState, senderSid: roomRef.current.localParticipant.sid });
        const encoder = new TextEncoder();
        await roomRef.current.localParticipant.publishData(encoder.encode(data), {
          kind: DataPacket_Kind.RELIABLE,
        });
        updateParticipantList(roomRef.current, nextState);
      } catch (err) {
        console.error('Failed to broadcast hand state:', err);
      }
    }
  };

  // Local Screen Recording Action (Instructor)
  const handleToggleLocalRecording = async () => {
    if (isRecordingLocal) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingLocal(false);
      showToast.info('Screen recording stopped. Downloading video...');
    } else {
      // Start recording
      try {
        showToast.info('Select the screen or window you want to record...');
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' },
          audio: true,
        });
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Classroom_Recording_${virtualClass?.course_code || 'Session'}_${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          stream.getTracks().forEach((track) => track.stop());
        };

        stream.getVideoTracks()[0].onended = () => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
            setIsRecordingLocal(false);
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecordingLocal(true);
        showToast.success('Screen recording started! Press stop button when finished.');
      } catch (err: any) {
        if (err?.name !== 'NotAllowedError') {
          showToast.error(err?.message || 'Could not start screen recording.');
        }
      }
    }
  };

  // Instructor Moderation Actions
  const handleMuteParticipant = async (sid: string) => {
    if (!roomRef.current || !roomToken?.is_instructor) return;
    try {
      const payload = JSON.stringify({ type: 'MUTE_PARTICIPANT', targetSid: sid });
      const encoder = new TextEncoder();
      await roomRef.current.localParticipant.publishData(encoder.encode(payload), {
        kind: DataPacket_Kind.RELIABLE,
      });
      showToast.info('Mute request sent to participant.');
    } catch (err) {
      showToast.error('Failed to mute participant.');
    }
  };

  const handleRemoveParticipant = async (sid: string) => {
    if (!roomRef.current || !roomToken?.is_instructor) return;
    if (!window.confirm('Are you sure you want to remove this participant from the class?')) return;
    try {
      const payload = JSON.stringify({ type: 'KICK_PARTICIPANT', targetSid: sid });
      const encoder = new TextEncoder();
      await roomRef.current.localParticipant.publishData(encoder.encode(payload), {
        kind: DataPacket_Kind.RELIABLE,
      });
      showToast.info('Participant removal sent.');
    } catch (err) {
      showToast.error('Failed to remove participant.');
    }
  };

  const handleLowerParticipantHand = async (sid: string) => {
    if (!roomRef.current) return;
    try {
      const payload = JSON.stringify({ type: 'LOWER_HAND', targetSid: sid });
      const encoder = new TextEncoder();
      await roomRef.current.localParticipant.publishData(encoder.encode(payload), {
        kind: DataPacket_Kind.RELIABLE,
      });
    } catch (err) {
      console.error('Failed to lower hand:', err);
    }
  };

  // Fetch persistent chat history on mount / reconnect
  useEffect(() => {
    if (id) {
      classroomService.getChatHistory(id).then((history) => {
        if (Array.isArray(history) && history.length > 0) {
          const formatted: ChatMessage[] = history.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender || 'system',
            senderName: msg.sender_name || 'Participant',
            text: msg.message_text,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: Boolean(user?.id && String(msg.sender) === String(user.id)),
          }));
          setChatMessages(formatted);
        }
      }).catch((err) => {
        console.error('Failed to load chat history:', err);
      });
    }
  }, [id, user?.id]);

  const handleSendChatMessage = async (text: string) => {
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      senderId: roomRef.current?.localParticipant?.sid || 'self',
      senderName: 'You',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);

    if (id) {
      classroomService.sendChatMessage(id, text).catch(() => {});
    }

    if (roomRef.current?.localParticipant) {
      const payload = JSON.stringify({ type: 'CHAT_MESSAGE', text, senderName: roomToken?.display_name });
      const encoder = new TextEncoder();
      await roomRef.current.localParticipant.publishData(encoder.encode(payload), {
        kind: DataPacket_Kind.RELIABLE,
      });
    }
  };

  const handleLeaveClass = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    navigate('/classrooms');
  };

  const handleEndClass = () => {
    if (!id) return;
    if (window.confirm('Are you sure you want to end this live class for all participants?')) {
      endMutation.mutate(id, {
        onSuccess: () => {
          if (roomRef.current) roomRef.current.disconnect();
          navigate('/classrooms');
        },
      });
    }
  };

  return (
    <div className="h-screen w-screen fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Classroom Bar */}
      <div className="bg-[#0f172a] text-white px-5 py-3 border-b border-slate-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded border border-blue-500/30 uppercase">
            {virtualClass?.course_code || 'CLASS'}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-md">
            {virtualClass?.title || 'Live Virtual Classroom'}
          </h2>

          {/* Real-time Meeting Timer Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700/80 rounded-xl text-xs font-mono text-emerald-400 font-bold shadow-inner">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{formattedDuration}</span>
          </div>
        </div>

        <button
          onClick={() => setIsMaterialsOpen(true)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
        >
          Materials ({materials.length})
        </button>
      </div>

      {/* Main Real-Time Video Grid */}
      <VideoGrid participants={participants} activeSpeakerId={activeSpeakerId} />

      {/* Control Bar */}
      <ControlBar
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        isScreenSharing={isScreenSharing}
        isHandRaised={isHandRaised}
        isRecordingLocal={isRecordingLocal}
        unreadChatCount={unreadChatCount}
        participantCount={participants.length}
        isInstructor={Boolean(roomToken?.is_instructor)}
        meetingDuration={formattedDuration}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleLocalRecording={handleToggleLocalRecording}
        onToggleRaiseHand={handleToggleRaiseHand}
        onToggleChat={() => {
          const nextState = !isChatOpen;
          setIsChatOpen(nextState);
          if (nextState) {
            // Reset unread count when opening chat
            setUnreadChatCount(0);
          }
        }}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        onLeave={handleLeaveClass}
        onEndClass={roomToken?.is_instructor ? handleEndClass : undefined}
      />

      {/* Side Drawers & Modals */}
      <ParticipantsDrawer
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        participants={participants}
        isInstructor={Boolean(roomToken?.is_instructor)}
        onMuteParticipant={handleMuteParticipant}
        onRemoveParticipant={handleRemoveParticipant}
        onLowerHand={handleLowerParticipantHand}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setUnreadChatCount(0); // Reset when chat closes
        }}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
      />

      <MaterialsModal
        isOpen={isMaterialsOpen}
        onClose={() => setIsMaterialsOpen(false)}
        materials={materials}
        isInstructor={Boolean(roomToken?.is_instructor)}
        onUpload={(formData) => uploadMaterialMutation.mutate(formData)}
        isUploading={uploadMaterialMutation.isPending}
      />
    </div>
  );
};

export default LiveClassroomPage;
