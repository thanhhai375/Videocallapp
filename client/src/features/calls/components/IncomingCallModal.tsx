import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '@shared/constants/colors';
import { IncomingCall } from '@shared/types';
import { Avatar } from '@shared/components/Avatar';

interface IncomingCallModalProps {
  call: IncomingCall | null;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({ call, onAccept, onReject }: IncomingCallModalProps) {
  if (!call) return null;

  return (
    <Modal
      visible={!!call}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Messenger Video</Text>
        </View>

        <View style={styles.content}>
          <Avatar name={call.callerName} size="xl" />
          <Text style={styles.callerName}>{call.callerName}</Text>
          <Text style={styles.statusText}>Incoming Video Call...</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Text style={styles.iconText}>❌</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Text style={styles.iconText}>📹</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callerName: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 18,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  acceptBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  rejectBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  iconText: {
    fontSize: 32,
  },
});
