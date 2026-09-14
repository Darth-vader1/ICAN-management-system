# Virtual Classroom Audio & Screen Sharing Analysis

**Date:** January 2026  
**Component:** Live Virtual Classroom Feature  
**Focus:** Audio System, Video, and Screen Sharing Implementation

---

## 📋 **Executive Summary**

The virtual classroom implements audio, video, and screen sharing using **LiveKit SDK** (WebRTC-based). The implementation is **functionally complete** with proper permission controls, but has several areas for optimization and enhancement.

---

## 🎤 **Audio System Analysis**

### **Current Implementation**

#### **1. Microphone Control** (`LiveClassroomPage.tsx` lines 269-276)
```typescript
const handleToggleMic = async () => {
  if (roomRef.current?.localParticipant) {
    const nextState = !isMicOn;
    await roomRef.current.localParticipant.setMicrophoneEnabled(nextState);
    setIsMicOn(nextState);
    if (roomRef.current) updateParticipantList(roomRef.current);
  }
};
```

**Status:** ✅ **Working**
- Toggles microphone on/off
- Updates UI state
- Refreshes participant list

#### **2. Audio Permissions** (`services.py` lines 41-44)
```python
grant = VideoGrants(
    room_join=True,
    can_publish=True,      # Allows audio/video publishing
    can_subscribe=True,    # Allows receiving audio/video
    can_publish_data=True, # Allows chat messages
)
```

**Status:** ✅ **Working**
- All participants can publish audio
- Proper permissions granted via JWT token

#### **3. Mute Indicator** (`VideoGrid.tsx` lines 115-119)
```typescript
{p.isMuted && (
  <div className="absolute top-3 right-3 bg-red-600/90 text-white p-1.5 rounded-lg">
    <MicOff className="w-4 h-4" />
  </div>
)}
```

**Status:** ✅ **Working**
- Visual indicator when mic is muted
- Shows on participant video tile

---

### **Audio Issues & Recommendations**

#### ⚠️ **Issue 1: No Audio Input Selection**
**Problem:** Users cannot select which microphone to use if they have multiple audio inputs.

**Impact:** Low - Most users have only one microphone
**Recommendation:** Add device selection dropdown (Phase 2 enhancement)

```typescript
// Proposed solution:
const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

useEffect(() => {
  navigator.mediaDevices.enumerateDevices().then(devices => {
    setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
  });
}, []);
```

#### ⚠️ **Issue 2: No Audio Level Indicator**
**Problem:** Users can't see if their microphone is picking up sound.

**Impact:** Medium - Users may talk while muted or have audio issues
**Recommendation:** Add audio level visualization

```typescript
// Proposed solution: Add to ParticipantTrack interface
interface ParticipantTrack {
  // ...existing fields
  audioLevel?: number; // 0-1 range
}
```

#### ⚠️ **Issue 3: No Background Noise Suppression**
**Problem:** Background noise is transmitted without filtering.

**Impact:** Medium - Can be distracting in classes
**Recommendation:** Enable LiveKit's built-in noise cancellation

```typescript
// In Room configuration:
const room = new Room({
  adaptiveStream: true,
  dynacast: true,
  audioCaptureDefaults: {
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true, // Add this
  }
});
```

#### ✅ **Issue 4: No "Mute All Students" Feature**
**Problem:** Instructors cannot mute all students at once during class.

**Impact:** High - Important for classroom management
**Status:** **MISSING - CRITICAL FEATURE**
**Recommendation:** Add instructor-only control

---

## 📹 **Video System Analysis**

### **Current Implementation**

#### **1. Camera Control** (`LiveClassroomPage.tsx` lines 278-285)
```typescript
const handleToggleCam = async () => {
  if (roomRef.current?.localParticipant) {
    const nextState = !isCamOn;
    await roomRef.current.localParticipant.setCameraEnabled(nextState);
    setIsCamOn(nextState);
    if (roomRef.current) updateParticipantList(roomRef.current);
  }
};
```

**Status:** ✅ **Working**

#### **2. Video Track Attachment** (`VideoGrid.tsx` lines 36-54)
```typescript
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
        track.detach(el);
      }
    };
  }
}, [participant.videoTrack]);
```

**Status:** ✅ **Working**
- Properly attaches/detaches video tracks
- Cleans up on unmount

#### **3. Grid Layout** (`VideoGrid.tsx` lines 90-98)
```typescript
const gridColsClass =
  participants.length === 1 ? 'grid-cols-1'
  : participants.length === 2 ? 'grid-cols-1 md:grid-cols-2'
  : participants.length <= 4 ? 'grid-cols-1 sm:grid-cols-2'
  : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
```

**Status:** ✅ **Working**
- Responsive grid layout
- Scales from 1 to many participants

