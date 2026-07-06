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
let onCallEndedCb: (() => void) | null = null;
let onCallRejectedCb: (() => void) | null = null;

// Group Call Callbacks
let onGroupCallStartedCb: ((groupId: string, callerId: string, callerName: string) => void) | null = null;
let onGroupCallEndedCb: ((groupId: string) => void) | null = null;
let onUserJoinedGroupCallCb: ((groupId: string, userId: string, connectionId: string, name?: string) => void) | null = null;
let onUserLeftGroupCallCb: ((groupId: string, userId: string, connectionId: string) => void) | null = null;
let onReceiveGroupOfferCb: ((callerId: string, callerConnectionId: string, sdp: string, groupId: string) => void) | null = null;
let onReceiveGroupAnswerCb: ((callerId: string, callerConnectionId: string, sdp: string, groupId: string) => void) | null = null;
let onReceiveGroupIceCb: ((callerId: string, callerConnectionId: string, candidate: object, groupId: string) => void) | null = null;

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

  globalConnection.on("ReceiveMessage", (senderId: string, content: string, messageId?: string, isGroup?: boolean, groupId?: string) => {
    const targetId = isGroup && groupId ? groupId : senderId;
    useChatStore.getState().addMessage(targetId, { id: messageId || Math.random().toString(), senderId, content, timestamp: Date.now() });
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
    onCallEndedCb?.();
  });

  globalConnection.on("CallRejected", () => {
    setGlobalIncomingCall(null);
    onCallRejectedCb?.();
  });
  
  globalConnection.on("CallAccepted", (calleeConnectionId: string) => {
    onCallAcceptedCb?.(calleeConnectionId);
  });

  // Group Call Receivers
  globalConnection.on("GroupCallStarted", (groupId: string, callerId: string, callerName: string) => onGroupCallStartedCb?.(groupId, callerId, callerName));
  globalConnection.on("GroupCallEnded", (groupId: string) => onGroupCallEndedCb?.(groupId));
  globalConnection.on("UserJoinedGroupCall", (groupId: string, userId: string, connectionId: string, name?: string) => onUserJoinedGroupCallCb?.(groupId, userId, connectionId, name));
  globalConnection.on("UserLeftGroupCall", (groupId: string, userId: string, connectionId: string) => onUserLeftGroupCallCb?.(groupId, userId, connectionId));
  globalConnection.on("ReceiveGroupOffer", (callerId: string, callerConnectionId: string, sdp: string, groupId: string) => onReceiveGroupOfferCb?.(callerId, callerConnectionId, sdp, groupId));
  globalConnection.on("ReceiveGroupAnswer", (callerId: string, callerConnectionId: string, sdp: string, groupId: string) => onReceiveGroupAnswerCb?.(callerId, callerConnectionId, sdp, groupId));
  globalConnection.on("ReceiveGroupIce", (callerId: string, callerConnectionId: string, candidate: object, groupId: string) => onReceiveGroupIceCb?.(callerId, callerConnectionId, candidate, groupId));

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
  sendMessage: (targetId: string, content: string, messageType?: string, isGroup?: boolean) => Promise<void>;
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
  setOnCallEnded: (cb: () => void) => void;
  setOnCallRejected: (cb: () => void) => void;
  sendTypingStarted: (targetId: string) => Promise<void>;
  sendTypingEnded: (targetId: string) => Promise<void>;
  sendMarkMessageSeen: (targetId: string, messageId: string) => Promise<void>;
  createGroup: (name: string, memberIds: string[]) => Promise<void>;
  
  // Group Call Methods
  checkActiveGroupCall: (groupId: string) => Promise<boolean>;
  startGroupCall: (groupId: string) => Promise<void>;
  joinGroupCall: (groupId: string) => Promise<any[]>;
  leaveGroupCall: (groupId: string) => Promise<void>;
  sendGroupOffer: (targetConnectionId: string, sdp: string, groupId: string) => Promise<void>;
  sendGroupAnswer: (targetConnectionId: string, sdp: string, groupId: string) => Promise<void>;
  sendGroupIce: (targetConnectionId: string, candidate: object, groupId: string) => Promise<void>;

  setOnGroupCallStarted: (cb: (groupId: string, callerId: string, callerName: string) => void) => void;
  setOnGroupCallEnded: (cb: (groupId: string) => void) => void;
  setOnUserJoinedGroupCall: (cb: (groupId: string, userId: string, connectionId: string, name?: string) => void) => void;
  setOnUserLeftGroupCall: (cb: (groupId: string, userId: string, connectionId: string) => void) => void;
  setOnReceiveGroupOffer: (cb: (callerId: string, callerConnectionId: string, sdp: string, groupId: string) => void) => void;
  setOnReceiveGroupAnswer: (cb: (callerId: string, callerConnectionId: string, sdp: string, groupId: string) => void) => void;
  setOnReceiveGroupIce: (cb: (callerId: string, callerConnectionId: string, candidate: object, groupId: string) => void) => void;

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
      return await globalConnection.invoke(method, ...args);
    }
  }, []);

  return {
    isConnected,
    incomingCall,
    sendMessage: async (targetId, content, messageType = "Text", isGroup = false) => {
      await invoke("SendMessage", targetId, content, messageType, isGroup);
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
    setOnCallEnded: (cb) => { onCallEndedCb = cb; },
    setOnCallRejected: (cb) => { onCallRejectedCb = cb; },
    
    // Group Call Setters
    setOnGroupCallStarted: (cb) => { onGroupCallStartedCb = cb; },
    setOnGroupCallEnded: (cb) => { onGroupCallEndedCb = cb; },
    setOnUserJoinedGroupCall: (cb) => { onUserJoinedGroupCallCb = cb; },
    setOnUserLeftGroupCall: (cb) => { onUserLeftGroupCallCb = cb; },
    setOnReceiveGroupOffer: (cb) => { onReceiveGroupOfferCb = cb; },
    setOnReceiveGroupAnswer: (cb) => { onReceiveGroupAnswerCb = cb; },
    setOnReceiveGroupIce: (cb) => { onReceiveGroupIceCb = cb; },

    sendTypingStarted: (targetId) => invoke("TypingStarted", targetId),
    sendTypingEnded: (targetId) => invoke("TypingEnded", targetId),
    sendMarkMessageSeen: (targetId, messageId) => invoke("MarkMessageSeen", targetId, messageId),
    createGroup: (name, memberIds) => invoke("CreateGroup", name, memberIds),
    
    // Group Call Methods
    checkActiveGroupCall: (groupId) => invoke("CheckActiveGroupCall", groupId) as Promise<boolean>,
    startGroupCall: (groupId) => invoke("StartGroupCall", groupId),
    joinGroupCall: (groupId) => invoke("JoinGroupCall", groupId) as Promise<any[]>,
    leaveGroupCall: (groupId) => invoke("LeaveGroupCall", groupId),
    sendGroupOffer: (targetConnectionId, sdp, groupId) => invoke("SendGroupOffer", targetConnectionId, sdp, groupId),
    sendGroupAnswer: (targetConnectionId, sdp, groupId) => invoke("SendGroupAnswer", targetConnectionId, sdp, groupId),
    sendGroupIce: (targetConnectionId, candidate, groupId) => invoke("SendGroupIce", targetConnectionId, candidate, groupId),

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
