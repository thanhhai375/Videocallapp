import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';
import { ConversationItem } from '@features/chat/components/ConversationItem';

type Tab = 'requests' | 'spam';

export default function MessageRequestsScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const { accessToken } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);

  const fetchConversations = async (tab: Tab) => {
    if (!accessToken) return;
    try {
      const endpoint = tab === 'requests' ? 'requests' : 'spam';
      const res = await fetch(`${API_URL}/chat/${endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error(`Failed to load ${tab}:`, e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchConversations(activeTab);
    }, [activeTab, accessToken])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations(activeTab);
  };

  const renderItem = ({ item }: { item: any }) => {
    let timeStr = '';
    if (item.lastMessage) {
      const d = new Date(item.lastMessage.createdAt);
      timeStr = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    }

    return (
      <ConversationItem
        name={item.username}
        isOnline={item.isOnline}
        lastMessage={item.lastMessage?.content || 'Bắt đầu cuộc trò chuyện'}
        time={timeStr}
        unreadCount={item.unreadCount}
        onPress={() =>
          router.push(`/chat/${item.userId}?name=${item.username}&connectionId=${item.connectionId || ''}` as any)
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn chờ</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Bạn có thể biết</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'spam' && styles.tabActive]}
          onPress={() => setActiveTab('spam')}
        >
          <Text style={[styles.tabText, activeTab === 'spam' && styles.tabTextActive]}>Spam</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={[styles.center, { marginTop: 80, paddingHorizontal: 40 }]}>
              <View style={styles.emptyIconBox}>
                <Ionicons
                  name={activeTab === 'requests' ? 'chatbox-ellipses-outline' : 'warning-outline'}
                  size={48}
                  color={Colors.textSecondary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'requests' ? 'Không có tin nhắn chờ' : 'Thư mục Spam trống'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'requests'
                  ? 'Khi người không quen gửi tin nhắn cho bạn, tin nhắn đó sẽ hiển thị ở đây.'
                  : 'Tin nhắn rác hoặc tin nhắn từ những người bạn đã chặn sẽ xuất hiện ở đây.'}
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: Colors.surfaceInput,
      margin: 16,
      borderRadius: 10,
      padding: 2,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: Colors.surfaceElevated,
    },
    tabText: {
      color: Colors.textSecondary,
      fontWeight: '600',
      fontSize: 14,
    },
    tabTextActive: {
      color: Colors.text,
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
