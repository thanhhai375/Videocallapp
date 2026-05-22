import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState, useCallback } from "react";
import { HUB_URL } from '@shared/constants/config';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUserStore } from '@features/contacts/store/userStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { User, IncomingCall } from '@shared/types';

interface UseSignalRReturn {
  isConnected: boolean;
  incomingCall: IncomingCall | null;
  sendMessage: (targetId: string, content: string) => Promise<void>;
  getChatHistory: (targetId: string) => Promise<void>;
  callFriend: (targetConnectionId: string) => Promise<void>;
  acceptCall: (callerConnectionId: string) => Promise<void>;
  rejectCall: (callerConnectionId: string) => Promise<void>;
  endCall: (targetConnectionId: string) => Promise<void>;
  sendOffer: (targetId: string, sdp: string) => Promise<void>;
  sendAnswer: (targetId: string, sdp: string) => Promise<void>;
  sendIce: (targetId: string, candidate: object) => Promise<void>;
  onReceiveOffer: ((callerId: string, sdp: string) => void) | null;
  onReceiveAnswer: ((sdp: string) => void) | null;
  onReceiveIce: ((candidate: object) => void) | null;
  setOnReceiveOffer: (cb: (callerId: string, sdp: string) => void) => void;
  setOnReceiveAnswer: (cb: (sdp: string) => void) => void;
  setOnReceiveIce: (cb: (candidate: object) => void) => void;
  sendTypingStarted: (targetId: string) => Promise<void>;
  sendTypingEnded: (targetId: string) => Promise<void>;
  sendMarkMessageSeen: (targetId: string, messageId: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useSignalR(): UseSignalRReturn {
  const { token } = useAuthStore();
  const { setUsers, updateUserStatus } = useUserStore();
  const { addMessage, setHistory, setTypingStatus, markMessageSeen } = useChatStore();
  
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const onReceiveOfferRef = useRef<((callerId: string, sdp: string) => void) | null>(null);
  const onReceiveAnswerRef = useRef<((sdp: string) => void) | null>(null);
  const onReceiveIceRef = useRef<((candidate: object) => void) | null>(null);

  useEffect(() => {
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_URL}?token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // ─── Handle Events ────────────────────────────────────────────────────────
    
    connection.on("LoadFriends", (data: User[]) => {
      setUsers(data);
    });

    connection.on("UserStatusChanged", (userId: string, isOnline: boolean, connectionId: string | null) => {
      updateUserStatus(userId, isOnline, connectionId);
    });

    connection.on("ReceiveMessage", (senderId: string, content: string) => {
      // Nhận tin nhắn từ người khác
      addMessage(senderId, { senderId, content, timestamp: Date.now() });
    });

    connection.on("LoadChatHistory", (history: any[]) => {
      // History handled via custom callback
    });

    connection.on("ReceiveTypingStarted", (callerId: string) => {
      setTypingStatus(callerId, true);
    });

    connection.on("ReceiveTypingEnded", (callerId: string) => {
      setTypingStatus(callerId, false);
    });

    connection.on("ReceiveMessageSeen", (callerId: string, messageId: string) => {
      markMessageSeen(callerId, messageId);
    });

    connection.on("IncomingCall", (callerConnectionId: string, callerName: string) => {
      setIncomingCall({ callerConnectionId, callerName });
    });

    connection.on("CallEnded", () => {
      setIncomingCall(null);
    });

    connection.on("CallRejected", () => {
      setIncomingCall(null);
    });

    // ─── WebRTC Events ────────────────────────────────────────────────────────

    connection.on("ReceiveOffer", (callerId: string, sdp: string) => {
      onReceiveOfferRef.current?.(callerId, sdp);
    });

    connection.on("ReceiveAnswer", (sdp: string) => {
      onReceiveAnswerRef.current?.(sdp);
    });

    connection.on("ReceiveIce", (candidate: object) => {
      onReceiveIceRef.current?.(candidate);
    });

    // ─── Start Connection ─────────────────────────────────────────────────────

    connection
      .start()
      .then(() => {
        setIsConnected(true);
        console.log("SignalR connected!");
      })
      .catch((err) => console.error("SignalR connection error:", err));

    connectionRef.current = connection;

    return () => {
      connection.stop();
      setIsConnected(false);
    };
  }, [token, setUsers, updateUserStatus, addMessage]);

  const invoke = useCallback(async (method: string, ...args: unknown[]) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke(method, ...args);
    }
  }, []);

  return {
    isConnected,
    incomingCall,
    sendMessage: async (targetId, content) => {
      // Khi mình gửi, server sẽ tự echo lại bằng ReceiveMessage
      // Nhưng để app nhanh nhẹn, ta có thể addMessage ngay lập tức (optimistic UI), 
      // Tuy nhiên server của bạn đã có: await Clients.Caller.SendAsync("ReceiveMessage", sender.Id, content);
      // => Tức là server sẽ gọi lại ReceiveMessage cho TẤT CẢ các bên, bao gồm cả người gửi!
      // Nên ta KHÔNG cần gọi addMessage ở đây. (Vì sẽ bị duplicate).
      await invoke("SendMessage", targetId, content);
    },
    getChatHistory: async (targetId) => {
      // Tùy chỉnh LoadChatHistory để pass targetId
      // Server trả về mảng các objects, ta gắn cứng listener tạm thời ở đây
      const onHistory = (history: any[]) => {
         setHistory(targetId, history);
         connectionRef.current?.off("LoadChatHistory", onHistory);
      };
      connectionRef.current?.on("LoadChatHistory", onHistory);
      
      await invoke("GetChatHistory", targetId);
    },
    callFriend: (targetConnectionId) => invoke("CallFriend", targetConnectionId),
    acceptCall: (callerConnectionId) => {
      setIncomingCall(null);
      return invoke("AcceptCall", callerConnectionId);
    },
    rejectCall: (callerConnectionId) => {
      setIncomingCall(null);
      return invoke("RejectCall", callerConnectionId);
    },
    endCall: (targetConnectionId) => invoke("EndCall", targetConnectionId),
    sendOffer: (targetId, sdp) => invoke("SendOffer", targetId, sdp),
    sendAnswer: (targetId, sdp) => invoke("SendAnswer", targetId, sdp),
    sendIce: (targetId, candidate) => invoke("SendIce", targetId, candidate),
    onReceiveOffer: onReceiveOfferRef.current,
    onReceiveAnswer: onReceiveAnswerRef.current,
    onReceiveIce: onReceiveIceRef.current,
    setOnReceiveOffer: (cb) => { onReceiveOfferRef.current = cb; },
    setOnReceiveAnswer: (cb) => { onReceiveAnswerRef.current = cb; },
    setOnReceiveIce: (cb) => { onReceiveIceRef.current = cb; },
    sendTypingStarted: (targetId) => invoke("TypingStarted", targetId),
    sendTypingEnded: (targetId) => invoke("TypingEnded", targetId),
    sendMarkMessageSeen: (targetId, messageId) => invoke("MarkMessageSeen", targetId, messageId),
    disconnect: async () => {
      await connectionRef.current?.stop();
      setIsConnected(false);
    },
  };
}
