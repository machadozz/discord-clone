import { create } from 'zustand';
import api from '../lib/axios';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface ChatState {
  messages: Message[];
  typingUsers: { [channelId: string]: string[] }; // users typing mapped by channel
  fetchMessages: (channelId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  setTyping: (channelId: string, username: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  typingUsers: {},

  fetchMessages: async (channelId) => {
    try {
      const res = await api.get(`/channels/${channelId}/messages`);
      set({ messages: res.data });
    } catch (error) {
      console.error('Erro ao buscar mensagens', error);
    }
  },

  addMessage: (message) => {
    set((state) => {
      // Evita duplicação se a mensagem já estiver lá
      if (state.messages.some(m => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    });
  },

  setTyping: (channelId, username, isTyping) => {
    set((state) => {
      const channelTyping = state.typingUsers[channelId] || [];
      const newChannelTyping = isTyping 
        ? [...new Set([...channelTyping, username])]
        : channelTyping.filter(u => u !== username);
        
      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: newChannelTyping
        }
      };
    });
  }
}));
