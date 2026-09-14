/**
 * LiveKit Client SDK wrapper with production safety checks
 * 
 * CRITICAL: This module requires livekit-client to be installed.
 * Mock fallbacks are ONLY for development builds and will throw errors in production.
 */

const IS_PRODUCTION = import.meta.env.PROD;

export enum RoomEvent {
  ParticipantConnected = 'participantConnected',
  ParticipantDisconnected = 'participantDisconnected',
  TrackSubscribed = 'trackSubscribed',
  TrackUnsubscribed = 'trackUnsubscribed',
  ActiveSpeakersChanged = 'activeSpeakersChanged',
  DataReceived = 'dataReceived',
  ConnectionQualityChanged = 'connectionQualityChanged',
  Disconnected = 'disconnected',
  Reconnecting = 'reconnecting',
  Reconnected = 'reconnected',
}

export enum DataPacket_Kind {
  RELIABLE = 0,
  LOSSY = 1,
}

// Import real LiveKit client
let LiveKitClient: any;
let RoomClass: any;

try {
  // Try to import the actual livekit-client package
  LiveKitClient = await import('livekit-client');
  RoomClass = LiveKitClient.Room;
  
  // Re-export actual enums from livekit-client
  export const { RoomEvent: LiveKitRoomEvent, DataPacket_Kind: LiveKitDataPacket_Kind } = LiveKitClient;
} catch (error) {
  if (IS_PRODUCTION) {
    // CRITICAL: In production, throw an error immediately
    throw new Error(
      'CRITICAL: livekit-client package not found. Virtual classroom feature requires livekit-client to be installed. ' +
      'Run: npm install livekit-client'
    );
  } else {
    // Development fallback with console warning
    console.warn(
      '⚠️  DEV MODE WARNING: livekit-client not installed. Using mock implementation. ' +
      'Install with: npm install livekit-client'
    );
    RoomClass = null;
  }
}

/**
 * Mock classes for development environment ONLY
 * These will never be used in production due to the error thrown above
 */
class MockParticipant {
  sid = 'mock_participant_' + Math.random().toString(36).substring(7);
  identity = 'MockUser';
  name = 'Mock User (Dev Only)';
  isMicrophoneEnabled = true;
  isCameraEnabled = true;
  
  async setMicrophoneEnabled(enabled: boolean) {
    this.isMicrophoneEnabled = enabled;
    console.log(`[MOCK] Microphone ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  async setCameraEnabled(enabled: boolean) {
    this.isCameraEnabled = enabled;
    console.log(`[MOCK] Camera ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  async setScreenShareEnabled(enabled: boolean) {
    console.log(`[MOCK] Screen share ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  async publishData(data: Uint8Array, _options?: any) {
    console.log(`[MOCK] Publishing data:`, new TextDecoder().decode(data));
  }
}

class MockRoom {
  localParticipant: any;
  remoteParticipants = new Map<string, any>();
  private listeners: Record<string, Function[]> = {};

  constructor(_options?: any) {
    this.localParticipant = new MockParticipant();
    console.warn('🚧 MOCK ROOM CREATED - Development mode only. Real LiveKit features disabled.');
  }

  on(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  off(event: string, fn: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== fn);
    }
  }

  async connect(_url: string, _token: string) {
    console.warn('[MOCK] Room.connect() called - no actual connection in dev mode');
    return Promise.resolve();
  }

  disconnect() {
    console.log('[MOCK] Room.disconnect() called');
    this.listeners = {};
  }
}

/**
 * Export the actual Room class in production, or MockRoom in development
 */
export const Room = RoomClass || MockRoom;

/**
 * Check if running with real LiveKit client
 */
export const isLiveKitAvailable = (): boolean => {
  return RoomClass !== null && RoomClass !== undefined;
};

/**
 * Throw error if trying to use virtual classroom without proper setup
 */
export const ensureLiveKitAvailable = (): void => {
  if (!isLiveKitAvailable()) {
    throw new Error(
      'Virtual Classroom requires livekit-client to be installed. ' +
      'Please install it with: npm install livekit-client'
    );
  }
};

