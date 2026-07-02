import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
  RefreshControl, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { useAuthStore } from '@features/auth/store/authStore';
import { API_URL } from '@shared/constants/config';

const { width: SCREEN_W } = Dimensions.get('window');

const BG_COLORS = [
  '#0084FF', '#E91E8C', '#FF6B35', '#7B68EE',
  '#00C851', '#FF4444', '#FF8800', '#00BCD4',
];

interface Story {
  id: string;
  textContent?: string;
  mediaUrl?: string;
  mediaType: 'Text' | 'Image' | 'Video';
  backgroundColor?: string;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  isOwn: boolean;
  hasSeen: boolean;
}

interface StoryGroup {
  user: { id: string; username: string; profilePictureUrl?: string };
  hasUnseen: boolean;
  stories: Story[];
}

export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthStore();
  const { openStoryUserId } = useLocalSearchParams<{ openStoryUserId?: string }>();
  
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create story modal
  const [createVisible, setCreateVisible] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // Viewer modal
  const [viewerStory, setViewerStory] = useState<Story | null>(null);
  const [viewerUser, setViewerUser] = useState<StoryGroup['user'] | null>(null);

  const authHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, { headers: authHeaders });
      if (res.ok) setMyProfile(await res.json());
    } catch {}
  }, [accessToken]);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/stories`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [accessToken]);

  useEffect(() => { 
    fetchProfile();
    fetchStories(); 
  }, [fetchProfile, fetchStories]);

  useEffect(() => {
    if (openStoryUserId && groups.length > 0) {
      const targetGroup = groups.find(g => g.user.id === openStoryUserId);
      if (targetGroup && !viewerStory) {
        handleViewStory(targetGroup.stories[0], targetGroup);
      }
    }
  }, [openStoryUserId, groups]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setStoryImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!storyText.trim() && !storyImage) {
      Alert.alert('Thông báo', 'Nhập nội dung hoặc chọn ảnh để đăng tin');
      return;
    }
    setPosting(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType = 'Text';

      if (storyImage) {
        const formData = new FormData();
        const filename = storyImage.split('/').pop() || 'story.jpg';
        formData.append('file', { uri: storyImage, name: filename, type: 'image/jpeg' } as any);
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          mediaUrl = data.url;
          mediaType = 'Image';
        }
      }

      const res = await fetch(`${API_URL}/stories`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          textContent: storyText.trim() || undefined,
          mediaUrl,
          mediaType,
          backgroundColor: selectedBg,
        }),
      });

      if (res.ok) {
        Alert.alert('✅', 'Đã đăng tin thành công!');
        setCreateVisible(false);
        setStoryText('');
        setStoryImage(null);
        fetchStories();
      } else {
        Alert.alert('Lỗi', 'Không thể đăng tin');
      }
    } catch { Alert.alert('Lỗi', 'Không thể kết nối máy chủ'); }
    finally { setPosting(false); }
  };

  const handleViewStory = async (story: Story, group: StoryGroup) => {
    setViewerStory(story);
    setViewerUser(group.user);
    // Mark as viewed
    try {
      await fetch(`${API_URL}/stories/${story.id}/view`, {
        method: 'POST', headers: authHeaders,
      });
    } catch {}
  };

  const handleDeleteStory = async (storyId: string) => {
    Alert.alert('Xóa tin', 'Bạn có muốn xóa tin này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          await fetch(`${API_URL}/stories/${storyId}`, {
            method: 'DELETE', headers: authHeaders,
          });
          setViewerStory(null);
          fetchStories();
        }
      }
    ]);
  };

  const renderGridItem = ({ item, index }: { item: any, index: number }) => {
    if (item.isCreate) {
      return (
        <TouchableOpacity style={styles.storyCard} onPress={() => setCreateVisible(true)}>
          <View style={styles.createCardBg}>
            {myProfile?.profilePictureUrl ? (
              <Image source={{ uri: myProfile.profilePictureUrl }} style={styles.createCardImg} />
            ) : (
              <View style={[styles.createCardImg, { backgroundColor: Colors.surfaceElevated, justifyContent: 'center', alignItems: 'center' }]}>
                 <Ionicons name="person" size={40} color={Colors.textMuted} />
              </View>
            )}
            <View style={styles.createCardPlusOverlay}>
              <View style={styles.plusIconContainer}>
                <Ionicons name="add" size={24} color="#000" />
              </View>
              <Text style={styles.createCardText}>Thêm vào tin</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    const group = item as StoryGroup;
    const firstStory = group.stories[0];
    const isOwn = group.stories.some(s => s.isOwn);

    return (
      <TouchableOpacity style={styles.storyCard} onPress={() => handleViewStory(firstStory, group)}>
        <View style={[styles.storyCardBg, { backgroundColor: firstStory.backgroundColor || '#000' }]}>
          {firstStory.mediaUrl && firstStory.mediaType === 'Image' ? (
            <Image source={{ uri: firstStory.mediaUrl }} style={styles.storyCardImg} />
          ) : (
            <Text style={styles.storyCardTextContent} numberOfLines={4}>
              {firstStory.textContent}
            </Text>
          )}
          <View style={styles.storyCardOverlay} />
        </View>
        
        <View style={[styles.storyCardAvatarRing, group.hasUnseen && styles.storyCardAvatarUnseen]}>
          {group.user.profilePictureUrl ? (
            <Image source={{ uri: group.user.profilePictureUrl }} style={styles.storyCardAvatar} />
          ) : (
            <View style={[styles.storyCardAvatar, { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{group.user.username.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <Text style={styles.storyCardName} numberOfLines={1}>
          {isOwn ? 'Tin của bạn' : group.user.username}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const gridData = [{ isCreate: true }, ...groups];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin</Text>
      </View>

      <FlatList
        data={gridData}
        keyExtractor={(item, index) => 'isCreate' in item ? 'create' : (item as StoryGroup).user.id}
        numColumns={2}
        renderItem={renderGridItem}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridColumnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStories(); }} tintColor={Colors.primary} />}
      />

      {/* Create Story Modal */}
      <Modal visible={createVisible} animationType="slide" onRequestClose={() => setCreateVisible(false)}>
        <View style={[styles.createModal, { paddingTop: insets.top }]}>
          <View style={styles.createModalHeader}>
            <TouchableOpacity onPress={() => setCreateVisible(false)}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.createModalTitle}>Tạo tin</Text>
            <TouchableOpacity
              style={[styles.postBtn, (posting || (!storyText && !storyImage)) && { opacity: 0.5 }]}
              onPress={handlePost}
              disabled={posting || (!storyText.trim() && !storyImage)}
            >
              {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnText}>Đăng</Text>}
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={[styles.storyPreview, { backgroundColor: storyImage ? '#000' : selectedBg }]}>
            {storyImage ? (
              <Image source={{ uri: storyImage }} style={styles.storyPreviewImg} resizeMode="contain" />
            ) : null}
            {storyText ? (
              <Text style={styles.storyPreviewText}>{storyText}</Text>
            ) : null}
            {!storyImage && !storyText && (
              <Text style={styles.storyPreviewPlaceholder}>Tin của bạn sẽ hiện ở đây...</Text>
            )}
          </View>

          {/* Controls */}
          <View style={styles.createControls}>
            <TextInput
              style={styles.storyTextInput}
              placeholder="Viết gì đó..."
              placeholderTextColor={Colors.textMuted}
              value={storyText}
              onChangeText={setStoryText}
              multiline
              maxLength={200}
            />

            {/* Image picker */}
            <TouchableOpacity style={styles.controlRow} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color={Colors.primary} />
              <Text style={styles.controlLabel}>{storyImage ? '✅ Đã chọn ảnh' : 'Thêm ảnh'}</Text>
            </TouchableOpacity>

            {/* Background colors */}
            <Text style={styles.bgLabel}>Màu nền</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bgRow}>
              {BG_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.bgChip, { backgroundColor: color }, selectedBg === color && styles.bgChipSelected]}
                  onPress={() => { setSelectedBg(color); setStoryImage(null); }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Story Viewer */}
      <Modal visible={!!viewerStory} animationType="fade" onRequestClose={() => setViewerStory(null)}>
        {viewerStory && viewerUser && (
          <View style={styles.viewerContainer}>
            {/* Story background */}
            <View style={[styles.viewerBg, { backgroundColor: viewerStory.backgroundColor || '#000' }]}>
              {viewerStory.mediaUrl && viewerStory.mediaType === 'Image' && (
                <Image source={{ uri: viewerStory.mediaUrl }} style={styles.viewerImg} resizeMode="cover" />
              )}
              {viewerStory.textContent && (
                <Text style={styles.viewerText}>{viewerStory.textContent}</Text>
              )}
            </View>

            {/* Header overlay */}
            <View style={[styles.viewerHeader, { paddingTop: insets.top + 10 }]}>
              <View style={styles.viewerUserInfo}>
                <View style={styles.viewerAvatar}>
                  <Text style={styles.viewerAvatarText}>{viewerUser.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.viewerUsername}>{viewerUser.username}</Text>
                  <Text style={styles.viewerTime}>
                    {new Date(viewerStory.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <View style={styles.viewerActions}>
                {viewerStory.isOwn && (
                  <TouchableOpacity onPress={() => handleDeleteStory(viewerStory.id)}>
                    <Ionicons name="trash-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setViewerStory(null)} style={{ marginLeft: 16 }}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {viewerStory.isOwn && (
              <View style={styles.viewerViews}>
                <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.viewerViewsText}>{viewerStory.viewCount} lượt xem</Text>
              </View>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Layout.spacing.lg, paddingBottom: 12,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storyCard: {
    width: (SCREEN_W - 36) / 2,
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    position: 'relative',
  },
  createCardBg: {
    flex: 1,
    backgroundColor: '#fff',
  },
  createCardImg: {
    width: '100%',
    height: 160,
  },
  createCardPlusOverlay: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  plusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E4E6EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -18,
    borderWidth: 3,
    borderColor: '#fff',
  },
  createCardText: {
    color: '#000',
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 13,
  },
  storyCardBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyCardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyCardTextContent: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 12,
  },
  storyCardOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  storyCardAvatarRing: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  storyCardAvatarUnseen: {
    borderColor: '#0084FF',
  },
  storyCardAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  storyCardName: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  // Create modal
  createModal: { flex: 1, backgroundColor: Colors.bg },
  createModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  createModalTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  storyPreview: {
    height: 300, marginHorizontal: 16, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  storyPreviewImg: { width: '100%', height: '100%', borderRadius: 20 },
  storyPreviewText: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', padding: 20 },
  storyPreviewPlaceholder: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
  createControls: { padding: 16, gap: 16 },
  storyTextInput: {
    backgroundColor: Colors.surfaceInput, color: Colors.text, borderRadius: 12,
    padding: 14, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
  },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlLabel: { color: Colors.text, fontSize: 15 },
  bgLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  bgRow: { flexDirection: 'row' },
  bgChip: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  bgChipSelected: { borderWidth: 3, borderColor: '#fff' },
  // Viewer
  viewerContainer: { flex: 1 },
  viewerBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewerImg: { width: SCREEN_W, height: '100%' },
  viewerText: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', padding: 24 },
  viewerHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  viewerUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  viewerAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  viewerUsername: { color: '#fff', fontWeight: '600', fontSize: 15 },
  viewerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  viewerActions: { flexDirection: 'row', alignItems: 'center' },
  viewerViews: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  viewerViewsText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
});
