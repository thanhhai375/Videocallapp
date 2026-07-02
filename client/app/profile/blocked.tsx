import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';
import { Avatar } from '@shared/components/Avatar';

export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const { accessToken } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  const fetchBlockedUsers = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${API_URL}/friends/blocked`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data);
      }
    } catch (e) {
      console.error("Failed to fetch blocked users:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBlockedUsers();
    }, [accessToken])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBlockedUsers();
  };

  const handleUnblock = (userId: string, username: string) => {
    Alert.alert(
      'Bỏ chặn',
      `Bạn có muốn bỏ chặn cho ${username}? Người này sẽ có thể gửi tin nhắn và gọi cho bạn trở lại.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ chặn',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/friends/unblock/${userId}`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              });
              if (res.ok) {
                Alert.alert('Thành công', `Đã bỏ chặn ${username}.`);
                fetchBlockedUsers();
              } else {
                Alert.alert('Lỗi', 'Không thể bỏ chặn người dùng này.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Lỗi kết nối.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        <Avatar name={item.username} size="md" />
        <Text style={styles.username}>{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.id, item.username)}
      >
        <Text style={styles.unblockText}>Bỏ chặn</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Người dùng đã chặn</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={[styles.center, { marginTop: 100, paddingHorizontal: 40 }]}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="ban-outline" size={48} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Danh sách chặn trống</Text>
              <Text style={styles.emptySubtitle}>
                Khi bạn chặn ai đó, họ sẽ xuất hiện tại đây. Bạn có thể bỏ chặn cho họ bất kỳ lúc nào.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Layout.spacing.md,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.divider,
      backgroundColor: Colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text,
    },
    listContainer: {
      paddingVertical: 10,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.divider,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.text,
    },
    unblockButton: {
      backgroundColor: Colors.surfaceElevated,
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: Colors.divider,
    },
    unblockText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary,
    },
    emptyIconBox: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: Colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
