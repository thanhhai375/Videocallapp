import * as signalR from "@microsoft/signalr";
import { useEffect, useState, useCallback } from "react";
import { HUB_URL } from '@shared/constants/config';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUserStore } from '@features/contacts/store/userStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { User, IncomingCall } from '@shared/types';

// --- Singleton State ---
let globalConnection: signalR.HubConnection | null = null;
let isGlobalConnected = false;
let initPromise: Promise<void> | null = null;

// Subscribers for React re-renders
const connectionSubscribers: Set<(connected: boolean) => void> = new Set();
const incomingCallSubscribers: Set<(call: IncomingCall | null) => void> = new Set();

let currentIncomingCall: IncomingCall | null = null;

const setGlobalIncomingCall = (call: IncomingCall | null) => {
  currentIncomingCall = call;
  incomingCallSubscribers.forEach(sub => sub(call));
};

const notifyConnectionState = (state: boolean) => {
  isGlobalConnected = state;
  connectionSubscribers.forEach(sub => sub(state));
};

// WebRTC Callbacks
let onReceiveOfferCb: ((callerId: string, sdp: string) => void) | null = null;
let onReceiveAnswerCb: ((sdp: string) => void) | null = null;
let onReceiveIceCb: ((candidate: object) => void) | null = null;
let onCallAcceptedCb: ((calleeConnectionId: string) => void) | null = null;

