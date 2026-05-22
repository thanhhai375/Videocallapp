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
import { login } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function LoginScreen() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>📱 Video Call</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

        <TextInput
          style={styles.input}
          placeholder="Tên đăng nhập"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor="#999"
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
            <ActivityIndicator color="#fff" />
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
    backgroundColor: "#0f0f1a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    backgroundColor: "#0f0f1a",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2d2d4e",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    marginTop: 24,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
