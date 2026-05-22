// ─── User ───────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  isOnline: boolean;
  connectionId: string | null;
}

// ─── Message ─────────────────────────────────────────────
export interface Message {
  id: string;           // uuid for dedup
  senderId: string;
  content: string;
  timestamp: number;    // Date.now()
  isSeen?: boolean;     // Trạng thái đã xem
}

// ─── Incoming Call ────────────────────────────────────────
export interface IncomingCall {
  callerConnectionId: string;
  callerName: string;
}

// ─── Nav Params ──────────────────────────────────────────
export interface ChatRouteParams {
  userId: string;
  userName: string;
  connectionId: string;
}
