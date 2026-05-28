import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@features/auth/store/authStore';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { API_URL } from '@shared/constants/config';

type Tab = 'login' | 'register';

export default function LoginScreen() {
  const [tab, setTab] = useState<Tab>('login');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!phoneNumber.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
      await setAuth(data.accessToken, data.refreshToken, data.user);
      router.replace("/(tabs)/chats");
    } catch (err: any) {
      Alert.alert("Đăng nhập thất bại", err.message || "Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !phoneNumber.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), phoneNumber: phoneNumber.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
      
      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.");
      setTab('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert("Đăng ký thất bại", err.message || "Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Layout.spacing.xl }}>
        <View style={styles.card}>
          <Text style={styles.title}>💬 Video Call</Text>
          <Text style={styles.subtitle}>Kết nối mọi người, mọi nơi</Text>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, tab === 'login' && styles.tabActive]}
              onPress={() => setTab('login')}
            >
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'register' && styles.tabActive]}
              onPress={() => setTab('register')}
            >
              <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {tab === 'login' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại hoặc Tên đăng nhập"
                placeholderTextColor={Colors.textMuted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
              </TouchableOpacity>
              <Text style={styles.hint}>
                Tài khoản mặc định:{"\n"}Nam (0901111111) / Hung (0902222222){"\n"}Mật khẩu: 123
              </Text>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Tên hiển thị"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại (để kết bạn)"
                placeholderTextColor={Colors.textMuted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu (ít nhất 6 ký tự)"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Tạo tài khoản</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  card: {
    width: "100%", maxWidth: 400, backgroundColor: Colors.surfaceElevated,
    borderRadius: Layout.borderRadius.lg, padding: Layout.spacing.xxl, alignItems: "center",
    alignSelf: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3,
    shadowRadius: 16, elevation: 10,
  },
  title: { fontSize: 32, fontWeight: "bold", color: Colors.text, marginBottom: Layout.spacing.sm },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.surfaceInput, borderRadius: 10, marginBottom: 24, width: '100%' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  input: {
    width: "100%", backgroundColor: Colors.surfaceInput, borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md, fontSize: 16, color: Colors.text,
    borderWidth: 1, borderColor: 'transparent', marginBottom: Layout.spacing.md,
  },
  button: {
    width: "100%", backgroundColor: Colors.primary, borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md, alignItems: "center", marginTop: Layout.spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: "600" },
  hint: { marginTop: Layout.spacing.xl, fontSize: 12, color: Colors.textMuted, textAlign: "center", lineHeight: 20 },
});
