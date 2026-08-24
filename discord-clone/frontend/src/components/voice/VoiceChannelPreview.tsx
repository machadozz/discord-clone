import { Volume2 } from 'lucide-react';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useServerStore } from '../../store/useServerStore';

export function VoiceChannelPreview() {
  const { activeChannel } = useServerStore();
  const { joinVoiceChannel, channelMembers } = useVoiceStore();

  if (!activeChannel) return null;

  const membersInChannel = channelMembers[activeChannel.id] || [];
  const hasMembers = membersInChannel.length > 0;

  return (
    <div className="flex-1 bg-gradient-to-b from-[#141519] via-[#1e1f24] to-[#141519] flex flex-col items-center justify-center h-screen relative select-none">
      {/* Top Header info */}
      <div className="absolute top-4 left-6 flex items-center text-discord-textMuted text-sm font-semibold">
        <Volume2 size={18} className="mr-2" />
        <span>{activeChannel.name}</span>
      </div>

      {/* Main Preview Card */}
      <div className="flex flex-col items-center justify-center max-w-md text-center px-4">
        {/* Channel Icon & Name */}
        <div className="flex items-center text-white mb-3">
          <div className="w-2 border-l-4 border-discord-blurple h-7 mr-3 rounded-full"></div>
          <Volume2 size={36} className="mr-3 text-white" />
          <h1 className="text-3xl font-extrabold uppercase tracking-wide">{activeChannel.name}</h1>
        </div>

        {/* Status text */}
        <p className="text-discord-textMuted text-sm mb-8 font-medium">
          {hasMembers ? (
            <span>{membersInChannel.length} pessoa(s) em voz</span>
          ) : (
            <span>Ninguém está em voz</span>
          )}
        </p>

        {/* Connected members list (if any) */}
        {hasMembers && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {membersInChannel.map((m) => (
              <div key={m.userId} className="flex items-center space-x-2 bg-[#2b2d31] px-3 py-1.5 rounded-full border border-white/10">
                <div className="w-6 h-6 rounded-full bg-discord-blurple flex items-center justify-center text-white text-xs font-bold">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} className="w-full h-full rounded-full" alt={m.username} />
                  ) : (
                    m.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-semibold text-white">{m.username}</span>
              </div>
            ))}
          </div>
        )}

        {/* Join Voice Call Button */}
        <button
          onClick={() => joinVoiceChannel(activeChannel.id)}
          className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-md transition-all shadow-lg hover:scale-105 duration-150 text-sm flex items-center cursor-pointer"
        >
          Entrar na chamada de voz
        </button>
      </div>
    </div>
  );
}
