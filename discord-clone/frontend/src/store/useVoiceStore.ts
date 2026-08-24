import { create } from 'zustand';
import api from '../lib/axios';
import { getSocket } from '../lib/socket';

interface VoiceMember {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export interface AudioSettings {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  audioMode: 'voice' | 'hifi';
  inputDeviceId: string;
  outputDeviceId: string;
  micSensitivity: number; // -100 to 0 dB
}

interface VoiceState {
  connectedChannelId: string | null;
  voiceToken: string | null;
  livekitUrl: string | null;
  channelMembers: { [channelId: string]: VoiceMember[] };
  
  // Audio Settings
  audioSettings: AudioSettings;
  updateAudioSettings: (newSettings: Partial<AudioSettings>) => void;

  joinVoiceChannel: (channelId: string) => Promise<void>;
  joinDMVoice: (dmId: string) => Promise<void>;
  leaveVoiceChannel: () => void;
  updateChannelMembers: (channelId: string, members: VoiceMember[]) => void;
}

const getInitialAudioSettings = (): AudioSettings => {
  try {
    const saved = localStorage.getItem('discordia_audio_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Falha ao carregar audio settings:', e);
  }
  return {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    audioMode: 'voice',
    inputDeviceId: 'default',
    outputDeviceId: 'default',
    micSensitivity: -50,
  };
};

export const useVoiceStore = create<VoiceState>((set, get) => ({
  connectedChannelId: null,
  voiceToken: null,
  livekitUrl: null,
  channelMembers: {},

  audioSettings: getInitialAudioSettings(),

  updateAudioSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.audioSettings, ...newSettings };
      try {
        localStorage.setItem('discordia_audio_settings', JSON.stringify(updated));
      } catch (e) {
        console.warn('Falha ao salvar audio settings:', e);
      }
      return { audioSettings: updated };
    });
  },

  joinVoiceChannel: async (channelId: string) => {
    try {
      const res = await api.post(`/channels/${channelId}/voice/token`);
      const { token, url } = res.data;

      set({ connectedChannelId: channelId, voiceToken: token, livekitUrl: url });

      const socket = getSocket();
      if (socket) {
        socket.emit('voice:join', { channelId });
      }
    } catch (error) {
      console.error('Erro ao entrar no canal de voz:', error);
    }
  },

  joinDMVoice: async (dmId: string) => {
    try {
      const res = await api.post(`/dms/${dmId}/voice/token`);
      const { token, url } = res.data;

      set({ connectedChannelId: dmId, voiceToken: token, livekitUrl: url });

      const socket = getSocket();
      if (socket) {
        socket.emit('voice:join', { channelId: dmId });
      }
    } catch (error) {
      console.error('Erro ao entrar na chamada privada:', error);
    }
  },

  leaveVoiceChannel: () => {
    const { connectedChannelId } = get();
    if (connectedChannelId) {
      const socket = getSocket();
      if (socket) {
        socket.emit('voice:leave', { channelId: connectedChannelId });
      }
    }
    set({ connectedChannelId: null, voiceToken: null, livekitUrl: null });
  },

  updateChannelMembers: (channelId, members) => {
    set((state) => ({
      channelMembers: {
        ...state.channelMembers,
        [channelId]: members,
      }
    }));
  }
}));
