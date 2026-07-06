/* eslint-disable */
import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Text,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system";
import { useTheme } from "@shared/constants/colors";
import { API_URL } from "@shared/constants/config";
import { useAuthStore } from "@features/auth/store/authStore";

interface ChatInputProps {
  onSend: (message: string, type?: "Text" | "Image" | "Audio") => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

export function ChatInput({
  onSend,
  onTypingStart,
  onTypingEnd,
}: ChatInputProps) {
  const Colors = useTheme();
  const styles = getStyles(Colors);
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingRecord, setIsPreparingRecord] = useState(false);
  const [isFinishingRecord, setIsFinishingRecord] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuthStore();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isRecording = recorder.isRecording;

  const handleTextChange = (newText: string) => {
    setText(newText);
    if (newText.trim().length > 0) {
      onTypingStart?.();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTypingEnd?.();
      }, 2000);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingEnd?.();
    }
  };

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));

    let interval: ReturnType<typeof setInterval>;
    if (isRecording && !isFinishingRecord) {
      setRecordTime(0);
      interval = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordTime(0);
    }
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isFinishingRecord]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim(), "Text");
      setText("");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTypingEnd?.();
    }
  };

  const uploadFile = async (
    uri: string,
    mimeType: string,
    filename: string,
  ): Promise<string | null> => {
    try {
      const res = await FileSystem.uploadAsync(`${API_URL}/upload`, uri, {
        httpMethod: 'POST',
        uploadType: 1, // 1 is MULTIPART
        fieldName: 'file',
        mimeType: mimeType,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status >= 200 && res.status < 300) {
        const data = JSON.parse(res.body);
        return data.url;
      } else {
        const errData = JSON.parse(res.body);
        Alert.alert("Upload Lỗi", errData?.message || `Server báo lỗi ${res.status}`);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Lỗi Mạng", "Không thể kết nối đến máy chủ để tải file lên. " + err?.message);
    }
    return null;
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Cho phép app truy cập thư viện ảnh trong cài đặt.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        const filename = asset.uri.split("/").pop() || "image.jpg";
        const url = await uploadFile(asset.uri, "image/jpeg", filename);
        if (url) onSend(url, "Image");
        else Alert.alert("Lỗi", "Không thể tải ảnh lên");
      }
    } catch {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi chọn ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Cho phép app dùng camera trong cài đặt.",
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        const filename = `photo_${Date.now()}.jpg`;
        const url = await uploadFile(asset.uri, "image/jpeg", filename);
        if (url) onSend(url, "Image");
        else Alert.alert("Lỗi", "Không thể gửi ảnh");
      }
    } catch {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi chụp ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isPreparingRecord) return;
    try {
      const { status } = await requestRecordingPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Vui lòng cho phép ứng dụng truy cập Microphone trong Cài đặt (Settings) của điện thoại để ghi âm."
        );
        return;
      }
      setIsPreparingRecord(true);
      setRecordTime(0);
      await recorder.prepareToRecordAsync();
      await recorder.record();
    } catch (err) {
      console.error("Failed to start recording", err);
    } finally {
      setIsPreparingRecord(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsFinishingRecord(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        setIsUploading(true);
        const url = await uploadFile(
          uri,
          "audio/m4a",
          `audio_${Date.now()}.m4a`,
        );
        if (url) onSend(url, "Audio");
        else Alert.alert("Lỗi", "Không thể gửi tin nhắn thoại");
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    } finally {
      setIsFinishingRecord(false);
      setIsUploading(false);
    }
  };

  const cancelRecording = async () => {
    if (!isRecording) return;
    try {
      await recorder.stop();
    } catch (err) {
      console.error("Failed to cancel recording", err);
    }
  };

  return (
    <View
      style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : (isKeyboardVisible ? 10 : Math.max(insets.bottom, 10)) }]}
    >
      <TouchableOpacity
        style={styles.actionIcon}
        onPress={pickImage}
        disabled={isUploading || isRecording || isPreparingRecord}
      >
        <Ionicons name="image" size={26} color={Colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionIcon}
        onPress={openCamera}
        disabled={isUploading || isRecording || isPreparingRecord}
      >
        <Ionicons name="camera" size={26} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        {isPreparingRecord || (isRecording && !isFinishingRecord) ? (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>{formatTime(recordTime)}</Text>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Aa"
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={handleTextChange}
            onBlur={() => onTypingEnd?.()}
            multiline
            maxLength={1000}
          />
        )}
        {(!isRecording || isFinishingRecord) && !isPreparingRecord && (
          <TouchableOpacity style={styles.emojiBtn}>
            <Ionicons name="happy" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {isUploading ? (
        <View style={styles.sendBtn}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : text.trim().length > 0 ? (
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="send" size={22} color={Colors.primary} />
        </TouchableOpacity>
      ) : isRecording ? (
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.sendBtn} onPress={cancelRecording}>
            <Ionicons name="close-circle" size={28} color={Colors.danger} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={stopRecording}>
            <Ionicons name="send" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={startRecording}
          >
            <Ionicons
              name="mic"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={() => onSend('👍', 'Text')}>
            <Ionicons name="thumbs-up" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: Colors.bg,
  },
  actionIcon: { padding: 8, justifyContent: "center", alignItems: "center" },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceInput,
    borderRadius: 24,
    marginHorizontal: 8,
    paddingLeft: 16,
    paddingRight: 10,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    maxHeight: 120,
  },
  recordingIndicator: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
    marginRight: 8,
  },
  recordingText: { color: Colors.danger, fontSize: 16, fontWeight: "500" },
  emojiBtn: { padding: 4 },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    marginRight: 2,
  },
});
