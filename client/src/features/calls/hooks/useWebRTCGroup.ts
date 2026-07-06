import { useState, useRef, useEffect, useCallback } from 'react';
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStream, mediaDevices } from 'react-native-webrtc';
import { useSignalR } from '@shared/hooks/useSignalR';

// WebRTC STUN/TURN Servers
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export function useWebRTCGroup(groupId: string) {
  const { 
    startGroupCall, 
    joinGroupCall, 
    leaveGroupCall, 
    sendGroupOffer, 
    sendGroupAnswer, 
    sendGroupIce,
    setOnUserJoinedGroupCall,
    setOnUserLeftGroupCall,
    setOnReceiveGroupOffer,
    setOnReceiveGroupAnswer,
    setOnReceiveGroupIce,
  } = useSignalR();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  // Mapping of connectionId -> RTCPeerConnection
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // We set localStreamRef immediately when stream is acquired to avoid race conditions.
  const localStreamRef = useRef<MediaStream | null>(null);

  const removePeer = useCallback((connectionId: string) => {
    const pc = peersRef.current.get(connectionId);
    if (pc) {
      pc.close();
      peersRef.current.delete(connectionId);
    }
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(connectionId);
      return newMap;
    });
  }, []);

  const createPeer = useCallback((targetConnectionId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection(configuration);
    
    // Add local tracks to peer
    stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

    // Listen for remote tracks
    // @ts-ignore
    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(targetConnectionId, event.streams[0]);
          return newMap;
        });
      }
    };

    // Listen for ICE candidates
    // @ts-ignore
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        sendGroupIce(targetConnectionId, event.candidate, groupId);
      }
    };

    peersRef.current.set(targetConnectionId, pc);
    return pc;
  }, [groupId, sendGroupIce]);

  // SignalR Event Handlers for Mesh
  useEffect(() => {
    setOnUserJoinedGroupCall((_groupId, userId, connectionId) => {
      if (_groupId !== groupId) return;
      // We don't create PC here. We wait for the newcomer to send an offer.
      console.log('User joined group call', userId);
    });

    setOnUserLeftGroupCall((_groupId, userId, connectionId) => {
      if (_groupId !== groupId) return;
      removePeer(connectionId);
    });

    setOnReceiveGroupOffer(async (callerId, callerConnectionId, sdp, _groupId) => {
      if (_groupId !== groupId) return;
      const stream = localStreamRef.current;
      if (!stream) return;

      const pc = createPeer(callerConnectionId, stream);
      const offerDesc = new RTCSessionDescription(JSON.parse(sdp));
      await pc.setRemoteDescription(offerDesc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendGroupAnswer(callerConnectionId, JSON.stringify(answer), groupId);
    });

    setOnReceiveGroupAnswer(async (callerId, callerConnectionId, sdp, _groupId) => {
      if (_groupId !== groupId) return;
      const pc = peersRef.current.get(callerConnectionId);
      if (pc) {
        const answerDesc = new RTCSessionDescription(JSON.parse(sdp));
        await pc.setRemoteDescription(answerDesc);
      }
    });

    setOnReceiveGroupIce(async (callerId, callerConnectionId, candidate, _groupId) => {
      if (_groupId !== groupId) return;
      const pc = peersRef.current.get(callerConnectionId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate as any));
      }
    });
  }, [groupId, createPeer, removePeer, sendGroupAnswer]);

  // Initialize local stream
  const startLocalStream = async (audioOnly: boolean = false) => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: !audioOnly,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (e) {
      console.error('Lỗi lấy quyền camera/mic', e);
      return null;
    }
  };

  // 1. Initializer: Call this when opening the group call screen
  const initCall = async (isInitiator: boolean) => {
    const stream = await startLocalStream(false);
    if (!stream) return;

    if (isInitiator) {
      await startGroupCall(groupId);
    } else {
      const activeMembers = await joinGroupCall(groupId);
      // Wait for existing members to send us offers OR we send offers to them.
      // In this mesh setup, the newcomer will send offers to all existing members.
      for (const memberConnId of activeMembers) {
        const pc = createPeer(memberConnId, stream);
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);
        await sendGroupOffer(memberConnId, JSON.stringify(offer), groupId);
      }
    }
  };

  const endCall = async () => {
    await leaveGroupCall(groupId);
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    setRemoteStreams(new Map());
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  return {
    localStream,
    remoteStreams,
    initCall,
    endCall,
    toggleMic,
    toggleCamera,
  };
}
