import { useEffect, useState } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { Plus, Compass, MessageSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export function ServerSidebar() {
  const { servers, activeServer, fetchServers, setActiveServer, createServer, joinServer } = useServerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isMe = location.pathname.startsWith('/app/@me');

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleCreateServer = async () => {
    if (newServerName.trim()) {
      await createServer(newServerName);
      setNewServerName('');
      setIsModalOpen(false);
    }
  };

  const handleJoinServer = async () => {
    if (inviteCode.trim()) {
      await joinServer(inviteCode);
      setInviteCode('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="w-[72px] bg-discord-darkest flex flex-col items-center py-3 space-y-2 h-screen overflow-y-auto">
      <div 
        className={`relative group flex items-center justify-center w-full mt-2`}
        onClick={() => {
          setActiveServer(null as any);
          navigate('/app/@me');
        }}
      >
        <div className={`absolute left-0 w-1 bg-white rounded-r-md transition-all duration-200 ${isMe ? 'h-10' : 'h-0 group-hover:h-5'}`}></div>
        <div className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] flex items-center justify-center cursor-pointer transition-all duration-200 ${isMe ? 'rounded-[16px] bg-discord-blurple text-white' : 'bg-discord-darker text-discord-textNormal hover:bg-discord-blurple hover:text-white'}`}>
          <MessageSquare size={24} />
        </div>
      </div>
      
      <div className="w-8 h-[2px] bg-discord-darker rounded-full my-2"></div>

      {/* Server List */}
      {servers.map((server) => (
        <div key={server.id} className="relative group flex items-center justify-center w-full">
          {/* Active indicator */}
          <div className={`absolute left-0 w-1 bg-white rounded-r-md transition-all duration-200 ${activeServer?.id === server.id ? 'h-10' : 'h-0 group-hover:h-5'}`}></div>
          
          <div 
            onClick={() => {
              setActiveServer(server);
              navigate(`/app/${server.id}`);
            }}
            className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] flex items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden ${
              activeServer?.id === server.id 
                ? 'rounded-[16px] bg-discord-blurple text-white' 
                : 'bg-discord-darker text-discord-textNormal hover:bg-discord-blurple hover:text-white'
            }`}
          >
            {server.iconUrl ? (
              <img src={server.iconUrl} alt={server.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-semibold text-lg">{server.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
      ))}

      {/* Add Server Button */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-discord-darker hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center cursor-pointer transition-all duration-200 group"
      >
        <Plus size={24} />
      </div>

      {/* Discover Button */}
      <div className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-discord-darker hover:bg-discord-green text-discord-green hover:text-white flex items-center justify-center cursor-pointer transition-all duration-200 group">
        <Compass size={24} />
      </div>

      {/* Simple Modal for Add Server (In a real app, use a proper Modal component) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-discord-darkest w-[440px] rounded-lg p-6 text-white shadow-2xl">
            <h2 className="text-2xl font-bold text-center mb-2">Create a server</h2>
            <p className="text-center text-discord-textMuted mb-6">Your server is where you and your friends hang out. Make yours and start talking.</p>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">Server Name</label>
              <input 
                type="text" 
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                className="w-full bg-discord-darker text-white p-3 rounded text-sm outline-none" 
                placeholder="My Awesome Server"
              />
              <button 
                onClick={handleCreateServer}
                className="w-full bg-discord-blurple hover:bg-discord-blurpleHover text-white p-3 rounded mt-4 font-semibold transition"
              >
                Create
              </button>
            </div>

            <div className="text-center text-discord-textMuted my-4">OR</div>

            <div>
              <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">Join a Server (Invite Code)</label>
              <input 
                type="text" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-discord-darker text-white p-3 rounded text-sm outline-none" 
                placeholder="https://discord.gg/..."
              />
              <button 
                onClick={handleJoinServer}
                className="w-full bg-discord-hover hover:bg-discord-dark text-white p-3 rounded mt-4 font-semibold transition"
              >
                Join Server
              </button>
            </div>

            <button 
              onClick={() => setIsModalOpen(false)}
              className="mt-6 text-sm text-discord-textMuted hover:underline block mx-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
