import { useEffect } from 'react';
import { PulseLayout } from '../components/pulse/PulseLayout';
import { useVoiceStore } from '../store/useVoiceStore';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

export function Dashboard() {
  const { updateChannelMembers } = useVoiceStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleVoiceUpdate = ({ channelId, members }: { channelId: string, members: any[] }) => {
      updateChannelMembers(channelId, members);
    };

    const handleNotification = (data: { type: string, message: string }) => {
      toast(data.message, { icon: data.type === 'mention' ? '🔔' : '👋' });
    };

    socket.on('voice:update', handleVoiceUpdate);
    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('voice:update', handleVoiceUpdate);
      socket.off('notification:new', handleNotification);
    };
  }, [updateChannelMembers]);

  return <PulseLayout />;
}
