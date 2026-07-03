import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image,
  ActivityIndicator, ScrollView, Alert, Animated, PanResponder, Dimensions,
  Platform, TouchableWithoutFeedback, Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@shared/constants/colors';
import { API_URL } from '@shared/constants/config';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  insetsTop: number;
}

const BG_COLORS = [
  '#0084FF', '#E91E8C', '#FF6B35', '#7B68EE',
  '#00C851', '#FF4444', '#FF8800', '#00BCD4',
];

const FONTS = [
  { label: 'Mặc định', value: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  { label: 'Serif', value: Platform.OS === 'ios' ? 'Times New Roman' : 'serif' },
  { label: 'Monospace', value: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  { label: 'Roboto', value: 'Roboto' },
];

export function CreateStoryModal({
  visible, onClose, onSuccess, accessToken, insetsTop
}: Props) {
  const [posting, setPosting] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_COLORS[0]);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const pan = useRef(new Animated.ValueXY()).current;

  // Confirmation Sheet State
  const [showConfirm, setShowConfirm] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
      }
    })
  ).current;

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

  const openConfirmSheet = () => {
    if (!storyText.trim() && !storyImage) {
      Alert.alert('Thông báo', 'Nhập nội dung hoặc chọn ảnh để đăng tin');
      return;
    }
    setShowConfirm(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  };

  const closeConfirmSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: SCREEN_H,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease)
    }).start(() => setShowConfirm(false));
  };

  const handlePost = async () => {
    setPosting(true);
    closeConfirmSheet();
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
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: storyText.trim() || undefined,
          mediaUrl,
          mediaType,
          backgroundColor: selectedBg,
        }),
      });

      if (res.ok) {
        resetForm();
        onSuccess();
        onClose();
      } else {
        Alert.alert('Lỗi', 'Không thể đăng tin');
      }
    } catch { Alert.alert('Lỗi', 'Không thể kết nối máy chủ'); }
    finally { setPosting(false); }
  };

  const resetForm = () => {
    setStoryText('');
    setStoryImage(null);
    setFontSize(24);
    setSelectedFont(FONTS[0].value);
    pan.setValue({ x: 0, y: 0 });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.createModal, { paddingTop: insetsTop }]}>
        <View style={styles.createModalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.createModalTitle}>Tạo tin</Text>
          <TouchableOpacity
            style={[styles.postBtn, (posting || (!storyText && !storyImage)) && { opacity: 0.5 }]}
            onPress={openConfirmSheet}
            disabled={posting || (!storyText.trim() && !storyImage)}
          >
            {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postBtnText}>Đăng</Text>}
          </TouchableOpacity>
        </View>

        {/* Preview Area */}
        <View style={[styles.storyPreview, { backgroundColor: storyImage ? '#000' : selectedBg }]}>
          {storyImage ? (
            <Image source={{ uri: storyImage }} style={styles.storyPreviewImg} resizeMode="contain" />
          ) : null}

          {storyText ? (
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                pan.getLayout(),
                { position: 'absolute' }
              ]}
            >
              <Text style={[
                styles.storyPreviewText,
                { fontSize, fontFamily: selectedFont }
              ]}>
                {storyText}
              </Text>
            </Animated.View>
          ) : !storyImage && (
            <Text style={styles.storyPreviewPlaceholder}>Tin của bạn sẽ hiện ở đây...</Text>
          )}
        </View>

        <ScrollView style={styles.createControls} showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.storyTextInput}
            placeholder="Viết gì đó..."
            placeholderTextColor={Colors.textMuted}
            value={storyText}
            onChangeText={setStoryText}
            multiline
            maxLength={200}
          />

          {storyText ? (
            <View style={styles.fontControls}>
              <View style={styles.fontSizeRow}>
                <Text style={styles.controlLabel}>Cỡ chữ: {fontSize}</Text>
                <View style={styles.sizeBtns}>
                  <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 2))} style={styles.sizeBtn}>
                    <Ionicons name="remove" size={20} color={Colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setFontSize(Math.min(60, fontSize + 2))} style={styles.sizeBtn}>
                    <Ionicons name="add" size={20} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontRow}>
                {FONTS.map(f => (
                  <TouchableOpacity
                    key={f.value}
                    style={[styles.fontChip, selectedFont === f.value && styles.fontChipSelected]}
                    onPress={() => setSelectedFont(f.value)}
                  >
                    <Text style={[styles.fontChipText, { fontFamily: f.value }]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.hintText}>* Kéo thả văn bản trong ô xem trước để đổi vị trí</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.controlRow} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={Colors.primary} />
            <Text style={styles.controlLabel}>{storyImage ? '✅ Đã chọn ảnh' : 'Thêm ảnh'}</Text>
          </TouchableOpacity>

          <View>
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

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Post Confirmation Bottom Sheet */}
        {showConfirm && (
          <View style={styles.confirmOverlay}>
            <TouchableWithoutFeedback onPress={closeConfirmSheet}>
              <View style={styles.confirmBackdrop} />
            </TouchableWithoutFeedback>
            <Animated.View style={[styles.confirmSheet, { transform: [{ translateY: sheetAnim }] }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Đăng tin?</Text>
              <Text style={styles.sheetSub}>Tin của bạn sẽ hiển thị với bạn bè trong 24 giờ.</Text>

              <TouchableOpacity style={styles.sheetConfirmBtn} onPress={handlePost}>
                <Text style={styles.sheetConfirmText}>Tiếp tục đăng</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetEditBtn} onPress={closeConfirmSheet}>
                <Text style={styles.sheetEditText}>Tiếp tục chỉnh sửa</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  createModal: { flex: 1, backgroundColor: Colors.bg },
  createModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  createModalTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  storyPreview: {
    height: 350, marginHorizontal: 16, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    backgroundColor: '#333'
  },
  storyPreviewImg: { width: '100%', height: '100%', borderRadius: 20 },
  storyPreviewText: { color: '#fff', fontWeight: 'bold', textAlign: 'center', padding: 10 },
  storyPreviewPlaceholder: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
  createControls: { padding: 16 },
  storyTextInput: {
    backgroundColor: Colors.surfaceInput, color: Colors.text, borderRadius: 12,
    padding: 14, fontSize: 16, minHeight: 80, textAlignVertical: 'top',
    marginBottom: 16
  },
  controlRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  controlLabel: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  fontControls: { marginBottom: 20, gap: 12 },
  fontSizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sizeBtns: { flexDirection: 'row', gap: 10 },
  sizeBtn: { backgroundColor: Colors.surfaceElevated, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  fontRow: { flexDirection: 'row', marginTop: 8 },
  fontChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15, backgroundColor: Colors.surfaceElevated, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  fontChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  fontChipText: { color: Colors.text, fontSize: 13 },
  hintText: { color: Colors.textMuted, fontSize: 11, fontStyle: 'italic' },
  bgLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  bgRow: { flexDirection: 'row' },
  bgChip: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  bgChipSelected: { borderWidth: 3, borderColor: '#fff' },

  // Confirmation Sheet Styles
  confirmOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: 'flex-end' },
  confirmBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  confirmSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, alignItems: 'center'
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  sheetSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  sheetConfirmBtn: {
    backgroundColor: Colors.primary, width: '100%', paddingVertical: 14,
    borderRadius: 14, alignItems: 'center', marginBottom: 12
  },
  sheetConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sheetEditBtn: { width: '100%', paddingVertical: 14, alignItems: 'center' },
  sheetEditText: { color: '#000', fontSize: 16, fontWeight: '600' }
});
