import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { login } from '@shared/api/api';
import { useAuthStore } from '@features/auth/store/authStore';
import { Colors } from '@shared/constants/colors';
import { Layout } from '@shared/constants/layout';

export default function LoginScreen() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!name.trim() || !password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      const { token, name: userName } = await login(name.trim(), password);
      await setAuth(token, userName);
      router.replace("/(tabs)/chats");
    } catch (err: any) {
      const msg =
        err?.response?.status === 401
          ? "Sai tên đăng nhập hoặc mật khẩu"
          : err?.response?.status === 409
          ? "Tài khoản đang được đăng nhập ở nơi khác"
          : "Không thể kết nối đến server";
      Alert.alert("Đăng nhập thất bại", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>💬 Video Call</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

        <TextInput
          style={styles.input}
          placeholder="Tên đăng nhập"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
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
          {loading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tài khoản mặc định: Nam / Hung / Lan / Minh{"\n"}Mật khẩu: 123
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: Layout.spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xxl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  input: {
    width: "100%",
    backgroundColor: Colors.surfaceInput,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: Layout.spacing.lg,
  },
  button: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    alignItems: "center",
    marginTop: Layout.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    marginTop: Layout.spacing.xxl,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