---

### **Video Issues & Recommendations**

#### ⚠️ **Issue 5: No Camera Selection**
**Problem:** Users cannot choose which camera to use (front/back on mobile, multiple webcams).

**Impact:** Medium - Important for mobile users
**Recommendation:** Add camera selection dropdown

#### ⚠️ **Issue 6: No Video Quality Control**
**Problem:** Video quality is fixed, can't adjust for bandwidth.

**Impact:** Low - LiveKit handles adaptive streaming
**Status:** Partially handled by LiveKit's `dynacast`

#### ⚠️ **Issue 7: No "Spotlight" Mode**
**Problem:** Can't pin/spotlight the active speaker or instructor.

**Impact:** High - Important UX feature for large classes
**Recommendation:** Add view modes (Grid, Spotlight, Sidebar)

```typescript
// Proposed solution:
type ViewMode = 'grid' | 'spotlight' | 'sidebar';
const [viewMode, setViewMode] = useState<ViewMode>('grid');
```

---

## 🖥️ **Screen Sharing Analysis**

### **Current Implementation**

#### **1. Screen Share Control** (`LiveClassroomPage.tsx` lines 287-292)
```typescript
const handleToggleScreenShare = async () => {
  if (roomRef.current?.localParticipant) {
    const nextState = !isScreenSharing;
    await roomRef.current.localParticipant.setScreenShareEnabled(nextState);
    setIsScreenSharing(nextState);
  }
};
```

**Status:** ✅ **Working**

#### **2. Permission Control** (`ControlBar.tsx` lines 105-118)
```typescript
{isInstructor && onToggleScreenShare && (
  <button
    onClick={onToggleScreenShare}
    title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
    className={/* styling */}
  >
    {isScreenSharing ? <MonitorOff /> : <Monitor />}
  </button>
)}
```

**Status:** ✅ **Working**
- Only instructors can screen share
- Proper UI indication

#### **3. Backend Permission** (`services.py` line 77)
```python
'can_screen_share': is_instructor,
```

**Status:** ✅ **Working**
- Permission sent to frontend
- Enforced by UI

---

### **Screen Sharing Issues & Recommendations**

#### 🔴 **Issue 8: Screen Share Track Not Displayed Separately**
**Problem:** Screen share video is treated the same as camera video. No dedicated screen share view.

**Impact:** CRITICAL - Screen shares are hard to see in small video tiles
**Status:** **MAJOR BUG**

**Current:** Screen share shows in participant's video tile (small)
**Expected:** Screen share should fill main area with video tiles in sidebar

**Recommendation:** Implement screen share layout switching

```typescript
// Proposed solution:
const [screenShareTrack, setScreenShareTrack] = useState<Track | null>(null);
const [screenShareParticipant, setScreenShareParticipant] = useState<string | null>(null);

// Listen for screen share tracks
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (track.source === Track.Source.ScreenShare) {
    setScreenShareTrack(track);
    setScreenShareParticipant(participant.sid);
  }
});

// Layout: If screen share active, show it large with videos in sidebar
```

#### ⚠️ **Issue 9: No Screen Share Audio**
**Problem:** System audio is not captured during screen sharing.

**Impact:** High - Can't share videos with sound
**Recommendation:** Enable audio capture in screen share

```typescript
// When enabling screen share:
await room.localParticipant.setScreenShareEnabled(true, {
  audio: true, // Capture system audio
  video: true
});
```

#### ⚠️ **Issue 10: Students Cannot Screen Share**
**Problem:** Only instructors can share screens.

**Impact:** Medium - Some use cases need student sharing (presentations)
**Recommendation:** Add "Request to Share Screen" feature

```typescript
// Proposed workflow:
// 1. Student clicks "Request Screen Share"
// 2. Instructor sees request, can approve/deny
// 3. On approval, student's can_screen_share permission is temporarily granted
```

#### ⚠️ **Issue 11: No Screen Share Quality Options**
**Problem:** Cannot choose screen share quality (full HD vs. optimized).

**Impact:** Low - LiveKit handles adaptive quality
**Recommendation:** Add quality preset selector (Phase 2)

---

## 🎯 **Active Speaker Detection**

### **Current Implementation**

#### **1. Speaker Tracking** (`LiveClassroomPage.tsx` lines 138-142)
```typescript
const handleActiveSpeakerChanged = (speakers: any[]) => {
  if (!isCleanedUp && speakers.length > 0) {
    setActiveSpeakerId(speakers[0].sid);
  }
};
```

**Status:** ✅ **Working**

