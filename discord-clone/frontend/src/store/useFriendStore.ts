import { create } from 'zustand';
import api from '../lib/axios';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatarUrl: string | null;
  status?: string;
}

export interface Friendship {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  initiator: User;
  receiver: User;
  friendshipId?: string;
  friend?: User;
}

interface FriendState {
  friendships: Friendship[];
  friends: any[];
  pending: any[];
  
  fetchFriendships: () => Promise<void>;
  sendFriendRequest: (username: string, discriminator?: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  declineFriendRequest: (friendshipId: string) => Promise<void>;
  initializeSocketListeners: () => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friendships: [],
  friends: [],
  pending: [],

  fetchFriendships: async () => {
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        api.get('/friends').catch(() => ({ data: [] })),
        api.get('/friends/pending').catch(() => ({ data: [] })),
      ]);
      set({ friends: friendsRes.data, pending: pendingRes.data });
    } catch (error) {
      console.error('Failed to fetch friends', error);
    }
  },

  sendFriendRequest: async (username, discriminator = '0000') => {
    try {
      await api.post('/friends/request', { username, discriminator });
      
      // Also emit via WebSocket so receiver room gets immediate notification
      const socket = getSocket();
      if (socket) {
        socket.emit('friend:request', { username, discriminator });
      }

      await get().fetchFriendships();
      toast.success(`Pedido de amizade enviado para ${username}!`);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao enviar pedido de amizade';
      toast.error(msg);
      throw error;
    }
  },

  acceptFriendRequest: async (friendshipId) => {
    try {
      await api.post(`/friends/${friendshipId}/respond`, { accept: true });
      await get().fetchFriendships();
      toast.success('Pedido de amizade aceito!');
    } catch (error) {
      console.error('Failed to accept request', error);
    }
  },

  declineFriendRequest: async (friendshipId) => {
    try {
      await api.post(`/friends/${friendshipId}/respond`, { accept: false });
      await get().fetchFriendships();
      toast.success('Pedido recusado.');
    } catch (error) {
      console.error('Failed to decline request', error);
    }
  },

  initializeSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('friend:request_received');
    socket.off('friend:request:received');
    socket.off('friend:request_accepted');
    socket.off('friend:accepted');
    socket.off('notification:new');

    const handleFriendUpdate = () => {
      get().fetchFriendships();
    };

    socket.on('friend:request_received', handleFriendUpdate);
    socket.on('friend:request:received', (data: any) => {
      handleFriendUpdate();
      const senderName = data?.from?.username || 'Um usuário';
      toast.success(`🎉 Novo pedido de amizade de ${senderName}!`, { duration: 5000 });
    });
    socket.on('friend:request_accepted', handleFriendUpdate);
    socket.on('friend:accepted', (data: any) => {
      handleFriendUpdate();
      toast.success(`🎉 Seu pedido de amizade foi aceito!`, { duration: 5000 });
    });
    socket.on('notification:new', (data: any) => {
      if (data?.message) {
        toast(data.message, { icon: '🔔' });
      }
      handleFriendUpdate();
    });
  }
}));
