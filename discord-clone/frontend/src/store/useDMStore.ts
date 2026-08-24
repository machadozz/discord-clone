import { create } from 'zustand';
import api from '../lib/axios';
import { getSocket } from '../lib/socket';

export interface DMConversation {
  id: string;
  participant?: any;
  participants?: any[];
  messages?: any[];
}

interface DMState {
  conversations: DMConversation[];
  activeDM: DMConversation | null;
  activeDMMessages: any[];
  
  fetchConversations: () => Promise<void>;
  startConversation: (targetUserId: string) => Promise<DMConversation | null>;
  fetchActiveDM: (dmId: string) => Promise<void>;
  sendMessage: (dmId: string, content: string) => Promise<void>;
  initializeSocketListeners: () => void;
}

export const useDMStore = create<DMState>((set, get) => ({
  conversations: [],
  activeDM: null,
  activeDMMessages: [],

  fetchConversations: async () => {
    try {
      const res = await api.get('/dms');
      set({ conversations: res.data || [] });
    } catch (error) {
      console.error('Failed to fetch DMs', error);
    }
  },

  startConversation: async (targetUserId: string) => {
    try {
      const res = await api.post('/dms', { userId: targetUserId });
      const conv = res.data;
      await get().fetchConversations();
      set({ activeDM: conv });
      return conv;
    } catch (error) {
      console.error('Failed to start conversation', error);
      return null;
    }
  },

  fetchActiveDM: async (dmId: string) => {
    try {
      const res = await api.get(`/dms/${dmId}/messages`);
      set({ activeDMMessages: res.data || [] });
    } catch (error) {
      console.error('Failed to fetch DM messages', error);
    }
  },

  sendMessage: async (dmId: string, content: string) => {
    try {
      const res = await api.post(`/dms/${dmId}/messages`, { content });
      const newMsg = res.data;

      // Add message to state deduplicating by message ID
      set((state) => ({
        activeDMMessages: state.activeDMMessages.some((m) => m.id === newMsg.id)
          ? state.activeDMMessages
          : [...state.activeDMMessages, newMsg],
      }));
    } catch (error) {
      console.error('Failed to send DM', error);
      throw error;
    }
  },

  initializeSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('dm:new');
    socket.on('dm:new', ({ conversationId, message }: any) => {
      const { activeDM } = get();
      if (activeDM && activeDM.id === conversationId && message) {
        set((state) => ({
          activeDMMessages: state.activeDMMessages.some((m) => m.id === message.id)
            ? state.activeDMMessages
            : [...state.activeDMMessages, message],
        }));
      }
      get().fetchConversations();
    });
  }
}));
