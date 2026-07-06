import { useState, useRef, useCallback, useEffect } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { useSignalR } from '@shared/hooks/useSignalR';
import { setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';

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
  const { sendOffer, sendAnswer, sendIce, setOnReceiveAnswer, setOnReceiveIce, setOnReceiveOffer } = useSignalR();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Initialize Media Stream
  const startLocalStream = async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: isFrontCamera ? 'user' : 'environment',
          frameRate: { ideal: 30 }
        },
      });

      // Force speakerphone using expo-audio
      try {
        await setAudioModeAsync({
          shouldRouteThroughEarpiece: false,
          playsInSilentMode: true,
          allowsRecording: true,
        });
        await setIsAudioActiveAsync(true);
      } catch (e) {
        console.warn('Could not set audio mode', e);
      }

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
    setOnReceiveOffer((callerId: string, sdp: string) => {
      answerCall(sdp);
    });

    setOnReceiveAnswer((sdp: string) => {
      if (!pcRef.current) return;
      try {
        const answerDescription = new RTCSessionDescription(JSON.parse(sdp));
        pcRef.current.setRemoteDescription(answerDescription);
      } catch (err) {
        console.error('Failed to set remote answer', err);
      }
    });

    setOnReceiveIce((candidate: object) => {
      if (!pcRef.current) return;
      try {
        const rtcCandidate = new RTCIceCandidate(candidate as any);
        pcRef.current.addIceCandidate(rtcCandidate);
      } catch (err) {
        console.error('Failed to add ICE candidate', err);
      }
    });
  }, [setOnReceiveAnswer, setOnReceiveIce, setOnReceiveOffer]);

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
