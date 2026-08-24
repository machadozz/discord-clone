import { Users } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useServerStore } from '../../store/useServerStore';
import { getAvatarUrl } from '../../utils/avatar';

export function MemberList() {
  const { user } = useAuthStore();
  const { openModal } = useUIStore();
  const { members } = useServerStore();

  // Group members by role
  const admins = members.filter(m => m.role === 'ADMIN');
  const regularMembers = members.filter(m => m.role !== 'ADMIN');

  return (
    <div className="w-60 bg-[#2b2d31] flex flex-col h-full flex-shrink-0">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {admins.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-discord-textMuted uppercase mb-2">
              Admins — {admins.length}
            </h3>
            {admins.map(member => (
              <div 
                key={member.id} 
                className="flex items-center px-2 py-1.5 -mx-2 rounded hover:bg-discord-hover cursor-pointer group mb-[2px]"
                onClick={() => openModal('userProfile', member.user)}
              >
                <div className="relative mr-3">
                  <div className="w-8 h-8 rounded-full bg-discord-blurple flex items-center justify-center text-white font-medium text-sm">
                    {member.user.avatarUrl ? (
                      <img src={getAvatarUrl(member.user.avatarUrl)} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      member.user.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#2b2d31] bg-discord-green group-hover:border-discord-hover transition-colors"></div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-discord-textNormal truncate leading-tight group-hover:text-white transition-colors">{member.user.username}</span>
                  <span className="text-[10px] uppercase font-bold text-discord-textMuted leading-tight mt-0.5">Admin</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {regularMembers.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-discord-textMuted uppercase mb-2">
              Members — {regularMembers.length}
            </h3>
            {regularMembers.map(member => (
              <div 
                key={member.id} 
                className="flex items-center px-2 py-1.5 -mx-2 rounded hover:bg-discord-hover cursor-pointer group mb-[2px] opacity-80 hover:opacity-100 transition-opacity"
                onClick={() => openModal('userProfile', member.user)}
              >
                <div className="relative mr-3">
                  <div className="w-8 h-8 rounded-full bg-discord-textMuted flex items-center justify-center text-white font-medium text-sm">
                    {member.user.avatarUrl ? (
                      <img src={getAvatarUrl(member.user.avatarUrl)} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      member.user.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-[#2b2d31] bg-discord-green group-hover:border-discord-hover transition-colors"></div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-discord-textNormal truncate leading-tight group-hover:text-white transition-colors">{member.user.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
