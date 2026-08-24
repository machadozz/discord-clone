import { useEffect } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Plus, MessageSquare, Search, Settings } from 'lucide-react';

export function TopSpaceBar() {
  const { servers: spaces, activeServer: activeSpace, fetchServers, setActiveServer: setActiveSpace } = useServerStore();
  const { user } = useAuthStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isDMsActive = location.pathname.startsWith('/app/@me');

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return (
    <header className="h-16 w-full pulse-glass-nav flex items-center justify-between px-6 z-40 shrink-0 select-none">
      {/* Brand Logo & Spaces Pills */}
      <div className="flex items-center space-x-6 min-w-0 flex-1 mr-4">
        {/* Brand Identity: DISCORDIA */}
        <div 
          onClick={() => {
            setActiveSpace(null as any);
            navigate('/app/@me');
          }}
          className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#06B6D4] flex items-center justify-center text-black font-extrabold shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Flame size={20} className="fill-black stroke-black" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white hidden sm:inline-block">
            DISCORDIA<span className="text-[#10B981]">.</span>
          </span>
        </div>

        <div className="h-6 w-[1px] bg-white/10 shrink-0 hidden sm:block"></div>

        {/* Horizontal Spaces Switcher Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar min-w-0">
          {/* Direct Messages Pill */}
          <button
            onClick={() => {
              setActiveSpace(null as any);
              navigate('/app/@me');
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95 ${
              isDMsActive
                ? 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20 font-bold'
                : 'bg-[#1A222D]/80 text-[#8B949E] hover:text-white hover:bg-[#232D3B]'
            }`}
          >
            <MessageSquare size={14} />
            <span>Mensagens Diretas</span>
          </button>

          {/* Communities / Spaces List */}
          {spaces.map((space) => {
            const isActive = activeSpace?.id === space.id;
            return (
              <button
                key={space.id}
                onClick={() => {
                  setActiveSpace(space);
                  navigate(`/app/${space.id}`);
                }}
                className={`flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border active:scale-95 ${
                  isActive
                    ? 'bg-[#1A222D] text-white border-[#10B981] shadow-lg shadow-emerald-500/10 font-semibold'
                    : 'bg-[#121820]/60 text-[#8B949E] border-white/5 hover:text-white hover:bg-[#1A222D]'
                }`}
              >
                {space.iconUrl ? (
                  <img src={space.iconUrl} alt={space.name} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center text-[10px] font-bold">
                    {space.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate max-w-[120px]">{space.name}</span>
              </button>
            );
          })}

          {/* Create Space Button */}
          <button
            onClick={() => openModal('createServer')}
            className="w-8 h-8 rounded-full bg-[#1A222D] border border-white/10 hover:border-[#10B981] text-[#8B949E] hover:text-[#10B981] flex items-center justify-center transition shrink-0 cursor-pointer active:scale-95"
            title="Criar novo Espaço"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Universal Search Bar */}
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3 text-[#8B949E]" />
          <input
            type="text"
            placeholder="Buscar espaços, mensagens..."
            className="bg-[#121820] text-xs text-[#F0F6FC] pl-8 pr-4 py-2 rounded-full border border-white/10 outline-none focus:border-[#10B981] w-48 focus:w-64 transition-all"
          />
        </div>

        <button 
          onClick={() => openModal('userSettings')}
          className="p-2 rounded-full bg-[#121820] hover:bg-[#1A222D] text-[#8B949E] hover:text-white transition cursor-pointer border border-white/5 active:scale-95"
          title="Configurações"
        >
          <Settings size={16} />
        </button>

        {/* User Status Pill */}
        {user && (
          <div 
            onClick={() => openModal('userProfile', user)}
            className="flex items-center space-x-2 pl-2 pr-3 py-1 bg-[#121820] hover:bg-[#1A222D] rounded-full border border-white/10 cursor-pointer transition active:scale-95"
          >
            <div className="relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#10B981] text-black font-bold flex items-center justify-center text-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#10B981] rounded-full border border-[#090D12]"></div>
            </div>
            <span className="text-xs font-semibold text-white truncate max-w-[90px]">{user.username}</span>
          </div>
        )}
      </div>
    </header>
  );
}
