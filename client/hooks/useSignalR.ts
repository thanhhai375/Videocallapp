import * as signalR from "@microsoft/signalr";
import { useEffect, useRef, useState, useCallback } from "react";
import { HUB_URL } from "../constants/config";

export interface Friend {
  id: string;
  name: string;
  isOnline: boolean;
  connectionId: string | null;
}

export interface ChatMessage {
  senderId: string;
  content: string;
}

export interface IncomingCall {
  callerConnectionId: string;
  callerName: string;
}

interface UseSignalRReturn {
  isConnected: boolean;
  friends: Friend[];
  messages: ChatMessage[];
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
  disconnect: () => Promise<void>;
}

export function useSignalR(token: string | null): UseSignalRReturn {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

    // --- Lắng nghe events từ server ---

    connection.on("LoadFriends", (data: Friend[]) => {
      setFriends(data);
    });

    connection.on("UserStatusChanged", (userId: string, isOnline: boolean, connectionId: string | null) => {
      setFriends((prev) =>
        prev.map((f) => (f.id === userId ? { ...f, isOnline, connectionId } : f))
      );
    });

    connection.on("ReceiveMessage", (senderId: string, content: string) => {
      setMessages((prev) => [...prev, { senderId, content }]);
    });

    connection.on("LoadChatHistory", (history: ChatMessage[]) => {
      setMessages(history);
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

    connection.on("ReceiveOffer", (callerId: string, sdp: string) => {
      onReceiveOfferRef.current?.(callerId, sdp);
    });

    connection.on("ReceiveAnswer", (sdp: string) => {
      onReceiveAnswerRef.current?.(sdp);
    });

    connection.on("ReceiveIce", (candidate: object) => {
      onReceiveIceRef.current?.(candidate);
    });

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
  }, [token]);

  const invoke = useCallback(async (method: string, ...args: unknown[]) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke(method, ...args);
    }
  }, []);

  return {
    isConnected,
    friends,
    messages,
    incomingCall,
    sendMessage: (targetId, content) => invoke("SendMessage", targetId, content),
    getChatHistory: (targetId) => invoke("GetChatHistory", targetId),
    callFriend: (targetConnectionId) => invoke("CallFriend", targetConnectionId),
    acceptCall: (callerConnectionId) => invoke("AcceptCall", callerConnectionId),
    rejectCall: (callerConnectionId) => invoke("RejectCall", callerConnectionId),
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
    disconnect: async () => {
      await connectionRef.current?.stop();
      setIsConnected(false);
    },
  };
}
