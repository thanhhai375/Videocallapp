import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthStore } from "../../../store/authStore";
import { useSignalR } from "../../../hooks/useSignalR";

export default function CallScreen() {
  const { id: targetConnectionId, name, isOutgoing } = useLocalSearchParams<{
    id: string;
    name: string;
    isOutgoing: string;
  }>();

  const { token } = useAuthStore();
  const { endCall, acceptCall, rejectCall } = useSignalR(token);

  const handleHangup = async () => {
    if (targetConnectionId) {
      await endCall(targetConnectionId);
    }
    router.back();
  };

  const handleAccept = async () => {
    if (targetConnectionId) {
      await acceptCall(targetConnectionId);
    }
  };

  const handleReject = async () => {
    if (targetConnectionId) {
      await rejectCall(targetConnectionId);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Placeholder video area */}
      <View style={styles.remoteVideo}>
        <Text style={styles.callerName}>{name}</Text>
        <Text style={styles.callStatus}>
          {isOutgoing === "true" ? "Đang gọi..." : "Cuộc gọi đến"}
        </Text>
        <Text style={styles.videoPlaceholder}>📹</Text>
        <Text style={styles.videoNote}>
          (Video WebRTC — cần cài react-native-webrtc)
        </Text>
      </View>

      {/* Local video preview placeholder */}
      <View style={styles.localVideo}>
        <Text style={styles.localVideoText}>Bạn</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {isOutgoing !== "true" && (
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
            <Text style={styles.controlIcon}>📞</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.hangupBtn} onPress={handleHangup}>
          <Text style={styles.controlIcon}>📵</Text>
        </TouchableOpacity>
        {isOutgoing !== "true" && (
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
            <Text style={styles.controlIcon}>❌</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  remoteVideo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  callerName: { color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  callStatus: { color: "#9ca3af", fontSize: 16, marginBottom: 24 },
  videoPlaceholder: { fontSize: 80, marginBottom: 12 },
  videoNote: { color: "#6b7280", fontSize: 12, textAlign: "center", paddingHorizontal: 40 },
  localVideo: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 100,
    height: 140,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#7c3aed",
  },
  localVideoText: { color: "#9ca3af", fontSize: 12 },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
    gap: 24,
    backgroundColor: "transparent",
  },
  acceptBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },
  hangupBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  rejectBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#6b7280",
    justifyContent: "center",
    alignItems: "center",
  },
  controlIcon: { fontSize: 28 },
});
