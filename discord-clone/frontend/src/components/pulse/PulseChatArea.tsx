import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getSocket } from '../../lib/socket';
import { 
  Hash, Send, Paperclip, Smile, Copy, 
  Sparkles
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export function PulseChatArea() {
  const { channelId } = useParams();
  const { channels } = useServerStore();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [reactions, setReactions] = useState<{ [msgId: string]: string[] }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChannel = channels.find((c) => c.id === channelId);

  useEffect(() => {
    if (channelId) {
      fetchMessages();
    }
  }, [channelId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !channelId) return;

    socket.emit('channel:join', channelId);

    const handleNewMessage = (msg: any) => {
      if (msg.channelId === channelId) {
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      }
    };

    socket.off('message:new');
    socket.on('message:new', handleNewMessage);

    return () => {
      socket.emit('channel:leave', channelId);
      socket.off('message:new', handleNewMessage);
    };
  }, [channelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/channels/${channelId}/messages`);
      setMessages(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !channelId) return;

    try {
      const res = await api.post(`/channels/${channelId}/messages`, { content: inputValue });
      setMessages((prev) => prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]);
      setInputValue('');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), emoji],
    }));
    toast.success(`Reagido com ${emoji}`);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Mensagem copiada!');
  };

  if (!currentChannel) {
    return (
      <div className="flex-1 bg-[#090D12] flex items-center justify-center text-[#8B949E] text-xs">
        Selecione um canal para visualizar a conversa.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#090D12] h-full overflow-hidden select-none relative animate-fade-in-zoom">
      {/* Channel Top Header */}
      <div className="h-14 pulse-glass-nav flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-2.5">
          <Hash size={18} className="text-[#10B981]" />
          <span className="font-bold text-sm text-white tracking-wide">{currentChannel.name}</span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
        {/* Welcome Header */}
        <div className="my-6 p-6 pulse-glass-card rounded-2xl border border-white/5 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto mb-3">
            <Hash size={24} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Bem-vindo ao #{currentChannel.name}</h2>
          <p className="text-xs text-[#8B949E]">Este é o início da conversa neste canal da comunidade.</p>
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const msgReactions = reactions[msg.id] || [];
          return (
            <div key={msg.id} className="flex items-start space-x-3 group relative p-1 rounded-xl hover:bg-white/[0.02] transition">
              {/* Contextual Hover Toolbar */}
              <div className="absolute right-4 -top-3 hidden group-hover:flex items-center bg-[#121820] border border-white/10 rounded-xl p-1 shadow-xl space-x-1 z-20">
                <button
                  onClick={() => handleAddReaction(msg.id, '❤️')}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-rose-400 transition cursor-pointer"
                  title="Reagir ❤️"
                >
                  <Smile size={14} />
                </button>
                <button
                  onClick={() => handleAddReaction(msg.id, '🔥')}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-amber-400 transition cursor-pointer"
                  title="Reagir 🔥"
                >
                  <Sparkles size={14} />
                </button>
                <button
                  onClick={() => handleCopyMessage(msg.content)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-[#8B949E] hover:text-white transition cursor-pointer"
                  title="Copiar mensagem"
                >
                  <Copy size={14} />
                </button>
              </div>

              <div className="w-9 h-9 rounded-xl bg-[#1A222D] border border-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {msg.author?.avatarUrl ? (
                  <img src={msg.author.avatarUrl} className="w-full h-full rounded-xl object-cover" alt="Avatar" />
                ) : (
                  (msg.author?.username || 'U').charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-xs font-bold text-white hover:text-[#10B981] cursor-pointer">
                    {msg.author?.username || 'Usuário'}
                  </span>
                  <span className="text-[10px] text-[#8B949E]">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-[#F0F6FC] leading-relaxed bg-[#121820] p-3 rounded-xl border border-white/5 inline-block max-w-2xl">
                  {msg.content}
                </div>

                {/* Reactions badge */}
                {msgReactions.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {msgReactions.map((emoji, idx) => (
                      <span key={idx} className="text-xs bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 rounded-md">
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Modern Input Area */}
      <div className="p-4 shrink-0">
        <form onSubmit={handleSendMessage} className="pulse-glass-card rounded-2xl flex items-center px-4 py-2 border border-white/10 focus-within:border-[#10B981] transition-all">
          <button type="button" className="text-[#8B949E] hover:text-[#10B981] p-1.5 transition cursor-pointer">
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Enviar mensagem em #${currentChannel.name}`}
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