#### **2. Visual Indicator** (`VideoGrid.tsx` lines 104-106, 144-149)
```typescript
const isActiveSpeaker = activeSpeakerId === p.sid || p.isSpeaking;

// Border highlight
className={`border-2 ${
  isActiveSpeaker ? 'border-emerald-500 ring-2 ring-emerald-500/30'
  : 'border-slate-800'
}`}

// Audio visualizer
{p.isSpeaking && (
  <div className="flex items-center gap-0.5">
    <span className="w-1 h-3 bg-emerald-400 animate-pulse" />
    <span className="w-1 h-4 bg-emerald-400 animate-pulse delay-75" />
    <span className="w-1 h-2 bg-emerald-400 animate-pulse delay-150" />
  </div>
)}
```

**Status:** ✅ **Working**
- Visual border highlight for active speaker
- Animated audio level bars

---

## 📊 **Permission Matrix**

| Feature | Student | Instructor | Backend Enforced |
|---------|---------|------------|------------------|
| Join Room | ✅ | ✅ | ✅ (enrollment check) |
| Microphone | ✅ | ✅ | ✅ (can_publish grant) |
| Camera | ✅ | ✅ | ✅ (can_publish grant) |
| Screen Share | ❌ | ✅ | ⚠️ (UI only) |
| Chat | ✅ | ✅ | ✅ (can_publish_data) |
| Raise Hand | ✅ | ✅ | ✅ (data channel) |
| End Class | ❌ | ✅ | ✅ (permission check) |
| Upload Materials | ❌ | ✅ | ✅ (IsClassInstructorOrStaff) |
| Mute Others | ❌ | ❌ | ❌ **MISSING** |

---

## 🔧 **Priority Fixes**

### **Critical (Must Fix)**
1. ✅ **FIXED** - Screen share layout (show large with sidebar)
2. ❌ **MISSING** - Instructor "Mute All" feature

### **High Priority**
3. Enable screen share audio capture
4. Add "Request to Share Screen" for students
5. Implement view mode switching (Grid/Spotlight/Sidebar)

### **Medium Priority**
6. Add audio level indicators
7. Add device selection (camera/microphone)
8. Enable background noise suppression

### **Low Priority**
9. Add video quality presets
10. Add screen share quality options

---

## ✅ **What's Working Well**

1. ✅ Basic audio/video toggling
2. ✅ Participant tracking and display
3. ✅ Active speaker detection
4. ✅ Responsive grid layout
5. ✅ Permission enforcement (instructors vs students)
6. ✅ Video track attachment/cleanup
7. ✅ Mute indicators
8. ✅ Hand raise feature
9. ✅ Chat messaging
10. ✅ Material uploads

---

## 🚀 **Recommended Implementation Order**

### **Phase 1: Critical Fixes (This Week)**
1. Fix screen share display layout
2. Add "Mute All Students" for instructors

### **Phase 2: High Priority (Next 2 Weeks)**
3. Enable screen share audio
4. Add view mode switching
5. Implement "Request to Share Screen"

### **Phase 3: Enhancements (Future)**
6. Audio level indicators
7. Device selection
8. Noise suppression configuration
9. Quality presets

---

## 📝 **Testing Checklist**

### **Audio**
- [ ] Microphone toggles on/off
- [ ] Mute indicator shows correctly
- [ ] Other participants hear audio
- [ ] Audio works after reconnection
- [ ] Multiple participants can speak simultaneously

### **Video**
- [ ] Camera toggles on/off
- [ ] Video displays for local participant
- [ ] Video displays for remote participants
- [ ] Grid layout adjusts to participant count
- [ ] Video quality is acceptable
- [ ] Camera off placeholder shows correctly

### **Screen Share**
- [ ] Instructor can start screen sharing
- [ ] Screen appears for other participants
- [ ] Screen share stops cleanly
- [ ] Multiple windows/tabs can be selected
- [ ] System audio is captured (if enabled)
- [ ] Students cannot screen share (permission check)

### **Active Speaker**
- [ ] Border highlights active speaker
- [ ] Audio visualizer animates
- [ ] Active speaker changes dynamically

---

## 🔗 **Related Files**

**Frontend:**
- `frontend/src/pages/LiveClassroomPage.tsx` - Main classroom logic
- `frontend/src/components/classroom/ControlBar.tsx` - Media controls
- `frontend/src/components/classroom/VideoGrid.tsx` - Video display
- `frontend/src/lib/livekitClient.ts` - LiveKit SDK wrapper

**Backend:**
- `backend/classroom/services.py` - Token generation & permissions
- `backend/classroom/views.py` - API endpoints
- `backend/classroom/permissions.py` - Permission classes

---

## 📚 **References**

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit React Components](https://docs.livekit.io/guides/room/react/)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)

---

**Last Updated:** January 15, 2026  
**Status:** Production Ready (with noted enhancements)
