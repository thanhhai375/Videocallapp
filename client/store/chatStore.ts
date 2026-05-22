import { create } from 'zustand';
import { Message } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  // Key: other user's ID, Value: array of messages with that user
  messagesByUserId: Record<string, Message[]>;
  
  // Add a message received from or sent to a specific user
  addMessage: (otherUserId: string, message: Omit<Message, 'id' | 'timestamp'> & { timestamp?: number }) => void;
  
  // Set the entire chat history for a specific user
  setHistory: (otherUserId: string, history: Omit<Message, 'id'>[]) => void;
  
  // Get messages for a specific user
  getMessages: (otherUserId: string) => Message[];
  
  // Get the last message for a specific user (useful for conversation list)
  getLastMessage: (otherUserId: string) => Message | undefined;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByUserId: {},
  
  addMessage: (otherUserId, message) => 
    set((state) => {
      const existingMessages = state.messagesByUserId[otherUserId] || [];
      const newMessage: Message = {
        ...message,
        id: uuidv4(),
        timestamp: message.timestamp || Date.now(),
      };
      
      return {
        messagesByUserId: {
          ...state.messagesByUserId,
          [otherUserId]: [...existingMessages, newMessage],
        },
      };
    }),
    
  setHistory: (otherUserId, history) => 
    set((state) => {
      // Map history items to full Message objects (adding UUIDs)
      const fullHistory: Message[] = history.map(h => ({
        ...h,
        id: uuidv4(),
      }));
      
      return {
        messagesByUserId: {
          ...state.messagesByUserId,
          [otherUserId]: fullHistory,
        },
      };
    }),
    
  getMessages: (otherUserId) => get().messagesByUserId[otherUserId] || [],
  
  getLastMessage: (otherUserId) => {
    const msgs = get().messagesByUserId[otherUserId];
    if (!msgs || msgs.length === 0) return undefined;
    return msgs[msgs.length - 1];
  },
}));
