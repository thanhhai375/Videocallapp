import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { Avatar } from '@shared/components/Avatar';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';

interface CallRecord {
  id: string;
  callType: 'Audio' | 'Video';
  status: 'Missed' | 'Completed' | 'Rejected' | 'Failed';
  startedAt: string;
  durationSeconds: number | null;
  isCaller: boolean;
  otherUser: { id: string; username: string; profilePictureUrl?: string };
}

export default function CallsScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthStore();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCalls = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/calls`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCalls(data);
      }
    } catch (e) {
      // No connection - show empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCalls(); }, [accessToken]);

  const getDirection = (call: CallRecord) => {
    if (call.status === 'Missed') return 'missed';
    return call.isCaller ? 'outgoing' : 'incoming';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
    return date.toLocaleDateString('vi-VN');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return ` • ${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderCall = ({ item }: { item: CallRecord }) => {
    const direction = getDirection(item);
    const isMissed = direction === 'missed';
    const callIcon = item.callType === 'Video' ? 'videocam-outline' : 'call-outline';
    const directionIcon = direction === 'outgoing' ? 'arrow-up' : 'arrow-down';
    const directionColor = isMissed ? Colors.danger : Colors.textSecondary;

    return (
      <TouchableOpacity style={styles.callItem}>
        <Avatar name={item.otherUser.username} isOnline={false} size="md" />
        <View style={styles.callInfo}>
          <Text style={[styles.callName, isMissed && styles.missedCallText]}>
            {item.otherUser.username}
          </Text>
          <View style={styles.callDetails}>
            <Ionicons name={directionIcon as any} size={14} color={directionColor} style={{ marginRight: 4 }} />
            <Text style={[styles.callTime, isMissed && { color: Colors.danger }]}>
              {item.callType === 'Video' ? 'Video' : 'Thoại'} • {formatTime(item.startedAt)}{formatDuration(item.durationSeconds)}
            </Text>
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
        <Text style={styles.headerTitle}>Cuộc gọi</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="call" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="videocam" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : calls.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="call-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Chưa có cuộc gọi nào</Text>
          <Text style={styles.emptySubText}>Lịch sử cuộc gọi sẽ hiện ở đây</Text>
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id}
          renderItem={renderCall}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchCalls(); }}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg, paddingBottom: Layout.spacing.md,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text },
  headerRight: { flexDirection: 'row' },
  iconButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated, justifyContent: 'center',
    alignItems: 'center', marginLeft: 12,
  },
  listContent: { paddingHorizontal: Layout.spacing.lg },
  callItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Layout.spacing.md },
  callInfo: { flex: 1, marginLeft: Layout.spacing.md },
  callName: { color: Colors.text, fontSize: 17, fontWeight: '500' },
  missedCallText: { color: Colors.danger },
  callDetails: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  callTime: { color: Colors.textSecondary, fontSize: 14 },
  actionBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.surfaceInput, borderRadius: 20,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubText: { color: Colors.textMuted, fontSize: 14, marginTop: 8 },
});
