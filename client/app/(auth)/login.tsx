import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, Dimensions
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@features/auth/store/authStore';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';
import { API_URL } from '@shared/constants/config';

type Tab = 'login' | 'register';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
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
                    placeholderTextColor="rgba(0, 163, 255, 0.4)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Mật khẩu"
                    placeholderTextColor="rgba(0, 163, 255, 0.4)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                    <LinearGradient colors={['#00A3FF', '#0066FF']} style={styles.loginButton}>
                      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Đăng nhập</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput style={styles.inputField} placeholder="Tên hiển thị" placeholderTextColor="rgba(0, 163, 255, 0.4)" value={username} onChangeText={setUsername} />
                  <TextInput style={styles.inputField} placeholder="Số điện thoại" placeholderTextColor="rgba(0, 163, 255, 0.4)" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                  <TextInput style={styles.inputField} placeholder="Mật khẩu" placeholderTextColor="rgba(0, 163, 255, 0.4)" value={password} onChangeText={setPassword} secureTextEntry />
                  <TextInput style={styles.inputField} placeholder="Xác nhận mật khẩu" placeholderTextColor="rgba(0, 163, 255, 0.4)" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                  <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
                    <LinearGradient colors={['#00A3FF', '#0066FF']} style={styles.loginButton}>
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

const styles = StyleSheet.create({
  // Sử dụng màu ĐEN TUYỀN để hòa nhập tuyệt đối với ảnh nền của bạn
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 100 },

  // Hình vệt sáng ép sát xuống đáy
  bottomWaveImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
    height: height * 0.4, // Cao 40% màn hình
    zIndex: 0, // Nằm trên nền đen nhưng dưới Form
  },

  headerImageContainer: { alignItems: 'center', marginBottom: 10, width: '100%', height: 220 },
  headerImage: { width: '100%', height: '100%' },

  authCard: {
    backgroundColor: 'rgba(0, 15, 40, 0.8)', // Trong suốt hơn để thấy sóng phía sau
    borderRadius: 30,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  tabsContainer: { flexDirection: 'row', marginBottom: 25 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 15 },
  tabActive: { backgroundColor: '#0084FF' },
  tabLabel: { color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', fontSize: 16 },
  tabLabelActive: { color: '#FFF' },

  formContent: { width: '100%' },
  inputField: {
    backgroundColor: 'rgba(0, 30, 60, 0.5)',
    borderRadius: 15,
    padding: 18,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 255, 0.1)'
  },
  loginButton: {
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  loginButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
