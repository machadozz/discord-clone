import { Mic, MicOff, Headphones, Settings, ChevronDown, Music, PhoneOff, Signal } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useServerStore } from '../../store/useServerStore';
import { useUIStore } from '../../store/useUIStore';

export function UserFooter() {
  const { user } = useAuthStore();
  const { isMuted, isDeafened, toggleMute, toggleDeafen, connectedChannelId, leaveVoiceChannel } = useVoiceStore();
  const { channels } = useServerStore();
  const { openModal } = useUIStore();

  if (!user) return null;

  const connectedChannel = channels.find((c) => c.id === connectedChannelId);

  return (
    <div className="w-full flex flex-col shrink-0 select-none">
      {/* Active Voice Bar */}
      {connectedChannelId && (
        <div className="h-10 bg-[#1e1f22] border-b border-black/30 flex items-center justify-between px-3 text-xs font-semibold">
          <div className="flex items-center text-discord-green truncate mr-2">
            <Signal size={16} className="mr-1.5 shrink-0 animate-pulse" />
            <div className="flex flex-col truncate">
              <span className="text-[11px] leading-none">Voz conectada</span>
              <span className="text-[10px] text-discord-textMuted leading-tight truncate">
                {connectedChannel?.name || 'Canal de Voz'}
              </span>
            </div>
          </div>

          <button
            onClick={leaveVoiceChannel}
            title="Desconectar da chamada"
            className="text-discord-textMuted hover:text-discord-red p-1 rounded transition shrink-0 cursor-pointer"
          >
            <PhoneOff size={16} />
          </button>
        </div>
      )}

      {/* User Info & Controls Bar */}
      <div className="h-[52px] w-full bg-[#232428] flex items-center px-2 justify-between">
        <div
          className="flex items-center hover:bg-white/10 p-1 rounded cursor-pointer transition-colors max-w-[120px] overflow-hidden group"
          onClick={() => openModal('userProfile', user)}
        >
          <div className="relative flex-shrink-0 mr-2">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white text-sm font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-discord-green rounded-full border-2 border-discord-dark"></div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="text-white text-sm font-semibold truncate leading-tight">{user.username}</div>
            <div className="text-discord-textMuted text-xs truncate leading-tight group-hover:hidden flex items-center">
              <Music size={10} className="mr-1 text-discord-green" /> Discord Clone
            </div>
            <div className="text-discord-textMuted text-xs truncate leading-tight hidden group-hover:block">
              #{user.discriminator || '0000'}
            </div>
          </div>
        </div>

        <div className="flex items-center text-discord-textMuted gap-0.5">
          <div className="flex items-center hover:bg-white/10 rounded transition-colors group cursor-pointer p-0.5">
            <button onClick={toggleMute} className="p-1.5 relative cursor-pointer" title="Mutar microfone">
              {isMuted ? (
                <MicOff size={18} className="text-discord-red" />
              ) : (
                <Mic size={18} className="group-hover:text-discord-textNormal" />
              )}
            </button>
          </div>

          <div className="flex items-center hover:bg-white/10 rounded transition-colors group cursor-pointer p-0.5">
            <button onClick={toggleDeafen} className="p-1.5 relative cursor-pointer" title="Ensurdecer">
              <Headphones
                size={18}
                className={`group-hover:text-discord-textNormal ${isDeafened ? 'text-discord-red' : ''}`}
              />
              {isDeafened && (
                <div className="absolute top-[14px] left-[6px] w-[20px] h-[2px] bg-discord-red rotate-45 transform origin-center"></div>
              )}
            </button>
          </div>

          <button
            onClick={() => openModal('userSettings')}
            className="p-2 hover:bg-white/10 rounded transition-colors group ml-0.5 cursor-pointer"
            title="Configurações do usuário"
          >
            <Settings size={18} className="group-hover:text-discord-textNormal" />
          </button>
        </div>
      </div>
    </div>
  );
}
