import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServerStore } from '../../store/useServerStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useUIStore } from '../../store/useUIStore';
import { 
  Hash, Volume2, Plus, ChevronDown, UserPlus, 
  Settings, LogOut, Radio, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export function PulseChannelSidebar() {
  const { serverId, channelId } = useParams();
  const { servers, activeServer: activeSpace, channels, activeChannel, setActiveServer, fetchChannels, setActiveChannel, leaveServer } = useServerStore();
  const { channelMembers, connectedChannelId, joinVoiceChannel } = useVoiceStore();
  const { openModal } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Keep activeServer and activeChannel synced with URL parameters
  useEffect(() => {
    if (serverId && servers.length > 0) {
      if (!activeSpace || activeSpace.id !== serverId) {
        const matchedServer = servers.find((s) => s.id === serverId);
        if (matchedServer) {
          setActiveServer(matchedServer);
        }
      }
    }
  }, [serverId, servers, activeSpace, setActiveServer]);

  useEffect(() => {
    if (serverId && channels.length > 0 && channelId) {
      const matchedChannel = channels.find((c) => c.id === channelId);
      if (matchedChannel && activeChannel?.id !== matchedChannel.id) {
        setActiveChannel(matchedChannel);
      }
    }
  }, [serverId, channelId, channels, activeChannel, setActiveChannel]);

  if (!activeSpace && !serverId) {
    return (
      <aside className="w-64 pulse-glass border-r border-white/5 flex flex-col h-full select-none">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers size={16} className="text-[#10B981]" />
            <span className="font-bold text-sm text-white">Mensagens Privadas</span>
          </div>
        </div>
        <div className="p-4 text-xs text-[#8B949E] text-center">
          Selecione uma conversa ou amigo para iniciar o chat.
        </div>
      </aside>
    );
  }

  const currentSpace = activeSpace || servers.find((s) => s.id === serverId);
  const textChannels = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type === 'VOICE');

  const handleCopyInvite = () => {
    if (currentSpace?.inviteCode) {
      navigator.clipboard.writeText(currentSpace.inviteCode);
      toast.success('Código de convite copiado!');
    }
    setIsMenuOpen(false);
  };

  const handleLeaveSpace = async () => {
    if (currentSpace && confirm(`Deseja sair do espaço ${currentSpace.name}?`)) {
      await leaveServer(currentSpace.id);
      toast.success('Você saiu do espaço');
    }
    setIsMenuOpen(false);
  };

  // Text Channel Click
  const handleSelectTextChannel = (channel: any) => {
    if (!currentSpace) return;
    setActiveChannel(channel);
    navigate(`/app/${currentSpace.id}/${channel.id}`);
  };

  // Voice Channel Single Click (Selects channel and shows preview screen with "Entrar na chamada")
  const handleSelectVoiceChannel = (channel: any) => {
    if (!currentSpace) return;
    setActiveChannel(channel);
    navigate(`/app/${currentSpace.id}/${channel.id}`);
  };

  // Voice Channel Double Click (Bypasses preview screen and joins call directly)
  const handleDoubleClickVoiceChannel = (channel: any) => {
    if (!currentSpace) return;
    setActiveChannel(channel);
    navigate(`/app/${currentSpace.id}/${channel.id}`);
    joinVoiceChannel(channel.id);
  };

  return (
    <aside className="w-64 pulse-glass border-r border-white/5 flex flex-col h-full select-none relative z-30">
      {/* Space Header & Dropdown */}
      <div
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="h-14 px-4 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm shadow-emerald-500"></div>
          <span className="font-bold text-sm text-white truncate">{currentSpace?.name || 'Carregando...'}</span>
        </div>
        <ChevronDown size={16} className={`text-[#8B949E] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Space Action Dropdown */}
      {isMenuOpen && currentSpace && (
        <div className="absolute top-16 left-3 right-3 pulse-glass-card rounded-xl p-2 shadow-2xl z-50 space-y-1">
          <button
            onClick={handleCopyInvite}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#10B981] hover:bg-[#10B981]/10 rounded-lg transition cursor-pointer"
          >
            <span>Convidar Membros</span>
            <UserPlus size={14} />
          </button>
          <button
            onClick={() => {
              openModal('createChannel', { type: 'TEXT' });
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#8B949E] hover:bg-white/5 hover:text-white rounded-lg transition cursor-pointer"
          >
            <span>Criar Canal</span>
            <Plus size={14} />
          </button>
          <button
            onClick={() => {
              openModal('serverSettings', { server: currentSpace });
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#8B949E] hover:bg-white/5 hover:text-white rounded-lg transition cursor-pointer"
          >
            <span>Configurações do Espaço</span>
            <Settings size={14} />
          </button>
          <div className="h-[1px] bg-white/5 my-1"></div>
          <button
            onClick={handleLeaveSpace}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
          >
            <span>Sair do Espaço</span>
            <LogOut size={14} />
          </button>
        </div>
      )}

      {/* Channel Categories & List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* CANAIS DE TEXTO */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2 group">
            <span className="text-[11px] font-bold tracking-wider text-[#8B949E] uppercase flex items-center gap-1.5">
              <Hash size={12} className="text-[#10B981]" /> Canais de Texto
            </span>
            <button
              onClick={() => openModal('createChannel', { type: 'TEXT' })}
              className="text-[#8B949E] hover:text-white transition p-1 hover:bg-white/10 rounded-md cursor-pointer"
              title="Novo canal de texto"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1">
            {textChannels.map((channel) => {
              const isActive = (activeChannel?.id === channel.id) || (channelId === channel.id);
              return (
                <div
                  key={channel.id}
                  onClick={() => handleSelectTextChannel(channel)}
                  className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition text-xs font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-[#10B981]/20 to-transparent text-white border-l-2 border-[#10B981]'
                      : 'text-[#8B949E] hover:bg-white/5 hover:text-[#F0F6FC]'
                  }`}
                >
                  <Hash size={15} className={`mr-2.5 ${isActive ? 'text-[#10B981]' : 'opacity-60'}`} />
                  <span className="truncate">{channel.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* VOICE & VIDEO SALAS */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2 group">
            <span className="text-[11px] font-bold tracking-wider text-[#8B949E] uppercase flex items-center gap-1.5">
              <Radio size={12} className="text-cyan-400" /> Salas de Voz & Vídeo
            </span>
            <button
              onClick={() => openModal('createChannel', { type: 'VOICE' })}
              className="text-[#8B949E] hover:text-white transition p-1 hover:bg-white/10 rounded-md cursor-pointer"
              title="Nova sala de voz"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1">
            {voiceChannels.map((channel) => {
              const isActive = (activeChannel?.id === channel.id) || (channelId === channel.id);
              const isConnected = connectedChannelId === channel.id;
              const members = channelMembers[channel.id] || [];

              return (
                <div key={channel.id}>
                  <div
                    onClick={() => handleSelectVoiceChannel(channel)}
                    onDoubleClick={() => handleDoubleClickVoiceChannel(channel)}
                    title="Clique simples: abrir prévia / Clique duplo: entrar direto"
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition text-xs font-medium ${
                      isActive || isConnected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-white border-l-2 border-cyan-400'
                        : 'text-[#8B949E] hover:bg-white/5 hover:text-[#F0F6FC]'
                    }`}
                  >
                    <div className="flex items-center min-w-0">
                      <Volume2 size={15} className={`mr-2.5 ${isConnected ? 'text-cyan-400 animate-pulse' : 'opacity-60'}`} />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {members.length > 0 && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded-full">
                        {members.length}
                      </span>
                    )}
                  </div>

                  {/* Connected Members */}
                  {members.length > 0 && (
                    <div className="ml-7 my-1 space-y-1 pl-2 border-l border-white/5">
                      {members.map((m, index) => (
                        <div key={m.userId || `member-${index}`} className="flex items-center space-x-2 text-[11px] text-[#8B949E] py-0.5">
                          <div className="w-4 h-4 rounded-full bg-[#10B981] text-black font-bold flex items-center justify-center text-[9px]">
                            {m.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate">{m.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