const initGlobalConnection = async () => {
  if (globalConnection || initPromise) return initPromise;

  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) return;

  globalConnection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_URL}?access_token=${accessToken}`)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  globalConnection.on("LoadFriends", (data: User[]) => {
    useUserStore.getState().setUsers(data);
  });

  globalConnection.on("UserStatusChanged", (userId: string, isOnline: boolean, connectionId: string | null) => {
    useUserStore.getState().updateUserStatus(userId, isOnline, connectionId);
  });

  globalConnection.on("ReceiveMessage", (senderId: string, content: string) => {
    useChatStore.getState().addMessage(senderId, { senderId, content, timestamp: Date.now() });
  });

  globalConnection.on("ReceiveTypingStarted", (callerId: string) => {
    useChatStore.getState().setTypingStatus(callerId, true);
  });

  globalConnection.on("ReceiveTypingEnded", (callerId: string) => {
    useChatStore.getState().setTypingStatus(callerId, false);
  });

  globalConnection.on("ReceiveMessageSeen", (callerId: string, messageId: string) => {
    useChatStore.getState().markMessageSeen(callerId, messageId);
  });

  globalConnection.on("IncomingCall", (callerConnectionId: string, callerName: string) => {
    setGlobalIncomingCall({ callerConnectionId, callerName });
  });

  globalConnection.on("CallEnded", () => {
    setGlobalIncomingCall(null);
  });

  globalConnection.on("CallRejected", () => {
    setGlobalIncomingCall(null);
  });
  
  globalConnection.on("CallAccepted", (calleeConnectionId: string) => {
    if (onCallAcceptedCb) onCallAcceptedCb(calleeConnectionId);
  });

  globalConnection.on("ReceiveOffer", (callerId: string, sdp: string) => {
    if (onReceiveOfferCb) onReceiveOfferCb(callerId, sdp);
  });

  globalConnection.on("ReceiveAnswer", (sdp: string) => {
    if (onReceiveAnswerCb) onReceiveAnswerCb(sdp);
  });

  globalConnection.on("ReceiveIce", (candidate: object) => {
    if (onReceiveIceCb) onReceiveIceCb(candidate);
  });

  initPromise = globalConnection.start().then(() => {
    notifyConnectionState(true);
    console.log("SignalR global connected!");
  }).catch(async (err) => {
    globalConnection = null;
    initPromise = null;
    const newToken = await useAuthStore.getState().refreshAccessToken();
    if (newToken) {
      // Logic retry có thể được thực hiện khi state đổi
    }
  });

  return initPromise;
};

interface UseSignalRReturn {
  isConnected: boolean;
  incomingCall: IncomingCall | null;
  sendMessage: (targetId: string, content: string, messageType?: string) => Promise<void>;
  getChatHistory: (targetId: string) => Promise<void>;
  callFriend: (targetConnectionId: string, callType?: string) => Promise<void>;
  acceptCall: (callerConnectionId: string) => Promise<void>;
  rejectCall: (callerConnectionId: string) => Promise<void>;
  endCall: (targetConnectionId: string) => Promise<void>;
  sendOffer: (targetId: string, sdp: string) => Promise<void>;
  sendAnswer: (targetId: string, sdp: string) => Promise<void>;
  sendIce: (targetId: string, candidate: object) => Promise<void>;
  setOnReceiveOffer: (cb: (callerId: string, sdp: string) => void) => void;
  setOnReceiveAnswer: (cb: (sdp: string) => void) => void;
  setOnReceiveIce: (cb: (candidate: object) => void) => void;
  setOnCallAccepted: (cb: (calleeConnectionId: string) => void) => void;
  sendTypingStarted: (targetId: string) => Promise<void>;
  sendTypingEnded: (targetId: string) => Promise<void>;
  sendMarkMessageSeen: (targetId: string, messageId: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useSignalR(): UseSignalRReturn {
  const { accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(isGlobalConnected);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(currentIncomingCall);

  useEffect(() => {
    if (accessToken) {
      initGlobalConnection();
    }

    const onConnChange = (state: boolean) => setIsConnected(state);
    const onCallChange = (call: IncomingCall | null) => setIncomingCall(call);

    connectionSubscribers.add(onConnChange);
    incomingCallSubscribers.add(onCallChange);

    return () => {
      connectionSubscribers.delete(onConnChange);
      incomingCallSubscribers.delete(onCallChange);
    };
  }, [accessToken]);

  const invoke = useCallback(async (method: string, ...args: unknown[]) => {
    if (globalConnection?.state === signalR.HubConnectionState.Connected) {
      await globalConnection.invoke(method, ...args);
    }
  }, []);

  return {
    isConnected,
    incomingCall,
    sendMessage: async (targetId, content, messageType = "Text") => {
      await invoke("SendMessage", targetId, content, messageType);
    },
    getChatHistory: async (targetId) => {
      const onHistory = (history: any[]) => {
         useChatStore.getState().setHistory(targetId, history);
         globalConnection?.off("LoadChatHistory", onHistory);
      };
      globalConnection?.on("LoadChatHistory", onHistory);
      await invoke("GetChatHistory", targetId);
    },
    callFriend: (targetConnectionId, callType = "Video") => invoke("CallFriend", targetConnectionId, callType),
    acceptCall: (callerConnectionId) => {
      setGlobalIncomingCall(null);
      return invoke("AcceptCall", callerConnectionId);
    },
    rejectCall: (callerConnectionId) => {
      setGlobalIncomingCall(null);
      return invoke("RejectCall", callerConnectionId);
    },
    endCall: (targetConnectionId) => invoke("EndCall", targetConnectionId),
    sendOffer: (targetId, sdp) => invoke("SendOffer", targetId, sdp),
    sendAnswer: (targetId, sdp) => invoke("SendAnswer", targetId, sdp),
    sendIce: (targetId, candidate) => invoke("SendIce", targetId, candidate),
    setOnReceiveOffer: (cb) => { onReceiveOfferCb = cb; },
    setOnReceiveAnswer: (cb) => { onReceiveAnswerCb = cb; },
    setOnReceiveIce: (cb) => { onReceiveIceCb = cb; },
    setOnCallAccepted: (cb) => { onCallAcceptedCb = cb; },
    sendTypingStarted: (targetId) => invoke("TypingStarted", targetId),
    sendTypingEnded: (targetId) => invoke("TypingEnded", targetId),
    sendMarkMessageSeen: (targetId, messageId) => invoke("MarkMessageSeen", targetId, messageId),
    disconnect: async () => {
      if (globalConnection) {
        await globalConnection.stop();
        globalConnection = null;
        initPromise = null;
        notifyConnectionState(false);
      }
    },
  };
}
