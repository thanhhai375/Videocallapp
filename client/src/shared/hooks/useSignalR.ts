import * as signalR from "@microsoft/signalr";
import { useEffect, useCallback } from "react";
import { create } from 'zustand';
import { HUB_URL } from '@shared/constants/config';
import { useAuthStore } from '@features/auth/store/authStore';
import { useUserStore } from '@features/contacts/store/userStore';
import { useChatStore } from '@features/chat/store/chatStore';
import { User, IncomingCall } from '@shared/types';

interface SignalRState {
  isConnected: boolean;
  incomingCall: IncomingCall | null;
  onReceiveOfferCallback: ((callerId: string, sdp: string) => void) | null;
  onReceiveAnswerCallback: ((sdp: string) => void) | null;
  onReceiveIceCallback: ((candidate: object) => void) | null;
  onCallAcceptedCallback: ((calleeConnectionId: string) => void) | null;
  
  setIsConnected: (connected: boolean) => void;
  setIncomingCall: (call: IncomingCall | null) => void;
  setOnReceiveOfferCallback: (cb: ((callerId: string, sdp: string) => void) | null) => void;
  setOnReceiveAnswerCallback: (cb: ((sdp: string) => void) | null) => void;
  setOnReceiveIceCallback: (cb: ((candidate: object) => void) | null) => void;
  setOnCallAcceptedCallback: (cb: ((calleeConnectionId: string) => void) | null) => void;
}

const useSignalRStore = create<SignalRState>((set) => ({
  isConnected: false,
  incomingCall: null,
  onReceiveOfferCallback: null,
  onReceiveAnswerCallback: null,
  onReceiveIceCallback: null,
  onCallAcceptedCallback: null,
  
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setOnReceiveOfferCallback: (cb) => set({ onReceiveOfferCallback: cb }),
  setOnReceiveAnswerCallback: (cb) => set({ onReceiveAnswerCallback: cb }),
  setOnReceiveIceCallback: (cb) => set({ onReceiveIceCallback: cb }),
  setOnCallAcceptedCallback: (cb) => set({ onCallAcceptedCallback: cb }),
}));

let globalConnection: signalR.HubConnection | null = null;

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
  onReceiveOffer: ((callerId: string, sdp: string) => void) | null;
  onReceiveAnswer: ((sdp: string) => void) | null;
  onReceiveIce: ((candidate: object) => void) | null;
  onCallAccepted: ((calleeConnectionId: string) => void) | null;
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
  const store = useSignalRStore();
  
  useEffect(() => {
    if (!accessToken) return;
    
    // Prevent creating a new connection if one is already active or connecting
    if (globalConnection && (
        globalConnection.state === signalR.HubConnectionState.Connected ||
        globalConnection.state === signalR.HubConnectionState.Connecting ||
        globalConnection.state === signalR.HubConnectionState.Reconnecting
    )) {
        return;
    }
    
    const initConnection = async () => {
      globalConnection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => {
            return useAuthStore.getState().accessToken || "";
          }
        })
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
        useSignalRStore.getState().setIncomingCall({ callerConnectionId, callerName });
      });

      globalConnection.on("CallAccepted", (calleeConnectionId: string) => {
        useSignalRStore.getState().onCallAcceptedCallback?.(calleeConnectionId);
      });

      globalConnection.on("CallEnded", () => {
        useSignalRStore.getState().setIncomingCall(null);
      });

      globalConnection.on("CallRejected", () => {
        useSignalRStore.getState().setIncomingCall(null);
      });

      globalConnection.on("ReceiveOffer", (callerId: string, sdp: string) => {
        useSignalRStore.getState().onReceiveOfferCallback?.(callerId, sdp);
      });

      globalConnection.on("ReceiveAnswer", (sdp: string) => {
        useSignalRStore.getState().onReceiveAnswerCallback?.(sdp);
      });

      globalConnection.on("ReceiveIce", (candidate: object) => {
        useSignalRStore.getState().onReceiveIceCallback?.(candidate);
      });

      globalConnection.onclose((error) => {
        console.warn("SignalR connection closed:", error);
        useSignalRStore.getState().setIsConnected(false);
        globalConnection = null;
      });

      try {
        await globalConnection.start();
        useSignalRStore.getState().setIsConnected(true);
        console.log("SignalR global connected!");
      } catch (err: any) {
        // Allow retry next time it mounts
        globalConnection = null;
        console.warn("SignalR: could not connect", err?.message || err);
        
        // If Unauthorized, try to refresh the token
        if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
          console.log("Attempting to refresh access token...");
          await useAuthStore.getState().refreshAccessToken();
        }
      }
    };

    // If there's an existing connection (e.g. from a previous token), stop it first
    if (globalConnection) {
      globalConnection.stop().then(() => {
        initConnection();
      }).catch(() => {
        initConnection();
      });
    } else {
      initConnection();
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken && globalConnection) {
      globalConnection.stop();
      globalConnection = null;
      store.setIsConnected(false);
      store.setIncomingCall(null);
    }
  }, [accessToken, store]);

  const invoke = useCallback(async (method: string, ...args: unknown[]) => {
    if (globalConnection?.state === signalR.HubConnectionState.Connected) {
      await globalConnection.invoke(method, ...args);
    }
  }, []);

  return {
    isConnected: store.isConnected,
    incomingCall: store.incomingCall,
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
      store.setIncomingCall(null);
      return invoke("AcceptCall", callerConnectionId);
    },
    rejectCall: (callerConnectionId) => {
      store.setIncomingCall(null);
      return invoke("RejectCall", callerConnectionId);
    },
    endCall: (targetConnectionId) => invoke("EndCall", targetConnectionId),
    sendOffer: (targetId, sdp) => invoke("SendOffer", targetId, sdp),
    sendAnswer: (targetId, sdp) => invoke("SendAnswer", targetId, sdp),
    sendIce: (targetId, candidate) => invoke("SendIce", targetId, candidate),
    onReceiveOffer: store.onReceiveOfferCallback,
    onReceiveAnswer: store.onReceiveAnswerCallback,
    onReceiveIce: store.onReceiveIceCallback,
    onCallAccepted: store.onCallAcceptedCallback,
    setOnReceiveOffer: (cb) => store.setOnReceiveOfferCallback(cb),
    setOnReceiveAnswer: (cb) => store.setOnReceiveAnswerCallback(cb),
    setOnReceiveIce: (cb) => store.setOnReceiveIceCallback(cb),
    setOnCallAccepted: (cb) => store.setOnCallAcceptedCallback(cb),
    sendTypingStarted: (targetId) => invoke("TypingStarted", targetId),
    sendTypingEnded: (targetId) => invoke("TypingEnded", targetId),
    sendMarkMessageSeen: (targetId, messageId) => invoke("MarkMessageSeen", targetId, messageId),
    disconnect: async () => {
      console.warn("Ignoring disconnect call to preserve global connection");
    },
  };
}
