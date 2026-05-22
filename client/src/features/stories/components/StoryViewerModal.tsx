import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@shared/constants/colors';
import { API_URL } from '@shared/constants/config';
import { Story, StoryGroup } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  story: Story | null;
  user: StoryGroup['user'] | null;
  onClose: () => void;
  onDeleteSuccess: () => void;
  accessToken: string | null;
  insetsTop: number;
}

export function StoryViewerModal({ story, user, onClose, onDeleteSuccess, accessToken, insetsTop }: Props) {
  if (!story || !user) return null;

  const handleDelete = () => {
    Alert.alert('Xóa tin', 'Bạn có muốn xóa tin này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${API_URL}/stories/${story.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            onDeleteSuccess();
          } catch {}
        }
      }
    ]);
  };

  return (
    <Modal visible={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerContainer}>
        {/* Story background */}
        <View style={[styles.viewerBg, { backgroundColor: story.backgroundColor || '#000' }]}>
          {story.mediaUrl && story.mediaType === 'Image' && (
            <Image source={{ uri: story.mediaUrl }} style={styles.viewerImg} resizeMode="cover" />
          )}
          {story.textContent && (
            <Text style={styles.viewerText}>{story.textContent}</Text>
          )}
        </View>

        {/* Header overlay */}
        <View style={[styles.viewerHeader, { paddingTop: insetsTop + 10 }]}>
          <View style={styles.viewerUserInfo}>
            <View style={styles.viewerAvatar}>
              <Text style={styles.viewerAvatarText}>{user.username.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.viewerUsername}>{user.username}</Text>
              <Text style={styles.viewerTime}>
                {new Date(story.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          <View style={styles.viewerActions}>
            {story.isOwn && (
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 16 }}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {story.isOwn && (
          <View style={styles.viewerViews}>
            <Ionicons name="eye-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.viewerViewsText}>{story.viewCount} lượt xem</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
