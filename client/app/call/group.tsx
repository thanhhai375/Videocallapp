import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { useWebRTCGroup } from '@features/calls/hooks/useWebRTCGroup';
import { useAuthStore } from '@features/auth/store/authStore';
import { useSignalR } from '@shared/hooks/useSignalR';

const { width, height } = Dimensions.get('window');

export default function GroupCallScreen() {
  const { groupId, name, isInitiator } = useLocalSearchParams<{ groupId: string, name: string, isInitiator: string }>();
  const router = useRouter();
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [hasConnected, setHasConnected] = useState(false);

  const {
    localStream,
    remoteStreams,
    initCall,
    endCall,
    toggleMic,
    toggleCamera,
    memberNames,
  } = useWebRTCGroup(groupId || '');

  // For global hub events mapping to the hook
  useEffect(() => {
    if (!groupId) return;
    
    // Start or Join Call
    initCall(isInitiator === 'true');

    return () => {
      endCall();
    };
  }, [groupId, isInitiator]);

  const onEndCall = async () => {
    await endCall();
    router.back();
  };

  useEffect(() => {
    if (remoteStreams.size > 0) {
      setHasConnected(true);
    }
  }, [remoteStreams.size]);

  useEffect(() => {
    if (hasConnected && remoteStreams.size === 0) {
      onEndCall();
    }
  }, [hasConnected, remoteStreams.size]);

  const onToggleMic = () => {
    toggleMic();
    setMicEnabled(!micEnabled);
  };

  const onToggleCamera = () => {
    toggleCamera();
    setCameraEnabled(!cameraEnabled);
  };

  // Render Grid
  const renderGrid = () => {
    const totalVideos = remoteStreams.size + (localStream ? 1 : 0);
    if (totalVideos === 0) return null;

    let columns = 1;
    let videoHeight = height;

    if (totalVideos === 2) {
      columns = 1;
      videoHeight = height / 2;
    } else if (totalVideos > 2 && totalVideos <= 4) {
      columns = 2;
      videoHeight = height / 2;
    } else if (totalVideos > 4) {
      columns = 2;
      videoHeight = height / 3;
    }

    const videoStyle = {
      width: width / columns,
      height: videoHeight,
    };

    const streams = Array.from(remoteStreams.entries());

    return (
      <View style={styles.gridContainer}>
        {localStream && (
          <View style={videoStyle}>
            <RTCView streamURL={localStream.toURL()} style={styles.video} objectFit="cover" />
            <Text style={styles.videoLabel}>Bạn</Text>
          </View>
        )}
        {streams.map(([connId, stream]) => (
          <View key={connId} style={videoStyle}>
            <RTCView streamURL={stream.toURL()} style={styles.video} objectFit="cover" />
            <Text style={styles.videoLabel}>{memberNames.get(connId) || 'Thành viên'}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderGrid()}

      {/* Controls Overlay */}
      <View style={styles.controlsContainer}>
        <Text style={styles.groupName}>{name || 'Nhóm trò chuyện'}</Text>
        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: micEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,1)' }]} 
            onPress={onToggleMic}
          >
            <Ionicons name={micEnabled ? "mic" : "mic-off"} size={28} color={micEnabled ? "#fff" : "#000"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#FF3B30' }]} onPress={onEndCall}>
            <Ionicons name="call" size={28} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: cameraEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,1)' }]} 
            onPress={onToggleCamera}
          >
            <Ionicons name={cameraEnabled ? "videocam" : "videocam-off"} size={28} color={cameraEnabled ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  video: {
    flex: 1,
  },
  videoLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center'
  },
  groupName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
