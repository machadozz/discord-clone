import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useServerStore } from '../../store/useServerStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { getSocket } from '../../lib/socket';
import { Hash, PlusCircle, Smile, Users } from 'lucide-react';
import { VoiceRoom } from '../voice/VoiceRoom';
import { MemberList } from '../layout/MemberList';

export function ChatArea() {
  const { activeChannel } = useServerStore();
  const { messages, typingUsers, fetchMessages, addMessage, setTyping } = useChatStore();
  const { connectedChannelId, joinVoiceChannel } = useVoiceStore();
  const [inputValue, setInputValue] = useState('');
  const [showMembers, setShowMembers] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Connect to socket events when channel changes
  useEffect(() => {
    if (!activeChannel) return;

    fetchMessages(activeChannel.id);
    const socket = getSocket();
    
    if (socket) {
      socket.emit('channel:join', { channelId: activeChannel.id });
      
      const handleNewMessage = (msg: any) => {
        // Verifica se a mensagem é pro canal atual
        if (msg.channelId === activeChannel.id) {
          addMessage(msg);
        }
      };

      const handleTypingUpdate = (data: any) => {
        if (data.channelId === activeChannel.id) {
          setTyping(data.channelId, data.username, data.typing);
        }
      };

      socket.on('message:new', handleNewMessage);
      socket.on('typing:update', handleTypingUpdate);

      return () => {
        socket.emit('channel:leave', { channelId: activeChannel.id });
        socket.off('message:new', handleNewMessage);
        socket.off('typing:update', handleTypingUpdate);
      };
    }
  }, [activeChannel, fetchMessages, addMessage, setTyping]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChannel) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('message:send', { 
        channelId: activeChannel.id, 
        content: inputValue 
      });
      
      // Stop typing
      socket.emit('typing:stop', { channelId: activeChannel.id });
      setInputValue('');
    }
  };

  let typingTimeout: ReturnType<typeof setTimeout>;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (!activeChannel) return;
    const socket = getSocket();
    if (!socket) return;

    // Send typing:start
    socket.emit('typing:start', { channelId: activeChannel.id });

    // Clear previous timeout and set a new one to stop typing
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing:stop', { channelId: activeChannel.id });
    }, 2000);
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 bg-discord-dark flex items-center justify-center text-discord-textMuted">
        Select a channel or server to start messaging
      </div>
    );
  }

  // Se for canal de voz
  if (activeChannel.type === 'VOICE') {
    if (connectedChannelId === activeChannel.id) {
      return <VoiceRoom />;
    }

    return (
      <div className="flex-1 bg-discord-dark flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-4">Voice Channel: {activeChannel.name}</h2>
        <button 
          onClick={() => joinVoiceChannel(activeChannel.id)}
          className="bg-discord-green hover:bg-[#1f8b4c] text-white px-6 py-3 rounded text-lg font-semibold transition"
        >
          Join Voice Call
        </button>
      </div>
    );
  }

  const typingInThisChannel = typingUsers[activeChannel.id] || [];

  return (
    <div className="flex-1 bg-discord-dark flex flex-col h-screen">
      {/* Chat Header */}
      <div className="h-12 shadow-sm border-b border-black/20 flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center">
          <Hash size={24} className="text-discord-textMuted mr-2" />
          <span className="font-bold text-white">{activeChannel.name}</span>
        </div>
        <div className="flex items-center text-discord-textMuted">
          <button 
            className={`p-1 rounded hover:bg-white/10 ${showMembers ? 'text-white' : ''}`}
            onClick={() => setShowMembers(!showMembers)}
          >
            <Users size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="text-center my-8">
          <div className="w-16 h-16 bg-discord-darker rounded-full flex items-center justify-center mx-auto mb-4">
            <Hash size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to #{activeChannel.name}!</h1>
          <p className="text-discord-textMuted">This is the start of the #{activeChannel.name} channel.</p>
        </div>
        
        {messages.map((msg, i) => {
          // Simplistic message grouping
          const prevMsg = messages[i - 1];
          const isSameAuthor = prevMsg && prevMsg.author.id === msg.author.id;
          
          return (
            <div key={msg.id} className={`flex items-start group hover:bg-[#2e3035] -mx-4 px-4 py-0.5 ${!isSameAuthor ? 'mt-4 pt-1' : ''}`}>
              {!isSameAuthor ? (
                <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold cursor-pointer shrink-0 mt-1">
                  {msg.author.avatarUrl ? (
                    <img src={msg.author.avatarUrl} className="w-full h-full rounded-full" alt="Avatar" />
                  ) : (
                    msg.author.username.charAt(0).toUpperCase()
                  )}
                </div>
              ) : (
                <div className="w-10 shrink-0 text-right opacity-0 group-hover:opacity-100 pr-2">
                  <span className="text-[10px] text-discord-textMuted mt-1 block">
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              )}
              
              <div className="ml-4 min-w-0 flex-1">
                {!isSameAuthor && (
                  <div className="flex items-baseline space-x-2">
                    <span className="font-medium text-white hover:underline cursor-pointer">{msg.author.username}</span>
                    <span className="text-xs text-discord-textMuted">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="text-discord-textNormal text-[15px] whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2 shrink-0">
        <form onSubmit={handleSendMessage} className="bg-[#383a40] rounded-lg flex items-center px-4 py-2.5 relative">
          <PlusCircle size={24} className="text-discord-textMuted hover:text-discord-textNormal cursor-pointer mr-4" />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={`Message #${activeChannel.name}`}
            className="flex-1 bg-transparent text-discord-textNormal outline-none placeholder-[#87898c]"
          />
          <Smile size={24} className="text-discord-textMuted hover:text-discord-textNormal cursor-pointer ml-4" />
          
          {/* Typing Indicator */}
          {typingInThisChannel.length > 0 && (
            <div className="absolute -bottom-6 left-0 text-xs font-medium text-discord-textNormal">
              <span className="font-bold">{typingInThisChannel.join(', ')}</span> 
              {typingInThisChannel.length === 1 ? ' is ' : ' are '} typing...
            </div>
          )}
          </form>
        </div>
      </div>
      
      {/* Right Sidebar */}
      {showMembers && <MemberList />}
      </div>
    </div>
  );
}
