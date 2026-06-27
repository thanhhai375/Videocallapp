import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { SettingItem } from '@features/profile/components/SettingItem';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const Colors = useTheme();
  const styles = getStyles(Colors);

  const [loading, setLoading] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [callNotifications, setCallNotifications] = useState(true);
  const [vibrate, setVibrate] = useState(true);

  useEffect(() => {
    // Load preferences from AsyncStorage
    const loadPreferences = async () => {
      try {
        const msgVal = await AsyncStorage.getItem('messageNotifications');
        const callVal = await AsyncStorage.getItem('callNotifications');
        const vibrateVal = await AsyncStorage.getItem('vibrateNotifications');

        if (msgVal !== null) setMessageNotifications(msgVal === 'true');
        if (callVal !== null) setCallNotifications(callVal === 'true');
        if (vibrateVal !== null) setVibrate(vibrateVal === 'true');
      } catch (e) {
        console.error('Failed to load notification settings:', e);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const toggleMessageNotifications = async (val: boolean) => {
    setMessageNotifications(val);
    try {
      await AsyncStorage.setItem('messageNotifications', String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCallNotifications = async (val: boolean) => {
    setCallNotifications(val);
    try {
      await AsyncStorage.setItem('callNotifications', String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleVibrate = async (val: boolean) => {
    setVibrate(val);
    try {
      await AsyncStorage.setItem('vibrateNotifications', String(val));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo & Âm thanh</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.sectionHeader}>Tùy chỉnh thông báo</Text>
        <View style={styles.sectionContainer}>
          <SettingItem
            icon="chatbubble-ellipses-outline"
            title="Thông báo tin nhắn"
            subtitle="Hiển thị thông báo khi có tin nhắn mới"
            rightElement={
              <Switch
                value={messageNotifications}
                onValueChange={toggleMessageNotifications}
                trackColor={{ true: Colors.primary }}
              />
            }
          />
          <SettingItem
            icon="call-outline"
            title="Thông báo cuộc gọi"
            subtitle="Hiển thị thông báo khi có cuộc gọi đến"
            rightElement={
              <Switch
                value={callNotifications}
                onValueChange={toggleCallNotifications}
                trackColor={{ true: Colors.primary }}
              />
            }
          />
          <SettingItem
            icon="volume-high-outline"
            title="Rung khi có thông báo"
            subtitle="Điện thoại sẽ rung khi nhận tin nhắn hoặc cuộc gọi"
            rightElement={
              <Switch
                value={vibrate}
                onValueChange={toggleVibrate}
                trackColor={{ true: Colors.primary }}
              />
            }
          />
        </View>

        <Text style={styles.helperText}>
          Thay đổi trên sẽ áp dụng ngay lập tức cho các cuộc gọi và tin nhắn real-time trong ứng dụng.
        </Text>
      </ScrollView>
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
    helperText: {
      color: Colors.textMuted,
      fontSize: 13,
      paddingHorizontal: Layout.spacing.lg,
      marginTop: 12,
      lineHeight: 18,
    },
  });
