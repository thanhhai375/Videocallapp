import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions,
  Alert, Animated, ScrollView, TouchableWithoutFeedback, Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@shared/constants/colors';
import { API_URL } from '@shared/constants/config';
import { Story, StoryGroup } from '../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  group: StoryGroup | null;
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
  onDeleteSuccess: () => void;
  accessToken: string | null;
  insetsTop: number;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export function StoryViewerModal({
  group, initialIndex = 0, visible, onClose, onDeleteSuccess, accessToken, insetsTop
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showMenu, setShowMenu] = useState(false);
  const [reactions, setReactions] = useState<{ emoji: string, count: number }[]>([]);
  const progress = useRef(new Animated.Value(0)).current;

  // UI Enhancement States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const [toastVisible, setToastVisible] = useState(false);

  const stories = group?.stories || [];
  const currentStory = stories[currentIndex];
  const user = group?.user;

  useEffect(() => {
    if (visible && stories.length > 0) {
      startTimer();
      if (stories[currentIndex]) {
        fetchReactions(stories[currentIndex].id);
      }
    } else {
      progress.stopAnimation();
    }
    return () => progress.stopAnimation();
  }, [visible, currentIndex, group]);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  const fetchReactions = async (storyId: string) => {
    try {
      const res = await fetch(`${API_URL}/stories/${storyId}/reactions`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReactions(data);
      } else {
        // Fallback for UI testing
        if (currentStory?.isOwn) {
           setReactions([
             { emoji: '❤️', count: 1 },
             { emoji: '😂', count: 3 }
           ]);
        } else {
           setReactions([]);
        }
      }
    } catch {
      setReactions([]);
    }
  };

  const startTimer = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 7000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) handleNext();
    });
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      startTimer();
    }
  };

  // Messenger-style Delete Confirmation
  const openDeleteSheet = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  };

  const closeDeleteSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: SCREEN_H,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease)
    }).start(() => setShowDeleteConfirm(false));
  };

  const confirmDelete = async () => {
    if (!currentStory) return;
    try {
      const res = await fetch(`${API_URL}/stories/${currentStory.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        showSuccessToast("Đã xóa tin thành công");
        closeDeleteSheet();
        onDeleteSuccess();
        if (stories.length === 1) {
          onClose();
        } else {
          handleNext();
        }
      }
    } catch {}
  };

  const handleArchive = async () => {
    if (!currentStory) return;
    setShowMenu(false);
    try {
      const res = await fetch(`${API_URL}/stories/${currentStory.id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        showSuccessToast("Đã lưu vào kho lưu trữ");
        onDeleteSuccess();
        if (stories.length === 1) {
          onClose();
        } else {
          handleNext();
        }
      }
    } catch {}
  };

  const showSuccessToast = (message: string) => {
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: insetsTop + 20,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 500,
        useNativeDriver: true
      })
    ]).start(() => setToastVisible(false));
  };

  if (!group || !currentStory || !user) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.viewerContainer}>
        {/* Progress bars */}
        <View style={[styles.progressWrapper, { top: insetsTop + 10 }]}>
          {stories.map((_, i) => (
            <View key={i} style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: i === currentIndex
                      ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                      : i < currentIndex ? '100%' : '0%'
                  }
                ]}
              />
            </View>
          ))}
        </View>

        {/* Content */}
        <View style={[styles.viewerBg, { backgroundColor: currentStory.backgroundColor || '#000' }]}>
          {currentStory.mediaUrl && currentStory.mediaType === 'Image' && (
            <Image source={{ uri: currentStory.mediaUrl }} style={styles.viewerImg} resizeMode="cover" />
          )}
          {currentStory.textContent && (
            <Text style={styles.viewerText}>{currentStory.textContent}</Text>
          )}
        </View>

        {/* Navigation Layers */}
        <View style={styles.navLayer}>
          <TouchableOpacity activeOpacity={1} style={styles.navSide} onPress={handlePrev} />
          <TouchableOpacity activeOpacity={1} style={styles.navSide} onPress={handleNext} />
        </View>

        {/* Header */}
        <View style={[styles.viewerHeader, { paddingTop: insetsTop + 20 }]}>
          <View style={styles.viewerUserInfo}>
            <View style={styles.viewerAvatar}>
              {user.profilePictureUrl ? (
                <Image source={{ uri: user.profilePictureUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.viewerAvatarText}>{user.username.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View>
              <Text style={styles.viewerUsername}>{user.username}</Text>
              <View style={styles.headerSub}>
                <Text style={styles.viewerTime}>
                  {new Date(currentStory.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.viewerActions}>
            {currentStory.isOwn && (
              <View>
                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                  <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </TouchableOpacity>
                {showMenu && (
                  <View style={styles.menuDropdown}>
                    <TouchableOpacity style={styles.menuItem} onPress={handleArchive}>
                      <Ionicons name="archive-outline" size={18} color={Colors.text} />
                      <Text style={styles.menuText}>Lưu vào lưu trữ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { borderTopWidth: 0.5, borderColor: '#eee' }]} onPress={openDeleteSheet}>
                      <Ionicons name="trash-outline" size={18} color="#FF4444" />
                      <Text style={[styles.menuText, { color: '#FF4444' }]}>Xóa tin</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={{ marginLeft: 16 }}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.viewerFooter}>
          {currentStory.isOwn ? (
            <View style={styles.ownerFooter}>
              <View style={styles.viewCountContainer}>
                <Ionicons name="eye-outline" size={18} color="#fff" />
                <Text style={styles.viewCountText}>{currentStory.viewCount || 0} lượt xem</Text>
              </View>

              {reactions.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reactionsSummary}>
                  {reactions.map((r, i) => (
                    <View key={i} style={styles.reactionBadge}>
                      <Text style={styles.reactionBadgeText}>{r.emoji} {r.count}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.reactionPicker}>
              {REACTION_EMOJIS.map(e => (
                <TouchableOpacity key={e} style={styles.emojiBtn}>
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Messenger-style Delete Confirmation Sheet */}
        {showDeleteConfirm && (
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={closeDeleteSheet}>
              <View style={styles.backdrop} />
            </TouchableWithoutFeedback>
            <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Xóa tin này?</Text>
              <Text style={styles.sheetSub}>Bạn sẽ không thể xem lại tin này sau khi xóa.</Text>

              <TouchableOpacity style={styles.sheetDeleteBtn} onPress={confirmDelete}>
                <Text style={styles.sheetDeleteText}>Xóa</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetCancelBtn} onPress={closeDeleteSheet}>
                <Text style={styles.sheetCancelText}>Hủy</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Floating Toast Notification */}
        {toastVisible && (
          <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastAnim }] }]}>
            <View style={styles.toastContent}>
              <View style={styles.toastIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.toastText}>Đã thực hiện thành công</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  progressWrapper: { position: 'absolute', left: 10, right: 10, flexDirection: 'row', gap: 4, zIndex: 10 },
  progressBarBg: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 1 },
  viewerBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewerImg: { width: SCREEN_W, height: '100%' },
  viewerText: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center', padding: 24 },
  navLayer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 5 },
  navSide: { flex: 1 },
  viewerHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 15
  },
  viewerUserInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 20 },
  viewerAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  viewerUsername: { color: '#fff', fontWeight: '600', fontSize: 15 },
  headerSub: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  viewerActions: { flexDirection: 'row', alignItems: 'center' },
  menuDropdown: {
    position: 'absolute', top: 35, right: 0, backgroundColor: '#fff',
    borderRadius: 12, width: 180, elevation: 5, shadowColor: '#000',
    shadowOpacity: 0.2, shadowRadius: 4, zIndex: 30
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  menuText: { fontSize: 14, fontWeight: '500', color: Colors.text },
  viewerFooter: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', zIndex: 15 },
  ownerFooter: { alignItems: 'center', gap: 12 },
  viewCountContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  viewCountText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  reactionsSummary: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  reactionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 15, flexDirection: 'row', alignItems: 'center'
  },
  reactionBadgeText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  reactionPicker: { flexDirection: 'row', gap: 15, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 30 },
  emojiBtn: { padding: 2 },

  // Enhanced UI styles
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, alignItems: 'center'
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  sheetSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  sheetDeleteBtn: {
    backgroundColor: '#FF4444', width: '100%', paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', marginBottom: 12
  },
  sheetDeleteText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sheetCancelBtn: { width: '100%', paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { color: '#000', fontSize: 16, fontWeight: '500' },

  toastContainer: {
    position: 'absolute', left: 20, right: 20, zIndex: 200,
    alignItems: 'center'
  },
  toastContent: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30, elevation: 5, shadowColor: '#000',
    shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  toastIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  toastText: { color: '#333', fontSize: 14, fontWeight: '600' }
});
