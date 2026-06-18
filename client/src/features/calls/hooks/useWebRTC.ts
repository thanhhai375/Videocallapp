import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { useSignalR } from '@shared/hooks/useSignalR';

// STUN Servers for ICE gathering
const peerConstraints = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
      ],
    },
  ],
};

export function useWebRTC(targetConnectionId: string | null) {
  const { 
    sendOffer, 
    sendAnswer, 
    sendIce, 
    setOnReceiveOffer, 
    setOnReceiveAnswer, 
    setOnReceiveIce 
  } = useSignalR();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidates = useRef<any[]>([]);

  // Initialize Media Stream
  const startLocalStream = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.error('Camera/Microphone permissions denied');
          return null;
        }
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: isFrontCamera ? 'user' : 'environment',
        },
      });
      setLocalStream(stream as MediaStream);
      return stream as MediaStream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      return null;
    }
  };

  // Initialize Peer Connection
  const initPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(peerConstraints);

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    // @ts-ignore
    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Handle ICE candidates
    // @ts-ignore
    pc.onicecandidate = (event: any) => {
      if (event.candidate && targetConnectionId) {
        sendIce(targetConnectionId, event.candidate.toJSON());
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // Caller: Create Offer
  const makeCall = async () => {
    const stream = await startLocalStream();
    if (!stream || !targetConnectionId) return;

    const pc = initPeerConnection(stream);

    try {
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      await sendOffer(targetConnectionId, JSON.stringify(offer));
    } catch (err) {
      console.error('Failed to create offer', err);
    }
  };

  // Callee: Answer Call
  const answerCall = async (sdpString: string) => {
    const stream = await startLocalStream();
    if (!stream || !targetConnectionId) return;

    const pc = initPeerConnection(stream);

    try {
      const offerDescription = new RTCSessionDescription(JSON.parse(sdpString));
      await pc.setRemoteDescription(offerDescription);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendAnswer(targetConnectionId, JSON.stringify(answer));
    } catch (err) {
      console.error('Failed to answer call', err);
    }
  };

  // Handle incoming signaling events
  useEffect(() => {
    setOnReceiveOffer(async (callerId: string, sdpString: string) => {
      console.log("Received Offer from", callerId);
      await answerCall(sdpString);
      // Process any buffered candidates
      if (pcRef.current && pendingIceCandidates.current.length > 0) {
        for (const c of pendingIceCandidates.current) {
           await pcRef.current.addIceCandidate(new RTCIceCandidate(c) as any).catch(console.error);
        }
        pendingIceCandidates.current = [];
      }
    });

    setOnReceiveAnswer(async (sdpString: string) => {
      console.log("Received Answer");
      if (!pcRef.current) return;
      try {
        const answerDescription = new RTCSessionDescription(JSON.parse(sdpString));
        await pcRef.current.setRemoteDescription(answerDescription);
        // Process any buffered candidates
        if (pendingIceCandidates.current.length > 0) {
          for (const c of pendingIceCandidates.current) {
             await pcRef.current.addIceCandidate(new RTCIceCandidate(c) as any).catch(console.error);
          }
          pendingIceCandidates.current = [];
        }
      } catch (err) {
        console.error('Failed to set remote answer', err);
      }
    });

    setOnReceiveIce(async (candidate: any) => {
      console.log("Received ICE candidate");
      if (!pcRef.current || !pcRef.current.remoteDescription) {
         // Buffer candidate if remote description isn't set yet
         pendingIceCandidates.current.push(candidate);
         return;
      }
      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        await pcRef.current.addIceCandidate(iceCandidate as any);
      } catch (err) {
        console.error('Failed to add ICE candidate', err);
      }
    });

    return () => {
      setOnReceiveOffer(null as any);
      setOnReceiveAnswer(null as any);
      setOnReceiveIce(null as any);
    };
  }, []);

  // Controls
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const switchCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        // react-native-webrtc provides _switchCamera method internally
        (track as any)._switchCamera();
      });
      setIsFrontCamera(!isFrontCamera);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  return {
    localStream,
    remoteStream,
    isMuted,
    isFrontCamera,
    makeCall,
    answerCall,
    toggleMic,
    switchCamera,
    cleanup,
  };
}
