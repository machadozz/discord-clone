import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDMStore } from '../../store/useDMStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { VoiceRoom } from '../voice/VoiceRoom';
import { Send, Paperclip, Smile, Phone, Video, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export function DMChatArea() {
  const { dmId } = useParams();
  const { activeDM, activeDMMessages, fetchActiveDM, fetchConversations, conversations, sendMessage, initializeSocketListeners } = useDMStore();
  const { user } = useAuthStore();
  const { joinDMVoice, connectedChannelId } = useVoiceStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCallActive = connectedChannelId === dmId;

  useEffect(() => {
    fetchConversations();
    initializeSocketListeners();
  }, [fetchConversations, initializeSocketListeners]);

  useEffect(() => {
    if (dmId) {
      fetchActiveDM(dmId);
    }
  }, [dmId, fetchActiveDM]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDMMessages]);

  const currentConv = activeDM || conversations.find((c) => c.id === dmId);
  const otherUser = currentConv?.participant || (currentConv?.participants?.find((p: any) => p.id !== user?.id));

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !dmId) return;

    try {
      await sendMessage(dmId, inputValue.trim());
      setInputValue('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#090D12] h-full overflow-hidden select-none animate-fade-in-zoom relative">
      {/* Top Header Bar */}
      <div className="h-14 pulse-glass-nav flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#10B981] text-black font-bold flex items-center justify-center text-xs">
            {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <span className="font-extrabold text-sm text-white tracking-wide">{otherUser?.username || 'Mensagem Direta'}</span>
            <div className="text-[10px] text-[#10B981]">Conversa Privada</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => dmId && joinDMVoice(dmId)}
            className={`p-2 rounded-xl border transition cursor-pointer btn-motion ${
              isCallActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-white/5 text-[#8B949E] hover:text-white border-white/5'
            }`}
            title="Iniciar Chamada de Voz"
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => dmId && joinDMVoice(dmId)}
            className={`p-2 rounded-xl border transition cursor-pointer btn-motion ${
              isCallActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-white/5 text-[#8B949E] hover:text-white border-white/5'
            }`}
            title="Iniciar Chamada de Vídeo"
          >
            <Video size={16} />
          </button>
        </div>
      </div>
      
      {/* Voice Stage call area if active */}
      {isCallActive && (
        <div className="h-1/2 min-h-[300px] border-b border-white/10 flex flex-col relative bg-black">
          <VoiceRoom />
        </div>
      )}
      
      {/* Message feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
        <div className="my-6 p-6 pulse-glass-card rounded-2xl border border-white/5 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto mb-3 text-2xl font-black">
            {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2 className="text-lg font-bold text-white mb-1">{otherUser?.username}</h2>
          <p className="text-xs text-[#8B949E]">Este é o início do seu histórico de mensagens privadas com @{otherUser?.username}.</p>
        </div>

        {activeDMMessages.map((msg: any) => {
          const author = msg.sender || msg.author || {};
          return (
            <div key={msg.id} className="flex items-start space-x-3 group p-1 rounded-xl hover:bg-white/[0.02] transition">
              <div className="w-9 h-9 rounded-xl bg-[#1A222D] border border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {author.avatarUrl ? (
                  <img src={author.avatarUrl} className="w-full h-full rounded-xl object-cover" alt="Avatar" />
                ) : (
                  (author.username || 'U').charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-xs font-bold text-white hover:text-[#10B981] cursor-pointer">
                    {author.username || 'Usuário'}
                  </span>
                  <span className="text-[10px] text-[#8B949E]">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-[#F0F6FC] leading-relaxed bg-[#121820] p-3 rounded-xl border border-white/5 inline-block max-w-2xl">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input area */}
      <div className="p-4 shrink-0">
        <form onSubmit={handleSendMessage} className="pulse-glass-card rounded-2xl flex items-center px-4 py-2 border border-white/10 focus-within:border-[#10B981] transition-all">
          <button type="button" className="text-[#8B949E] hover:text-[#10B981] p-1.5 transition cursor-pointer">
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Conversar com @${otherUser?.username || 'amigo'}`}
            className="flex-1 bg-transparent text-xs text-[#F0F6FC] px-3 py-2 outline-none placeholder-[#8B949E]"
          />

          <button type="submit" disabled={!inputValue.trim()} className="bg-[#10B981] hover:bg-emerald-600 disabled:opacity-30 text-black p-2 rounded-xl transition cursor-pointer ml-2 btn-motion">
            <Send size={14} className="fill-black" />
          </button>
        </form>
      </div>
    </div>
  );
}
