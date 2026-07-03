import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@features/auth/store/authStore';
import { DarkTheme } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { API_URL } from '@shared/constants/config';

type Tab = 'login' | 'register';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const Colors = DarkTheme;
  const styles = getStyles(Colors);
  
  const [tab, setTab] = useState<Tab>('login');
  const [phoneNumber, setPhoneNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

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
    <View style={styles.container}>
      {/* 1. Hình vệt sáng (Wave) ở dưới đáy - Đặt trực tiếp làm nền */}
      <Image
        source={require("../../assets/brand-wave.png")}
        style={styles.bottomWaveImage}
        resizeMode="stretch"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* 2. Hình Header */}
          <View style={styles.headerImageContainer}>
            <Image
              source={require("../../assets/brand-hero.png")}
              style={styles.headerImage}
              resizeMode="contain"
            />
          </View>

          {/* 3. Form Card */}
          <View style={styles.authCard}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabButton, tab === 'login' && styles.tabActive]}
                onPress={() => setTab('login')}
              >
                <Text style={[styles.tabLabel, tab === 'login' && styles.tabLabelActive]}>Đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, tab === 'register' && styles.tabActive]}
                onPress={() => setTab('register')}
              >
                <Text style={[styles.tabLabel, tab === 'register' && styles.tabLabelActive]}>Đăng ký</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContent}>
              {tab === 'login' ? (
                <>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Số điện thoại"
                    placeholderTextColor={Colors.textMuted}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Mật khẩu"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                    <LinearGradient colors={['#0084FF', '#0066FF']} style={styles.loginButton}>
                      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Đăng nhập</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput style={styles.inputField} placeholder="Tên hiển thị" placeholderTextColor={Colors.textMuted} value={username} onChangeText={setUsername} />
                  <TextInput style={styles.inputField} placeholder="Số điện thoại" placeholderTextColor={Colors.textMuted} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                  <TextInput style={styles.inputField} placeholder="Mật khẩu" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
                  <TextInput style={styles.inputField} placeholder="Xác nhận mật khẩu" placeholderTextColor={Colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                  <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
                    <LinearGradient colors={['#0084FF', '#0066FF']} style={styles.loginButton}>
                      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Tạo tài khoản</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 100 },

  bottomWaveImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
    height: height * 0.4,
    zIndex: 0,
    opacity: Colors.bg === '#000000' ? 0.6 : 0.2, // Adjust opacity for light/dark
  },

  headerImageContainer: { alignItems: 'center', marginBottom: 10, width: '100%', height: 220 },
  headerImage: { width: '100%', height: '100%' },

  authCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: Colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: Colors.bg === '#000000' ? 0.5 : 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  tabsContainer: { flexDirection: 'row', marginBottom: 25 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 15 },
  tabActive: { backgroundColor: Colors.primaryDim },
  tabLabel: { color: Colors.textSecondary, fontWeight: 'bold', fontSize: 16 },
  tabLabelActive: { color: Colors.primary },

  formContent: { width: '100%' },
  inputField: {
    backgroundColor: Colors.surfaceInput,
    borderRadius: 15,
    padding: 18,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.divider
  },
  loginButton: {
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
