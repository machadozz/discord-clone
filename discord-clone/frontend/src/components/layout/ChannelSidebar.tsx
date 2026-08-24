import { useState } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useUIStore } from '../../store/useUIStore';
import { Hash, Volume2, Plus, ChevronDown, UserPlus, Settings, PlusCircle, LogOut } from 'lucide-react';
import { UserFooter } from './UserFooter';
import toast from 'react-hot-toast';

export function ChannelSidebar() {
  const { activeServer, channels, activeChannel, setActiveChannel, leaveServer } = useServerStore();
  const { user } = useAuthStore();
  const { channelMembers, connectedChannelId } = useVoiceStore();
  const { openModal } = useUIStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!activeServer) {
    return (
      <div className="w-60 bg-discord-darker flex flex-col h-screen select-none">
        <div className="h-12 shadow-sm border-b border-black/20 flex items-center px-4 font-bold text-white">
          Direct Messages
        </div>
        <div className="flex-1 p-2"></div>
        <UserFooter />
      </div>
    );
  }

  const textChannels = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type === 'VOICE');

  const handleCopyInvite = () => {
    if (activeServer.inviteCode) {
      navigator.clipboard.writeText(activeServer.inviteCode);
      toast.success('Código de convite copiado!');
    } else {
      toast.error('Código de convite indisponível');
    }
    setIsMenuOpen(false);
  };

  const handleLeaveServer = async () => {
    if (confirm(`Tem certeza que deseja sair de ${activeServer.name}?`)) {
      await leaveServer(activeServer.id);
      toast.success('Você saiu do servidor');
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="w-60 bg-discord-darker flex flex-col h-screen select-none relative">
      {/* Server Header */}
      <div
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="h-12 shadow-sm border-b border-black/20 flex items-center justify-between px-4 font-bold text-white hover:bg-discord-hover cursor-pointer transition select-none relative"
      >
        <span className="truncate">{activeServer.name}</span>
        <ChevronDown size={18} className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Server Header Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-14 left-2 right-2 bg-[#111214] rounded-md p-1.5 shadow-2xl z-50 border border-white/5 space-y-1">
          <button
            onClick={handleCopyInvite}
            className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-discord-blurple hover:bg-discord-blurple hover:text-white rounded cursor-pointer transition"
          >
            <span>Convidar pessoas</span>
            <UserPlus size={14} />
          </button>
          <button
            onClick={() => {
              openModal('createChannel');
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-discord-textMuted hover:bg-discord-hover hover:text-white rounded cursor-pointer transition"
          >
            <span>Criar canal</span>
            <PlusCircle size={14} />
          </button>
          <button
            onClick={() => {
              openModal('serverSettings');
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-discord-textMuted hover:bg-discord-hover hover:text-white rounded cursor-pointer transition"
          >
            <span>Configurações do servidor</span>
            <Settings size={14} />
          </button>
          <div className="h-[1px] bg-white/10 my-1"></div>
          <button
            onClick={handleLeaveServer}
            className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-discord-red hover:bg-discord-red hover:text-white rounded cursor-pointer transition"
          >
            <span>Sair do servidor</span>
            <LogOut size={14} />
          </button>
        </div>
      )}

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* TEXT CHANNELS */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1 group">
            <h3 className="text-xs font-bold text-discord-textMuted group-hover:text-discord-textNormal cursor-pointer flex items-center">
              <span className="mr-1 text-[10px]">▼</span> CANAIS DE TEXTO
            </h3>
            <button
              onClick={() => openModal('createChannel', { type: 'TEXT' })}
              title="Criar canal de texto"
              className="text-discord-textMuted hover:text-white transition"
            >
              <Plus size={16} />
            </button>
          </div>
          {textChannels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`flex items-center px-2 py-1.5 rounded cursor-pointer group ${
                activeChannel?.id === channel.id
                  ? 'bg-discord-hover text-white'
                  : 'text-discord-textMuted hover:bg-discord-hover hover:text-discord-textNormal'
              }`}
            >
              <Hash size={18} className="mr-2 opacity-70" />
              <span className="font-medium text-sm truncate">{channel.name}</span>
            </div>
          ))}
        </div>

        {/* VOICE CHANNELS */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1 mt-4 group">
            <h3 className="text-xs font-bold text-discord-textMuted group-hover:text-discord-textNormal cursor-pointer flex items-center">
              <span className="mr-1 text-[10px]">▼</span> CANAIS DE VOZ
            </h3>
            <button
              onClick={() => openModal('createChannel', { type: 'VOICE' })}
              title="Criar canal de voz"
              className="text-discord-textMuted hover:text-white transition"
            >
              <Plus size={16} />
            </button>
          </div>
          {voiceChannels.map((channel) => (
            <div key={channel.id}>
              <div
                onClick={() => setActiveChannel(channel)}
                className={`flex items-center px-2 py-1.5 rounded cursor-pointer group ${
                  activeChannel?.id === channel.id || connectedChannelId === channel.id
                    ? 'bg-discord-hover text-white'
                    : 'text-discord-textMuted hover:bg-discord-hover hover:text-discord-textNormal'
                }`}
              >
                <Volume2 size={18} className="mr-2 opacity-70" />
                <span className="font-medium text-sm truncate">{channel.name}</span>
              </div>

              {/* Voice Connected Members */}
              {channelMembers[channel.id] && channelMembers[channel.id].length > 0 && (
                <div className="ml-6 mt-1 mb-2 space-y-1">
                  {channelMembers[channel.id].map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center space-x-2 text-discord-textMuted hover:text-discord-textNormal cursor-pointer rounded hover:bg-discord-hover px-2 py-1"
                    >
                      <div className="w-5 h-5 rounded-full bg-discord-blurple flex items-center justify-center text-white text-[10px] shrink-0">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} className="w-full h-full rounded-full" alt="Avatar" />
                        ) : (
                          member.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs truncate font-medium">{member.username}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Footer */}
      <UserFooter />
    </div>
  );
}
