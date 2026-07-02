import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { SettingItem } from '@features/profile/components/SettingItem';

// Mock active sessions
const activeSessions = [
  {
    id: '1',
    device: 'iPhone 14 Pro',
    location: 'Hồ Chí Minh, Việt Nam',
    time: 'Đang hoạt động',
    icon: 'phone-portrait-outline' as const,
    isActive: true,
  },
  {
    id: '2',
    device: 'Windows PC (Chrome)',
    location: 'Hồ Chí Minh, Việt Nam',
    time: 'Hôm qua lúc 10:24',
    icon: 'desktop-outline' as const,
    isActive: false,
  },
  {
    id: '3',
    device: 'iPad Air 5',
    location: 'Hà Nội, Việt Nam',
    time: '12 Tháng 4 lúc 08:15',
    icon: 'tablet-portrait-outline' as const,
    isActive: false,
  }
];

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useTheme();
  const styles = getStyles(Colors);

  // States for custom modals
  const [activeModal, setActiveModal] = useState<'password' | 'phone' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [oldPassword, setOldPassword] = useState('');

  const handlePasswordChange = () => {
    setActiveModal('password');
    setInputValue('');
    setOldPassword('');
  };

  const handlePhoneChange = () => {
    setActiveModal('phone');
    setInputValue('+84 ');
  };

  const handleSaveModal = () => {
    if (activeModal === 'password') {
      Alert.alert('Thành công', 'Tính năng thay đổi mật khẩu sẽ sớm được hoàn thiện.');
    } else {
      Alert.alert('Đã gửi mã xác nhận', `Mã xác nhận đã được gửi đến ${inputValue}.`);
    }
    setActiveModal(null);
  };

  const handleLogoutSession = (device: string) => {
    Alert.alert(
      'Đăng xuất thiết bị',
      `Bạn có chắc chắn muốn đăng xuất khỏi ${device}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảo mật & Đăng nhập</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Xác thực 2 yếu tố / Đổi thông tin */}
        <Text style={styles.sectionHeader}>Thông tin đăng nhập</Text>
        <View style={styles.sectionContainer}>
          <SettingItem 
            icon="key-outline" 
            title="Đổi mật khẩu" 
            subtitle="Cập nhật mật khẩu thường xuyên để bảo vệ tài khoản" 
            action={handlePasswordChange} 
          />
          <SettingItem 
            icon="call-outline" 
            title="Số điện thoại bảo mật" 
            subtitle="Sử dụng để lấy lại mật khẩu và xác thực (+84 987***321)" 
            action={handlePhoneChange} 
          />
        </View>

        {/* Cảnh báo đăng nhập */}
        <Text style={styles.sectionHeader}>Nơi bạn đã đăng nhập</Text>
        <View style={styles.sectionContainer}>
          {activeSessions.map((session, index) => (
            <TouchableOpacity 
              key={session.id} 
              style={[styles.sessionItem, index === activeSessions.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleLogoutSession(session.device)}
            >
              <View style={[styles.sessionIconBox, session.isActive && { backgroundColor: Colors.primaryDim }]}>
                <Ionicons 
                  name={session.icon} 
                  size={24} 
                  color={session.isActive ? Colors.primary : Colors.text} 
                />
              </View>
              <View style={styles.sessionTextContainer}>
                <Text style={styles.sessionDevice}>{session.device}</Text>
                <Text style={styles.sessionDetails}>
                  {session.location} • <Text style={session.isActive ? styles.activeTimeText : styles.timeText}>{session.time}</Text>
                </Text>
              </View>
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Nâng cao */}
        <Text style={styles.sectionHeader}>Nâng cao</Text>
        <View style={styles.sectionContainer}>
          <SettingItem 
            icon="finger-print-outline" 
            title="Xác thực 2 yếu tố (2FA)" 
            subtitle="Tăng cường bảo mật bằng mã xác nhận phụ" 
            action={() => Alert.alert('Thông báo', 'Tính năng xác thực 2 bước đang được bảo trì.')} 
          />
          <SettingItem 
            icon="shield-half-outline" 
            title="Cảnh báo đăng nhập lạ" 
            subtitle="Nhận thông báo khi có thiết bị mới đăng nhập" 
            action={() => Alert.alert('Cài đặt', 'Cảnh báo đã được bật.')} 
          />
        </View>

      </ScrollView>

      {/* Custom Modal for Android/iOS */}
      <Modal
        visible={activeModal !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setActiveModal(null); }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  {activeModal === 'password' ? 'Đổi mật khẩu' : 'Số điện thoại bảo mật'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {activeModal === 'password' ? 'Nhập mật khẩu của bạn:' : 'Nhập số điện thoại mới:'}
                </Text>
                
                {activeModal === 'password' && (
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Mật khẩu hiện tại"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry
                    value={oldPassword}
                    onChangeText={setOldPassword}
                  />
                )}

                <TextInput
                  style={styles.modalInput}
                  placeholder={activeModal === 'password' ? 'Mật khẩu mới' : 'Ví dụ: +84 987 654 321'}
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={activeModal === 'password'}
                  keyboardType={activeModal === 'phone' ? 'phone-pad' : 'default'}
                  value={inputValue}
                  onChangeText={setInputValue}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setActiveModal(null)}>
                    <Text style={styles.modalBtnCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveModal}>
                    <Text style={styles.modalBtnSaveText}>Lưu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
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
  sectionHeader: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: 8,
    marginTop: 20,
  },
  sectionContainer: {
    backgroundColor: Colors.surfaceElevated,
    marginHorizontal: Layout.spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sessionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sessionTextContainer: {
    flex: 1,
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.surfaceInput,
    color: Colors.text,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalBtnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
  },
  modalBtnCancelText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnSave: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalBtnSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionDevice: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionDetails: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  timeText: {
    color: Colors.textMuted,
  },
  activeTimeText: {
    color: Colors.success,
    fontWeight: '500',
  },
});
