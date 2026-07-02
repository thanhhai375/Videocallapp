/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RTCView } from 'react-native-webrtc';
import { BlurView } from 'expo-blur';
import { useWebRTC } from '../../src/features/calls/hooks/useWebRTC';
import { useSignalR } from '../../src/shared/hooks/useSignalR';
import { Colors } from '../../src/shared/constants/colors';
import { IconButton } from '../../src/shared/components/IconButton';
import { Avatar } from '../../src/shared/components/Avatar';

export default function CallRoomScreen() {
  const { id, name, connectionId, isCaller, sdp } = useLocalSearchParams<{
    id: string;
    name: string;
    connectionId: string;
    isCaller?: string;
    sdp?: string;
  }>();

  const { endCall } = useSignalR();
  const {
    localStream,
    remoteStream,
    isMuted,
    isFrontCamera,
    makeCall,
    answerCall,
    toggleMic,
    switchCamera,
    cleanup,
  } = useWebRTC(connectionId || null);

  const [callStatus, setCallStatus] = useState<string>('Connecting...');

  useEffect(() => {
    // If we are the caller, initiate the call
    if (isCaller === 'true') {
      setCallStatus('Calling...');
      makeCall();
    } else if (sdp) {
      // If we are the callee, answer the call with the provided SDP offer
      setCallStatus('Connecting...');
      answerCall(sdp);
    }

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (remoteStream) {
      setCallStatus('Connected');
    }
  }, [remoteStream]);

  const handleHangUp = async () => {
    if (connectionId) {
      await endCall(connectionId);
    }
    cleanup();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Remote Video (Full Screen) */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.connectingContainer}>
          <Avatar name={name || '?'} size="xl" />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.status}>{callStatus}</Text>
        </View>
      )}

      {/* Local Video (Picture-in-Picture) */}
      {localStream && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={isFrontCamera} // Mirror if front camera
          />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <BlurView intensity={70} tint="dark" style={styles.controlsBlur}>
          <TouchableOpacity 
            style={[styles.controlBtn, !isFrontCamera && styles.controlBtnActive]} 
            onPress={switchCamera}
          >
            <Ionicons name="camera-reverse" size={26} color={!isFrontCamera ? "#000" : "#FFF"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]} 
            onPress={toggleMic}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color={isMuted ? "#000" : "#FFF"} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.hangUpBtn} onPress={handleHangUp}>
            <Ionicons name="call" size={30} color="#FFF" />
          </TouchableOpacity>
        </BlurView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    ...StyleSheet.absoluteFill,
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 24,
  },
  status: {
    color: Colors.textSecondary,
    fontSize: 18,
    marginTop: 8,
  },
  localVideoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  localVideo: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsBlur: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 30, 30, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: 240,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  hangUpBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }], // Rotate phone icon to look like hangup
  },
});
