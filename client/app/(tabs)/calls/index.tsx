import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { Avatar } from '@shared/components/Avatar';

// Mock call history
const MOCK_CALLS = [
  { id: '1', name: 'Nam', type: 'video', direction: 'missed', time: '10:30', isOnline: true },
  { id: '2', name: 'Hung', type: 'audio', direction: 'outgoing', time: 'Hôm qua', isOnline: true },
  { id: '3', name: 'Lan', type: 'video', direction: 'incoming', time: 'T2', isOnline: false },
  { id: '4', name: 'Minh', type: 'audio', direction: 'missed', time: 'T7', isOnline: false },
];

export default function CallsScreen() {
  const insets = useSafeAreaInsets();

  const renderCall = ({ item }: { item: typeof MOCK_CALLS[0] }) => {
    const isMissed = item.direction === 'missed';
    let callIcon = 'call-outline';
    if (item.type === 'video') callIcon = 'videocam-outline';
    
    let directionIcon = 'arrow-down';
    let directionColor: string = Colors.textSecondary;
    if (item.direction === 'outgoing') {
      directionIcon = 'arrow-up';
    } else if (isMissed) {
      directionColor = Colors.danger;
    }

    return (
      <TouchableOpacity style={styles.callItem}>
        <Avatar name={item.name} isOnline={item.isOnline} size="md" />
        <View style={styles.callInfo}>
          <Text style={[styles.callName, isMissed && styles.missedCallText]}>{item.name}</Text>
          <View style={styles.callDetails}>
            <Ionicons name={directionIcon as any} size={14} color={directionColor} style={{ marginRight: 4 }} />
            <Text style={styles.callTime}>{item.time}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name={callIcon as any} size={24} color={Colors.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Calls</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="call" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="videocam" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={MOCK_CALLS}
        keyExtractor={(item) => item.id}
        renderItem={renderCall}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  callInfo: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  callName: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '500',
  },
  missedCallText: {
    color: Colors.danger,
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  callTime: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  actionBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceInput,
    borderRadius: 20,
  },
});
