import { useEffect, useState } from 'react';
import { useFriendStore } from '../../store/useFriendStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useDMStore } from '../../store/useDMStore';
import { useNavigate } from 'react-router-dom';
import { HomeDashboard } from '../layout/HomeDashboard';
import { Users, UserPlus, Home as HomeIcon, Check, X, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export function FriendTabs() {
  const { user } = useAuthStore();
  const { pending, friends, fetchFriendships, sendFriendRequest, acceptFriendRequest, declineFriendRequest, initializeSocketListeners } = useFriendStore();
  const { startConversation } = useDMStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'home' | 'online' | 'all' | 'pending' | 'add'>('home');
  const [addUsername, setAddUsername] = useState('');
  
  useEffect(() => {
    fetchFriendships();
    initializeSocketListeners();
  }, [fetchFriendships, initializeSocketListeners]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim()) return;

    let name = addUsername;
    let disc = '0000';
    if (addUsername.includes('#')) {
      [name, disc] = addUsername.split('#');
    }
    
    try {
      await sendFriendRequest(name, disc);
      setAddUsername('');
    } catch (err: any) {
      console.error(err);
    }
  };

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
    <div className="flex-1 bg-[#090D12] flex flex-col min-w-0 h-full overflow-hidden select-none animate-fade-in-zoom">
      {/* Top Header Bar */}
      <div className="h-14 pulse-glass-nav flex items-center px-6 shrink-0 gap-6 justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-white font-extrabold text-sm pr-4 border-r border-white/10">
            <Users size={18} className="text-[#10B981]" />
            <span>Amigos & Comunidade</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer btn-motion ${
                activeTab === 'home' ? 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20' : 'text-[#8B949E] hover:bg-white/5 hover:text-white'
              }`}
            >
              <HomeIcon size={14} />
              <span>Hub Principal</span>
            </button>

            <button
              onClick={() => setActiveTab('online')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer btn-motion ${
                activeTab === 'online' ? 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20' : 'text-[#8B949E] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Online ({friends.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer btn-motion ${
                activeTab === 'all' ? 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20' : 'text-[#8B949E] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Todos ({friends.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer btn-motion ${
                activeTab === 'pending' ? 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20' : 'text-[#8B949E] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>Pendentes</span>
              {pending.length > 0 && (
                <span className="bg-amber-500 text-black text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {pending.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer btn-motion ${
                activeTab === 'add' ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-500/20' : 'bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981] hover:text-black'
              }`}
            >
              <UserPlus size={14} />
              <span>Adicionar Amigo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {activeTab === 'home' && <HomeDashboard />}

        {activeTab === 'add' && (
          <div className="p-8 max-w-2xl space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-white mb-1">Adicionar Amigos</h2>
              <p className="text-xs text-[#8B949E]">
                Digite o nome de usuário (ex: <code className="text-[#10B981]">angel</code> ou <code className="text-[#10B981]">maria#0001</code>).
              </p>
            </div>
            
            <form onSubmit={handleAddFriend} className="pulse-glass-card p-3 rounded-2xl border border-white/10 flex items-center gap-2 focus-within:border-[#10B981]">
              <input 
                type="text" 
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                placeholder="Exemplo: usuario ou usuario#0001" 
                className="flex-1 bg-transparent text-xs text-white outline-none px-2 placeholder-[#8B949E]"
              />
              <button 
                type="submit" 
                disabled={!addUsername.trim()}
                className="bg-[#10B981] hover:bg-emerald-600 disabled:opacity-40 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer btn-motion"
              >
                Enviar Pedido
              </button>
            </form>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="p-6 space-y-4 max-w-3xl">
            <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Pedidos Pendentes — {pending.length}</h3>
            {pending.length > 0 ? (
              pending.map((p) => {
                const targetId = p.friendshipId || p.id;
                const isReceiver = p.type === 'received' || p.receiver?.id === user?.id;
                const otherUser = p.user || (isReceiver ? p.requester : p.receiver);
                
                return (
                  <div key={targetId} className="flex items-center justify-between p-4 bg-[#121820] hover:bg-[#1A222D] rounded-2xl border border-white/5 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#10B981] text-black font-bold flex items-center justify-center text-sm">
                        {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{otherUser?.username || 'Usuário'}</div>
                        <div className="text-[10px] text-[#8B949E]">
                          {isReceiver ? '🎉 Te enviou uma solicitação de amizade' : '⏳ Solicitação enviada'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isReceiver ? (
                        <>
                          <button
                            onClick={() => acceptFriendRequest(targetId)}
                            className="bg-[#10B981] hover:bg-emerald-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 btn-motion shadow-lg shadow-emerald-500/20"
                            title="Aceitar Pedido de Amizade"
                          >
                            <Check size={16} />
                            <span>Aceitar</span>
                          </button>

                          <button
                            onClick={() => declineFriendRequest(targetId)}
                            className="bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 btn-motion"
                            title="Recusar Pedido"
                          >
                            <X size={16} />
                            <span>Recusar</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => declineFriendRequest(targetId)}
                          className="bg-gray-500/20 text-gray-300 hover:bg-rose-500 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 btn-motion"
                          title="Cancelar Solicitação Enviada"
                        >
                          <X size={16} />
                          <span>Cancelar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-[#8B949E] bg-[#121820]/40 rounded-2xl border border-white/5">
                Nenhum pedido de amizade pendente no momento.
              </div>
            )}
          </div>
        )}

        {(activeTab === 'online' || activeTab === 'all') && (
          <div className="p-6 space-y-4 max-w-3xl">
            <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Amigos — {friends.length}</h3>
            {friends.length > 0 ? (
              friends.map((f) => {
                const friendUser = f.user || f;
                return (
                  <div
                    key={f.friendshipId || f.id}
                    onClick={() => handleOpenDM(friendUser.id)}
                    className="flex items-center justify-between p-4 bg-[#121820] hover:bg-[#1A222D] rounded-2xl border border-white/5 hover:border-[#10B981]/30 transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-[#10B981] text-black font-bold flex items-center justify-center text-sm">
                          {friendUser.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2 border-[#090D12]"></div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#10B981] transition">{friendUser.username}</div>
                        <div className="text-[10px] text-[#10B981]">Conectado — Clique para conversar</div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDM(friendUser.id);
                      }}
                      className="bg-[#10B981]/15 group-hover:bg-[#10B981] text-[#10B981] group-hover:text-black px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 btn-motion shadow-lg shadow-emerald-500/10"
                      title="Enviar Mensagem Direta"
                    >
                      <MessageSquare size={14} />
                      <span>Mensagem</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-[#8B949E] bg-[#121820]/40 rounded-2xl border border-white/5">
                Nenhum amigo adicionado ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
