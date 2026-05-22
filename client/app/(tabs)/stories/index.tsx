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

import { Story, StoryGroup } from '@features/stories/types';
import { CreateStoryModal } from '@features/stories/components/CreateStoryModal';
import { StoryViewerModal } from '@features/stories/components/StoryViewerModal';

const { width: SCREEN_W } = Dimensions.get('window');

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
  // Removed inline handlePost and pickImage, logic moved to CreateStoryModal

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
        keyExtractor={(item, index) => item.isCreate ? 'create' : item.user.id}
        numColumns={2}
        renderItem={renderGridItem}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridColumnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStories(); }} tintColor={Colors.primary} />}
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSuccess={fetchStories}
        accessToken={accessToken}
        insetsTop={insets.top}
      />

      {/* Story Viewer */}
      <StoryViewerModal
        story={viewerStory}
        user={viewerUser}
        onClose={() => setViewerStory(null)}
        onDeleteSuccess={() => { setViewerStory(null); fetchStories(); }}
        accessToken={accessToken}
        insetsTop={insets.top}
      />
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
    ...StyleSheet.absoluteFillObject,
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

});
