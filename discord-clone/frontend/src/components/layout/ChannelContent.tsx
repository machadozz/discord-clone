import { useParams } from 'react-router-dom';
import { PulseChatArea } from '../pulse/PulseChatArea';
import { PulseVoiceStage } from '../pulse/PulseVoiceStage';
import { useServerStore } from '../../store/useServerStore';

export function ChannelContent() {
  const { channelId } = useParams();
  const { channels } = useServerStore();
  
  const currentChannel = channels.find((c) => c.id === channelId);

  if (!currentChannel) {
    return (
      <div className="flex-1 bg-[#090D12] flex items-center justify-center text-[#8B949E] text-xs">
        Selecione um canal para visualizar a conversa.
      </div>
    );
  }

  if (currentChannel.type === 'VOICE') {
    return <PulseVoiceStage />;
  }

  return <PulseChatArea />;
}
