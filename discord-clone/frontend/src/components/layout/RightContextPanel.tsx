import { useState } from 'react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { getAvatarUrl } from '../../utils/avatar';
import { 
  Users, FileText, Image as ImageIcon, Shield, Sparkles, X, Download
} from 'lucide-react';

export function RightContextPanel() {
  const { user } = useAuthStore();
  const { members } = useServerStore();
  const { openModal } = useUIStore();
  const [activeTab, setActiveTab] = useState<'members' | 'details' | 'media'>('members');

  return (
    <div className="w-60 bg-[#090D12]/90 border-l border-white/5 h-full flex flex-col shrink-0 select-none backdrop-blur-md">
      {/* Top Header Navigation Tabs */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex bg-[#121820] p-1 rounded-xl w-full border border-white/5">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
              activeTab === 'members' ? 'bg-[#10B981] text-black shadow-md' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Membros
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
              activeTab === 'details' ? 'bg-[#10B981] text-black shadow-md' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Detalhes
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
              activeTab === 'media' ? 'bg-[#10B981] text-black shadow-md' : 'text-[#8B949E] hover:text-white'
            }`}
          >
            Arquivos
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* TAB 1: MEMBERS BY ROLE */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            {/* Role Group: Current User */}
            <div>
              <div className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Shield size={12} className="text-amber-400" />
                <span>Seu Perfil — 1</span>
              </div>
              <div 
                onClick={() => user && openModal('userProfile', user)}
                className="flex items-center space-x-2.5 p-2 rounded-xl bg-[#121820]/40 border border-white/5 hover:bg-[#121820] cursor-pointer transition btn-motion"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] text-black font-bold flex items-center justify-center text-xs overflow-hidden border border-[#10B981]/30">
                    {user?.avatarUrl ? (
                      <img src={getAvatarUrl(user.avatarUrl)} alt={user.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#090D12]"></div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{user?.username}</span>
                    <Sparkles size={10} className="text-amber-400" />
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">ONLINE</div>
                </div>
              </div>
            </div>

            {/* Role Group: Server Members */}
            <div>
              <div className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Users size={12} className="text-[#10B981]" />
                <span>Membros ({members.length > 0 ? members.length : 1})</span>
              </div>
              <div className="space-y-1">
                {members.length > 0 ? (
                  members.map((m) => {
                    const memberUser = m.user || m;
                    const avatarSrc = memberUser.avatarUrl ? getAvatarUrl(memberUser.avatarUrl) : null;
                    return (
                      <div 
                        key={m.id || memberUser.id} 
                        onClick={() => openModal('userProfile', memberUser)}
                        className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-[#121820] transition cursor-pointer btn-motion"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs overflow-hidden border border-cyan-500/30">
                            {avatarSrc ? (
                              <img src={avatarSrc} alt={memberUser.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (memberUser.username || 'M').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#10B981] rounded-full border-2 border-[#090D12]"></div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs text-[#F0F6FC] font-medium truncate">{memberUser.username}</span>
                          <span className="text-[9px] text-[#8B949E] uppercase">{m.role || 'Membro'}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-[#8B949E] italic p-2">Nenhum outro membro no canal</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#121820] rounded-2xl border border-white/5 space-y-2">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText size={14} className="text-[#10B981]" />
                <span>Sobre o Canal</span>
              </div>
              <p className="text-xs text-[#8B949E] leading-relaxed">
                Canal de voz e vídeo de alta fidelidade com aceleração por GPU e áudio studio 48kHz.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA & FILES */}
        {activeTab === 'media' && (
          <div className="space-y-3 text-center pt-6">
            <div className="w-12 h-12 rounded-2xl bg-[#121820] text-[#8B949E] flex items-center justify-center mx-auto border border-white/5">
              <ImageIcon size={24} />
            </div>
            <div className="text-xs font-bold text-white">Nenhum arquivo compartilhado</div>
            <p className="text-[11px] text-[#8B949E]">Os arquivos e imagens enviados no chat aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
