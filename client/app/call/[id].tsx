import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RTCView } from 'react-native-webrtc';
import { useWebRTC } from '../../src/features/calls/hooks/useWebRTC';
import { useSignalR } from '../../src/shared/hooks/useSignalR';
import { useTheme } from '@shared/constants/colors';
import { IconButton } from '../../src/shared/components/IconButton';
import { Avatar } from '../../src/shared/components/Avatar';

export default function CallRoomScreen() {
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const { id, name, connectionId, isCaller, sdp } = useLocalSearchParams<{
    id: string;
    name: string;
    connectionId: string;
    isCaller?: string;
    sdp?: string;
  }>();

  const { endCall, onCallAccepted, setOnCallAccepted } = useSignalR();
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
    if (isCaller === 'true') {
      setCallStatus('Calling... (Waiting for answer)');
      setOnCallAccepted((calleeConnectionId) => {
        setCallStatus('Call Accepted. Negotiating...');
        makeCall();
      });
    } else {
      setCallStatus('Connecting (Waiting for video feed)...');
    }

    return () => {
      cleanup();
      setOnCallAccepted(null as any);
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
          zOrder={0}
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
            zOrder={1}
          />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: Colors.surfaceInput }]} onPress={switchCamera}>
          <Ionicons name="camera-reverse" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: isMuted ? Colors.surface : Colors.surfaceInput }]} onPress={toggleMic}>
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.hangUpBtn} onPress={handleHangUp}>
          <Ionicons name="call" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
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
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
