/**
 * LiveKit Client SDK wrapper with production safety checks
 */

import {
  Room as LiveKitRoom,
  RoomEvent as LiveKitRoomEvent,
  DataPacket_Kind as LiveKitDataPacket_Kind,
  Track as LiveKitTrack,
} from 'livekit-client';

export const Room = LiveKitRoom;
export const RoomEvent = LiveKitRoomEvent;
export const DataPacket_Kind = LiveKitDataPacket_Kind;
export const Track = LiveKitTrack;

/**
 * Check if running with real LiveKit client
 */
export const isLiveKitAvailable = (): boolean => {
  return typeof LiveKitRoom !== 'undefined';
};

/**
 * Ensure LiveKit client is available
 */
export const ensureLiveKitAvailable = (): void => {
  if (!isLiveKitAvailable()) {
    throw new Error(
      'Virtual Classroom requires livekit-client to be installed. ' +
      'Please install it with: npm install livekit-client'
    );
  }
};

