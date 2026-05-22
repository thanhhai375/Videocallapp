import { create } from 'zustand';
import { User } from '../types';

interface UserState {
  users: User[];
  setUsers: (users: User[]) => void;
  updateUserStatus: (userId: string, isOnline: boolean, connectionId: string | null) => void;
  getUserById: (userId: string) => User | undefined;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  setUsers: (users) => set({ users }),
  updateUserStatus: (userId, isOnline, connectionId) => 
    set((state) => ({
      users: state.users.map((u) => 
        u.id === userId ? { ...u, isOnline, connectionId } : u
      ),
    })),
  getUserById: (userId) => get().users.find((u) => u.id === userId),
}));
