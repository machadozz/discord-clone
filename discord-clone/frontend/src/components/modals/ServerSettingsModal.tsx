import { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { X, Trash2 } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export function ServerSettingsModal() {
  const { activeModal, modalData, closeModal } = useUIStore();
  const { servers, fetchServers, setActiveServer } = useServerStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  if (activeModal !== 'serverSettings' || !modalData) return null;
  
  const server = servers.find(s => s.id === modalData.serverId);
  if (!server) return null;

  const handleDeleteServer = async () => {
    if (!window.confirm('Are you sure you want to delete this server? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      await api.delete(`/servers/${server.id}`);
      toast.success('Server deleted');
      await fetchServers();
      closeModal();
      setActiveServer(null as any);
      navigate('/app/@me');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-discord-darkest w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex overflow-hidden">
        
        {/* Left Sidebar Menu */}
        <div className="w-[30%] bg-discord-darker py-14 px-5 flex flex-col items-end border-r border-black/10">
          <div className="w-48 text-discord-textMuted font-bold text-xs uppercase mb-2 px-2 truncate">{server.name}</div>
          <div className="w-48 bg-discord-hover text-white px-2 py-1.5 rounded cursor-pointer mb-0.5">Overview</div>
          <div className="w-48 hover:bg-discord-hover text-discord-textNormal px-2 py-1.5 rounded cursor-pointer mb-0.5">Roles</div>
          <div className="w-48 hover:bg-discord-hover text-discord-textNormal px-2 py-1.5 rounded cursor-pointer mb-4">Members</div>
          
          <div className="w-48 h-px bg-white/10 my-4"></div>
          
          <div 
            className="w-48 text-discord-red hover:bg-discord-red/10 px-2 py-1.5 rounded cursor-pointer flex justify-between items-center group"
            onClick={handleDeleteServer}
          >
            {loading ? 'Deleting...' : 'Delete Server'}
            <Trash2 size={16} className="hidden group-hover:block" />
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-discord-darkest py-14 px-10 relative overflow-y-auto">
          {/* Close button */}
          <div 
            className="absolute top-10 right-10 flex flex-col items-center cursor-pointer text-discord-textMuted hover:text-white"
            onClick={closeModal}
          >
            <div className="w-9 h-9 border-2 border-discord-textMuted rounded-full flex items-center justify-center mb-1">
              <X size={18} />
            </div>
            <span className="text-xs font-bold uppercase">Esc</span>
          </div>

          <h2 className="text-white text-xl font-bold mb-6">Server Overview</h2>
          
          <div className="flex gap-8">
            <div className="flex-1">
              <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">Server Name</label>
              <input 
                type="text" 
                defaultValue={server.name}
                className="w-full bg-[#1e1f22] text-white p-3 rounded text-sm outline-none" 
              />
            </div>
            
            <div className="w-32 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-discord-blurple flex items-center justify-center text-white text-3xl font-bold mb-4 overflow-hidden shadow-lg">
                {server.iconUrl ? (
                  <img src={server.iconUrl} alt="Icon" className="w-full h-full object-cover" />
                ) : (
                  server.name.charAt(0).toUpperCase()
                )}
              </div>
              <button className="text-discord-blurple hover:underline text-sm font-medium">
                Change Icon
              </button>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-white font-bold mb-2">Invite Code</h3>
            <div className="flex items-center gap-4">
              <input 
                type="text" 
                value={server.inviteCode}
                readOnly
                className="flex-1 bg-[#1e1f22] text-discord-textMuted p-3 rounded text-sm outline-none" 
              />
              <button 
                className="bg-discord-blurple hover:bg-discord-blurpleHover text-white px-6 py-2.5 rounded font-medium transition"
                onClick={() => navigator.clipboard.writeText(server.inviteCode)}
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
