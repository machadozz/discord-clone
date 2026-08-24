import { useUIStore } from '../../store/useUIStore';
import { getAvatarUrl } from '../../utils/avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export function UserProfileModal() {
  const { activeModal, modalData, closeModal } = useUIStore();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  if (activeModal !== 'userProfile' || !modalData) return null;

  const isSelf = currentUser?.id === modalData.id;

  const handleSendMessage = () => {
    closeModal();
    if (!isSelf) {
      navigate('/app/@me/1');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={closeModal}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] bg-[#090D12] rounded-3xl shadow-2xl z-50 overflow-hidden border border-white/10 animate-fade-in-zoom select-none">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[#10B981] to-[#06B6D4] relative overflow-hidden">
          {(() => {
            const rawBanner = modalData?.bannerUrl || (isSelf ? currentUser?.bannerUrl : null);
            if (!rawBanner) return null;
            const isVideo = rawBanner.endsWith('.mp4') || rawBanner.endsWith('.webm');
            const finalBannerUrl = getAvatarUrl(rawBanner);

            return isVideo ? (
              <video src={finalBannerUrl} autoPlay loop muted className="w-full h-full object-cover" />
            ) : (
              <img src={finalBannerUrl} alt="Banner" className="w-full h-full object-cover" />
            );
          })()}
        </div>
        
        {/* Profile Content Area */}
        <div className="px-6 pb-6 relative bg-[#090D12]">
          {/* Avatar position cleanly over banner boundary without clipping */}
          <div className="relative -mt-12 mb-4 flex items-end justify-between">
            <div className="w-24 h-24 rounded-full border-4 border-[#090D12] bg-[#121820] overflow-hidden relative shadow-2xl shrink-0">
              {modalData.avatarUrl ? (
                <img src={getAvatarUrl(modalData.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#10B981] text-3xl font-extrabold text-black">
                  {modalData.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="w-4 h-4 rounded-full bg-[#10B981] border-2 border-[#090D12] absolute bottom-1 left-20"></div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-white text-xl font-black tracking-tight leading-none">{modalData.username}</h2>
              <div className="text-[#8B949E] text-xs font-medium mt-1">
                {modalData.username}#{modalData.discriminator || '0000'}
              </div>
            </div>

            <div className="w-full h-px bg-white/10"></div>

            <div className="p-3.5 bg-[#121820] rounded-2xl border border-white/5 space-y-3">
              <div>
                <h3 className="text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider mb-1">Sobre Mim</h3>
                <p className="text-xs text-white/90 font-medium">Apaixonado por comunidades, games e comunicação em tempo real.</p>
              </div>

              <div>
                <h3 className="text-[10px] font-extrabold text-[#8B949E] uppercase tracking-wider mb-1">Membro Desde</h3>
                <p className="text-xs text-white/90 font-medium">21 de Agosto de 2026</p>
              </div>
            </div>

            <input 
              type="text"
              placeholder={`Enviar mensagem para @${modalData.username}`}
              className="w-full bg-[#121820] text-white px-4 py-3 rounded-2xl text-xs border border-white/10 outline-none focus:border-[#10B981] transition placeholder-[#8B949E]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
