import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@shared/constants/colors';
import { API_URL } from '@shared/constants/config';
import { ProfileData } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile: ProfileData | null;
  accessToken: string | null;
}

export function EditProfileModal({ visible, onClose, onSuccess, profile, accessToken }: Props) {
  const [saving, setSaving] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    if (visible && profile) {
      setEditUsername(profile.username);
      setEditBio(profile.bio || '');
    }
  }, [visible, profile]);

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editUsername, bio: editBio }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅', data.message);
        onSuccess();
        onClose();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch { Alert.alert('Lỗi', 'Không thể kết nối máy chủ'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.inputLabel}>Tên hiển thị</Text>
          <TextInput
            style={styles.modalInput}
            value={editUsername}
            onChangeText={setEditUsername}
            placeholder="Nhập tên của bạn"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.inputLabel}>Tiểu sử</Text>
          <TextInput
            style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Thêm vài dòng giới thiệu..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <TouchableOpacity 
            style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
            onPress={handleSaveInfo}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  modalInput: {
    backgroundColor: Colors.surfaceInput,
    color: Colors.text,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
