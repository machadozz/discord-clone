import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useServerStore } from '../../store/useServerStore';
import { Radio, PhoneOff, Maximize2, Mic, MicOff } from 'lucide-react';

export function PulseActiveCallDock() {
  const { connectedChannelId, leaveVoiceChannel } = useVoiceStore();
  const { channels = [], activeServer } = useServerStore();
  const navigate = useNavigate();

  const [isMuted, setIsMuted] = useState(false);

  if (!connectedChannelId) return null;

  // Safe channel lookup
  const currentChannel = (channels || []).find((c) => c?.id === connectedChannelId);
  const channelName = currentChannel?.name || 'Chamada de Voz';

  const handleReturnToCall = () => {
    if (activeServer && currentChannel) {
      navigate(`/app/${activeServer.id}/${currentChannel.id}`);
    } else {
      navigate('/app/@me');
    }
  };

  return (
    <div className="fixed bottom-4 right-6 z-50 animate-fade-in-zoom select-none">
      <div className="pulse-glass-card bg-[#090D12]/95 border border-[#10B981]/40 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-4 backdrop-blur-xl">
        {/* Pulsing indicator & Channel name */}
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#10B981] opacity-75"></span>
            <Radio size={16} className="text-[#10B981] relative z-10" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">Voz em Segundo Plano</div>
            <div className="text-xs font-extrabold text-white truncate max-w-[140px]">{channelName}</div>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-white/10"></div>

        {/* Quick Voice Controls */}
        <div className="flex items-center space-x-2">
          {/* Mic Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl text-xs font-semibold transition cursor-pointer btn-motion ${
              isMuted ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' : 'bg-[#121820] text-[#8B949E] hover:text-white'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          {/* Jump Back to Voice Stage */}
          <button
            onClick={handleReturnToCall}
            className="bg-[#10B981] hover:bg-[#059669] text-black font-extrabold text-xs px-3 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer btn-motion"
            title="Voltar para a tela cheia da chamada"
          >
            <Maximize2 size={14} />
            <span>Ver Chamada</span>
          </button>

          {/* Disconnect Call */}
          <button
            onClick={leaveVoiceChannel}
            className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white p-2 rounded-xl text-xs font-semibold transition cursor-pointer btn-motion"
            title="Desconectar da chamada"
          >
            <PhoneOff size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
