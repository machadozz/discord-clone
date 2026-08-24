import { create } from 'zustand';
import api from '../lib/axios';

interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  inviteCode: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE';
}

interface ServerMember {
  id: string;
  role: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string | null;
  }
}

interface ServerState {
  servers: Server[];
  activeServer: Server | null;
  channels: Channel[];
  members: ServerMember[];
  activeChannel: Channel | null;
  
  fetchServers: () => Promise<void>;
  setActiveServer: (server: Server | null) => void;
  fetchChannels: (serverId: string, initialChannelId?: string) => Promise<void>;
  setActiveChannel: (channel: Channel | null) => void;
  createServer: (name: string) => Promise<Server | any>;
  joinServer: (inviteCode: string) => Promise<Server | any>;
  leaveServer: (serverId: string) => Promise<void>;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  activeServer: null,
  channels: [],
  members: [],
  activeChannel: null,

  fetchServers: async () => {
    try {
      const res = await api.get('/servers');
      set({ servers: res.data || [] });
    } catch (error) {
      console.error('Erro ao buscar servidores', error);
    }
  },

  setActiveServer: (server) => {
    set({ activeServer: server, activeChannel: null, channels: [] });
    if (server && server.id) {
      localStorage.setItem('pulse_active_server_id', server.id);
      get().fetchChannels(server.id);
    } else {
      localStorage.removeItem('pulse_active_server_id');
      localStorage.removeItem('pulse_active_channel_id');
    }
  },

  fetchChannels: async (serverId, initialChannelId) => {
    try {
      const res = await api.get(`/servers/${serverId}`);
      const channels: Channel[] = res.data.channels || [];
      const members = res.data.members || [];
      set({ channels, members });
      
      const targetId = initialChannelId || localStorage.getItem('pulse_active_channel_id');
      const matchedChannel = channels.find((c) => c.id === targetId);

      if (matchedChannel) {
        set({ activeChannel: matchedChannel });
      } else {
        const firstTextChannel = channels.find((c: Channel) => c.type === 'TEXT') || channels[0];
        if (firstTextChannel) {
          set({ activeChannel: firstTextChannel });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar canais', error);
    }
  },

  setActiveChannel: (channel) => {
    set({ activeChannel: channel });
    if (channel && channel.id) {
      localStorage.setItem('pulse_active_channel_id', channel.id);
    } else {
      localStorage.removeItem('pulse_active_channel_id');
    }
  },

  createServer: async (name: string) => {
    try {
      const res = await api.post('/servers', { name });
      await get().fetchServers();
      const newServer = res.data;
      if (newServer && newServer.id) {
        get().setActiveServer(newServer);
      }
      return newServer;
    } catch (error) {
      console.error('Erro ao criar servidor', error);
      throw error;
    }
  },

  joinServer: async (inviteCode: string) => {
    try {
      const res = await api.post('/servers/join', { inviteCode });
      await get().fetchServers();
      const joinedServer = res.data;
      if (joinedServer && joinedServer.id) {
        get().setActiveServer(joinedServer);
      }
      return joinedServer;
    } catch (error) {
      console.error('Erro ao entrar no servidor', error);
      throw error;
    }
  },

  leaveServer: async (serverId: string) => {
    try {
      await api.post(`/servers/${serverId}/leave`);
      set((state) => ({
        servers: state.servers.filter((s) => s.id !== serverId),
        activeServer: state.activeServer?.id === serverId ? null : state.activeServer,
      }));
    } catch (error) {
      console.error('Erro ao sair do servidor', error);
    }
  }
}));
