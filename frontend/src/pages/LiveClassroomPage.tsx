import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Room, RoomEvent, DataPacket_Kind, isLiveKitAvailable } from '../lib/livekitClient';
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

  // Drawers & Modals
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const roomRef = useRef<Room | null>(null);

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
          await room.localParticipant.setMicrophoneEnabled(initialMic);
          await room.localParticipant.setCameraEnabled(initialCam);
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
    
    const handleActiveSpeakerChanged = (speakers: any[]) => {
      if (!isCleanedUp && speakers.length > 0) {
        setActiveSpeakerId(speakers[0].sid);
      }
    };

    const handleDataReceived = (payload: Uint8Array, participant?: any) => {
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
          if (roomRef.current) {
            updateParticipantList(roomRef.current);
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

  const updateParticipantList = (room: Room) => {
    const list: ParticipantTrack[] = [];

    // Local participant
    if (room.localParticipant) {
      const lp = room.localParticipant;
      const localVideoTrackPub = Array.from(lp.videoTrackPublications.values())[0];
      list.push({
        sid: lp.sid,
        identity: lp.identity,
        name: roomToken?.display_name || lp.name || 'You',
        isInstructor: roomToken?.is_instructor,
        isMuted: !lp.isMicrophoneEnabled,
        isCameraOff: !lp.isCameraEnabled,
        isHandRaised,
        isLocal: true,
        videoTrack: localVideoTrackPub?.track,
      });
    }

    // Remote participants
    room.remoteParticipants.forEach((rp) => {
      const remoteVideoTrackPub = Array.from(rp.videoTrackPublications.values())[0];
      list.push({
        sid: rp.sid,
        identity: rp.identity,
        name: rp.name || rp.identity.split('@')[0],
        isInstructor: false,
        isMuted: !rp.isMicrophoneEnabled,
        isCameraOff: !rp.isCameraEnabled,
        isLocal: false,
        videoTrack: remoteVideoTrackPub?.track,
      });
    });

    setParticipants(list);
  };

  // Media Actions
  const handleToggleMic = async () => {
    if (roomRef.current?.localParticipant) {
      const nextState = !isMicOn;
      await roomRef.current.localParticipant.setMicrophoneEnabled(nextState);
      setIsMicOn(nextState);
      if (roomRef.current) updateParticipantList(roomRef.current);
    }
  };

  const handleToggleCam = async () => {
    if (roomRef.current?.localParticipant) {
      const nextState = !isCamOn;
      await roomRef.current.localParticipant.setCameraEnabled(nextState);
      setIsCamOn(nextState);
      if (roomRef.current) updateParticipantList(roomRef.current);
    }
  };

  const handleToggleScreenShare = async () => {
    if (roomRef.current?.localParticipant) {
      const nextState = !isScreenSharing;
      await roomRef.current.localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);
    }
  };

  const handleToggleRaiseHand = async () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);

    if (roomRef.current?.localParticipant) {
      const data = JSON.stringify({ type: 'RAISE_HAND', isHandRaised: nextState });
      const encoder = new TextEncoder();
      await roomRef.current.localParticipant.publishData(encoder.encode(data), {
        kind: DataPacket_Kind.RELIABLE,
      });
      updateParticipantList(roomRef.current);
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
        unreadChatCount={unreadChatCount}
        participantCount={participants.length}
        isInstructor={Boolean(roomToken?.is_instructor)}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onToggleScreenShare={handleToggleScreenShare}
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
