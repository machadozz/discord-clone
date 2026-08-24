import { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useFriendStore } from '../../store/useFriendStore';
import { useServerStore } from '../../store/useServerStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useDMStore } from '../../store/useDMStore';
import { useNavigate } from 'react-router-dom';
import { 
  Radio, Users, Zap, Calendar, ArrowRight, UserPlus, MessageSquare 
} from 'lucide-react';
import toast from 'react-hot-toast';

export function HomeDashboard() {
  const { user } = useAuthStore();
  const { friends, pending, fetchFriendships } = useFriendStore();
  const { servers, setActiveServer } = useServerStore();
  const { startConversation } = useDMStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  const handleOpenDM = async (targetUserId: string) => {
    if (!targetUserId) return;
    try {
      const conv = await startConversation(targetUserId);
      if (conv && conv.id) {
        navigate(`/app/@me/${conv.id}`);
      }
    } catch (err) {
      toast.error('Erro ao abrir conversa privada');
    }
  };

  return (
    <div className="flex-1 bg-[#090D12] text-[#F0F6FC] overflow-y-auto p-8 select-none space-y-8 animate-fade-in-zoom">
      {/* Hero Welcome Banner */}
      <div className="pulse-glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden bg-gradient-to-r from-[#10B981]/15 via-cyan-500/10 to-transparent">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-[#10B981]/10 border border-[#10B981]/30 px-3 py-1 rounded-full text-xs font-mono text-[#10B981]">
            <Zap size={14} />
            <span>DISCORDIA PLATFORM HUB v2.5</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Bem-vindo de volta, <span className="text-[#10B981]">{user?.username}</span>!
          </h1>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Seu hub central de comunicação em tempo real. Conecte-se às suas comunidades, participe de chamadas com 60 FPS ou inicie uma conversa com seus amigos.
          </p>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Grid of Key Hub Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Active Friends & Quick Calls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Voice Calls & Quick Join */}
          <div className="pulse-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio size={18} className="text-[#10B981]" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Palcos de Voz em Andamento</h3>
              </div>
              <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded-full font-mono">LIVE 60 FPS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {servers.slice(0, 4).map((server) => (
                <div
                  key={server.id}
                  onClick={() => {
                    setActiveServer(server);
                    navigate(`/app/${server.id}`);
                  }}
                  className="bg-[#121820] hover:bg-[#1A222D] p-4 rounded-xl border border-white/5 hover:border-[#10B981]/30 transition cursor-pointer flex items-center justify-between group btn-motion"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981]/20 to-cyan-500/20 text-[#10B981] font-bold flex items-center justify-center text-sm border border-[#10B981]/30">
                      {server.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#10B981] transition">{server.name}</div>
                      <div className="text-[10px] text-[#8B949E]">Servidor de Comunidade</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[#8B949E] group-hover:text-[#10B981] group-hover:translate-x-1 transition" />
                </div>
              ))}
            </div>
          </div>

          {/* Online Friends List */}
          <div className="pulse-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users size={18} className="text-[#10B981]" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Amigos Conectados</h3>
              </div>
              <span className="text-xs text-[#8B949E]">{friends.length} amigo(s)</span>
            </div>

            {friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((friend) => {
                  const friendUser = friend.user || friend;
                  const targetId = friendUser.id || friend.id;
                  return (
                    <div
                      key={friend.friendshipId || friend.id}
                      onClick={() => handleOpenDM(targetId)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#121820]/60 hover:bg-[#121820] border border-white/5 hover:border-[#10B981]/30 transition cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-[#10B981] text-black font-bold flex items-center justify-center text-xs">
                            {friendUser.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border border-[#090D12]"></div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-[#10B981] transition">{friendUser.username}</div>
                          <div className="text-[10px] text-[#10B981]">Disponível para conversa</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDM(targetId);
                        }}
                        className="bg-[#10B981]/15 group-hover:bg-[#10B981] text-[#10B981] group-hover:text-black text-xs font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer btn-motion flex items-center gap-1.5"
                      >
                        <MessageSquare size={14} />
                        <span>Enviar Mensagem</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#8B949E] bg-[#121820]/40 rounded-xl border border-white/5">
                Nenhum amigo online no momento. Envie convites para montar sua comunidade!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pending Requests & Upcoming Events */}
        <div className="space-y-6">
          {/* Pending Friend Requests */}
          <div className="pulse-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus size={18} className="text-amber-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Solicitações Pendentes</h3>
              </div>
              {pending.length > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  {pending.length}
                </span>
              )}
            </div>

            {pending.length > 0 ? (
              <div className="space-y-2">
                {pending.map((p) => (
                  <div key={p.id} className="p-3 bg-[#121820] rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{p.requester?.username || 'Usuário'}</span>
                    <button
                      onClick={() => navigate('/app/@me')}
                      className="text-xs bg-[#10B981] text-black font-extrabold px-3 py-1 rounded-lg"
                    >
                      Ver
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-[#8B949E] bg-[#121820]/40 rounded-xl">
                Nenhuma solicitação pendente.
              </div>
            )}
          </div>

          {/* Upcoming Community Events */}
          <div className="pulse-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar size={18} className="text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Eventos da Comunidade</h3>
            </div>

            <div className="p-4 bg-[#121820]/80 rounded-xl border border-cyan-500/20 space-y-2">
              <div className="text-xs font-bold text-white">Transmissão de Jogos @ 60 FPS</div>
              <div className="text-[10px] text-cyan-400 font-mono">HOJE • 20:00</div>
              <p className="text-[11px] text-[#8B949E]">Compartilhamento de tela em 2K Ultra Gaming Bitrate no palco principal.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
