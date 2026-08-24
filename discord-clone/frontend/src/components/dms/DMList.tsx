import { useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { UserFooter } from '../layout/UserFooter';
import { useDMStore } from '../../store/useDMStore';
import { useAuthStore } from '../../store/useAuthStore';

export function DMList() {
  const { conversations, fetchConversations } = useDMStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="w-60 bg-discord-darker flex flex-col h-full flex-shrink-0">
      {/* Header Search */}
      <div className="h-12 flex items-center px-4 shadow-sm shrink-0 border-b border-black/20">
        <button className="w-full h-7 bg-discord-darkest rounded text-sm text-discord-textMuted text-left px-2 cursor-text">
          Find or start a conversation
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-[2px]">
        <NavLink 
          to="/app/@me"
          end
          className={({ isActive }) => `flex items-center px-3 py-2 rounded group cursor-pointer transition-colors ${isActive ? 'bg-discord-hover text-white' : 'text-discord-textMuted hover:bg-discord-hover hover:text-discord-textNormal'}`}
        >
          <Users size={20} className="mr-3" />
          <span className="font-medium">Friends</span>
        </NavLink>
        
        <div className="mt-4 mb-1 px-3 flex items-center justify-between group">
          <span className="text-xs font-bold text-discord-textMuted group-hover:text-discord-textNormal transition-colors uppercase">Direct Messages</span>
          <Plus size={16} className="text-discord-textMuted cursor-pointer hover:text-discord-textNormal" />
        </div>

        {conversations.map(dm => {
          // Find the other participant
          const otherUser = dm.participants.find((p: any) => p.id !== user?.id) || dm.participants[0];
          if (!otherUser) return null;

          return (
            <NavLink
              key={dm.id}
              to={`/app/@me/${dm.id}`}
              className={({ isActive }) => `flex items-center px-3 py-2 rounded group cursor-pointer transition-colors ${isActive ? 'bg-discord-hover text-white' : 'text-discord-textMuted hover:bg-discord-hover hover:text-discord-textNormal'}`}
            >
              <div className="relative mr-3">
                <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white font-medium text-sm">
                  {otherUser.avatarUrl ? <img src={getAvatarUrl(otherUser.avatarUrl)} className="w-full h-full rounded-full object-cover" /> : otherUser.username.charAt(0)}
                </div>
                {/* Offline indicator for now */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-discord-darker bg-discord-textFaded"></div>
              </div>
              <span className="font-medium">{otherUser.username}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Footer */}
      <UserFooter />
    </div>
  );
}
