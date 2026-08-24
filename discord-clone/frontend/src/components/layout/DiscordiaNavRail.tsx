import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { 
  Flame, Home, MessageSquare, Settings, Plus 
} from 'lucide-react';

export function DiscordiaNavRail() {
  const { servers, activeServer, setActiveServer, fetchServers } = useServerStore();
  const { user } = useAuthStore();
  const { openModal } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const isHomeActive = location.pathname === '/app/@me' || location.pathname === '/app/home';
  const isDMActive = location.pathname.startsWith('/app/@me/');

  return (
    <aside className="w-16 h-full bg-[#090D12]/95 border-r border-white/5 flex flex-col items-center py-4 space-y-4 shrink-0 z-40 select-none backdrop-blur-xl">
      {/* Brand Logo Identity */}
      <div
        onClick={() => {
          setActiveServer(null as any);
          navigate('/app/@me');
        }}
        className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#06B6D4] flex items-center justify-center text-black font-extrabold cursor-pointer transition-transform hover:scale-105 shadow-lg shadow-emerald-500/20 group relative"
        title="DISCORDIA Home"
      >
        <Flame size={22} className="fill-black stroke-black group-hover:rotate-12 transition-transform" />
        <div className="absolute left-16 bg-[#121820] text-white text-xs px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 font-bold">
          DISCORDIA
        </div>
      </div>

      <div className="w-8 h-[1px] bg-white/10"></div>

      {/* Main Navigation Items */}
      <div className="flex-1 flex flex-col space-y-3 items-center overflow-y-auto no-scrollbar w-full px-2">
        {/* Home Hub Button */}
        <button
          onClick={() => {
            setActiveServer(null as any);
            navigate('/app/@me');
          }}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer group relative btn-motion ${
            isHomeActive
              ? 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20 font-bold'
              : 'bg-[#121820] text-[#8B949E] hover:text-white hover:bg-[#1A222D]'
          }`}
        >
          <Home size={18} />
          <div className="absolute left-16 bg-[#121820] text-white text-xs px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 font-semibold">
            Início / Hub
          </div>
        </button>

        {/* Direct Messages */}
        <button
          onClick={() => {
            setActiveServer(null as any);
            navigate('/app/@me');
          }}
          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer group relative btn-motion ${
            isDMActive
              ? 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20 font-bold'
              : 'bg-[#121820] text-[#8B949E] hover:text-white hover:bg-[#1A222D]'
          }`}
        >
          <MessageSquare size={18} />
          <div className="absolute left-16 bg-[#121820] text-white text-xs px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 font-semibold">
            Mensagens Diretas
          </div>
        </button>

        <div className="w-6 h-[1px] bg-white/5 my-1"></div>

        {/* Communities / Servers */}
        {servers.map((server) => {
          const isActive = activeServer?.id === server.id;
          return (
            <button
              key={server.id}
              onClick={() => {
                setActiveServer(server);
                navigate(`/app/${server.id}`);
              }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer group relative border btn-motion ${
                isActive
                  ? 'bg-[#1A222D] text-white border-[#10B981] shadow-lg shadow-emerald-500/10'
                  : 'bg-[#121820] text-[#8B949E] border-transparent hover:border-white/10 hover:text-white'
              }`}
            >
              {server.iconUrl ? (
                <img src={server.iconUrl} alt={server.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#10B981]">
                  {server.name.charAt(0).toUpperCase()}
                </span>
              )}
              {isActive && (
                <div className="absolute -left-1 w-1.5 h-5 bg-[#10B981] rounded-r-full shadow-lg shadow-emerald-500/50"></div>
              )}
              <div className="absolute left-16 bg-[#121820] text-white text-xs px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 font-semibold">
                {server.name}
              </div>
            </button>
          );
        })}

        {/* Add Community Button */}
        <button
          onClick={() => openModal('createServer')}
          className="w-10 h-10 rounded-2xl bg-[#121820] border border-dashed border-white/15 text-[#8B949E] hover:text-[#10B981] hover:border-[#10B981] flex items-center justify-center transition cursor-pointer group relative btn-motion"
        >
          <Plus size={18} />
          <div className="absolute left-16 bg-[#121820] text-white text-xs px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 font-semibold">
            Criar Comunidade
          </div>
        </button>
      </div>

      {/* Bottom Utility Controls */}
      <div className="flex flex-col space-y-3 items-center w-full px-2 pt-2">
        <button
          onClick={() => openModal('userSettings')}
          className="w-10 h-10 rounded-2xl bg-[#121820] text-[#8B949E] hover:text-white flex items-center justify-center transition cursor-pointer group relative btn-motion border border-white/5"
          title="Configurações"
        >
          <Settings size={18} />
          <div className="absolute left-16 bg-[#121820] text-white text-xs px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 font-semibold">
            Configurações
          </div>
        </button>

        {/* User Profile Avatar */}
        {user && (
          <button
            onClick={() => openModal('userProfile', user)}
            className="w-10 h-10 rounded-2xl relative cursor-pointer group btn-motion overflow-hidden border border-white/10"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#10B981] text-black font-extrabold flex items-center justify-center text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10B981] rounded-full border border-[#090D12]"></div>
          </button>
        )}
      </div>
    </aside>
  );
}
