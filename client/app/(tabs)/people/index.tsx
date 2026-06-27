import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { Avatar } from '@shared/components/Avatar';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';

type Tab = 'friends' | 'pending';

interface Friend {
  id: string;
  username: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  isOnline: boolean;
  lastSeenAt?: string;
  connectionId?: string;
}

interface PendingRequest {
  id: string;
  sender: { id: string; username: string; profilePictureUrl?: string };
  message?: string;
  createdAt: string;
}

export default function PeopleScreen() {
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthStore();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResult, setSearchResult] = useState<{ found: boolean; username?: string; message?: string } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const authHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  const fetchFriends = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/friends`, { headers: authHeaders });
      if (res.ok) setFriends(await res.json());
    } catch {}
  }, [accessToken]);

  const fetchPending = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/friends/pending`, { headers: authHeaders });
      if (res.ok) setPendingRequests(await res.json());
    } catch {}
  }, [accessToken]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchPending()]);
    setLoading(false);
    setRefreshing(false);
  }, [fetchFriends, fetchPending]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSearchPhone = async () => {
    if (!searchPhone.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch(`${API_URL}/users/search?phone=${searchPhone.trim()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setSearchResult({ found: true, username: data.username });
      } else {
        setSearchResult({ found: false, message: 'Số điện thoại này chưa đăng ký tài khoản' });
      }
    } catch {
      setSearchResult({ found: false, message: 'Không thể kết nối đến server' });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async () => {
    setSendingRequest(true);
    try {
      const res = await fetch(`${API_URL}/friends/request`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ phoneNumber: searchPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Thành công', data.message);
        setShowAddModal(false);
        setSearchPhone('');
        setSearchResult(null);
      } else {
        Alert.alert('Lỗi', data.message || 'Không gửi được lời mời');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch(`${API_URL}/friends/request/${requestId}/accept`, {
        method: 'PUT', headers: authHeaders,
      });
      if (res.ok) {
        Alert.alert('✅', 'Đã chấp nhận lời mời kết bạn!');
        loadAll();
      }
    } catch {}
  };

  const handleReject = async (requestId: string) => {
    try {
      await fetch(`${API_URL}/friends/request/${requestId}/reject`, {
        method: 'PUT', headers: authHeaders,
      });
      loadAll();
    } catch {}
  };

  const handleRemoveFriend = (friendId: string, name: string) => {
    Alert.alert('Xóa bạn bè', `Bạn có muốn xóa ${name} khỏi danh sách bạn bè?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          await fetch(`${API_URL}/friends/${friendId}`, { method: 'DELETE', headers: authHeaders });
          loadAll();
        }
      }
    ]);
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push(`/chat/${item.id}?name=${item.username}&connectionId=${item.connectionId || ''}` as any)}
      onLongPress={() => handleRemoveFriend(item.id, item.username)}
    >
      <Avatar name={item.username} isOnline={item.isOnline} size="md" />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.username}</Text>
        <Text style={styles.itemSub}>
          {item.isOnline ? '🟢 Đang hoạt động' : `${item.phoneNumber}`}
        </Text>
      </View>
      <TouchableOpacity style={styles.actionBtn}
        onPress={() => router.push(`/chat/${item.id}?name=${item.username}&connectionId=${item.connectionId || ''}` as any)}>
        <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderPending = ({ item }: { item: PendingRequest }) => (
    <View style={styles.item}>
      <Avatar name={item.sender.username} isOnline={false} size="md" />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.sender.username}</Text>
        <Text style={styles.itemSub}>{item.message || 'Muốn kết bạn với bạn'}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Bạn bè</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => setTab('friends')}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>
            Bạn bè ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'pending' && styles.tabActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>
            Lời mời {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : tab === 'friends' ? (
        <FlatList
          data={friends}
          keyExtractor={i => i.id}
          renderItem={renderFriend}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Chưa có bạn bè nào</Text>
              <Text style={styles.emptySub}>Nhấn nút + để thêm bạn qua số điện thoại</Text>
              <TouchableOpacity style={styles.addFriendBtn} onPress={() => setShowAddModal(true)}>
                <Ionicons name="person-add" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Thêm bạn bè</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={pendingRequests}
          keyExtractor={i => i.id}
          renderItem={renderPending}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="mail-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Không có lời mời nào</Text>
            </View>
          }
        />
      )}

      {/* Add Friend Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Thêm bạn bè</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setSearchPhone(''); setSearchResult(null); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nhập số điện thoại:</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="VD: 0901111111"
                placeholderTextColor={Colors.textMuted}
                value={searchPhone}
                onChangeText={t => { setSearchPhone(t); setSearchResult(null); }}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearchPhone} disabled={searchLoading}>
                {searchLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="search" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>

            {searchResult && (
              <View style={[styles.resultBox, { borderColor: searchResult.found ? Colors.success : Colors.danger }]}>
                {searchResult.found ? (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    <Text style={[styles.resultText, { color: Colors.success }]}>
                      {'  '}Tìm thấy: <Text style={{ fontWeight: 'bold' }}>{searchResult.username}</Text>
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="alert-circle" size={20} color={Colors.danger} />
                    <Text style={[styles.resultText, { color: Colors.danger }]}>{'  '}{searchResult.message}</Text>
                  </>
                )}
              </View>
            )}

            {searchResult?.found && (
              <TouchableOpacity
                style={[styles.sendBtn, sendingRequest && { opacity: 0.6 }]}
                onPress={handleSendRequest}
                disabled={sendingRequest}
              >
                {sendingRequest
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.sendBtnText}>Gửi lời mời kết bạn</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg, paddingBottom: Layout.spacing.md,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row', paddingHorizontal: Layout.spacing.lg,
    marginBottom: 8, gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.surfaceInput, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: Layout.spacing.lg, paddingBottom: 24 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  itemInfo: { flex: 1 },
  itemName: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  itemSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceInput, justifyContent: 'center', alignItems: 'center',
  },
  acceptBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center',
  },
  rejectBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySub: { color: Colors.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  addFriendBtn: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    backgroundColor: Colors.primary, paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 20,
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  label: { color: Colors.textSecondary, fontSize: 14, marginBottom: 8 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchInput: {
    flex: 1, backgroundColor: Colors.surfaceInput, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, color: Colors.text, fontSize: 16,
  },
  searchBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  resultBox: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 10, borderWidth: 1, marginBottom: 16,
    backgroundColor: Colors.surfaceInput,
  },
  resultText: { fontSize: 14, flex: 1 },
  sendBtn: {
    backgroundColor: Colors.primary, padding: 14,
    borderRadius: 12, alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
