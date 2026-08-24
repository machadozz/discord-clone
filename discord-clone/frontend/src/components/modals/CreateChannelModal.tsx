import { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useServerStore } from '../../store/useServerStore';
import { Hash, Volume2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function CreateChannelModal() {
  const { closeModal, modalData } = useUIStore();
  const { activeServer, createChannel } = useServerStore();

  // default type from modalData or 'TEXT'
  const [channelType, setChannelType] = useState<'TEXT' | 'VOICE'>(
    modalData?.type || 'TEXT'
  );
  const [channelName, setChannelName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !activeServer) return;

    try {
      setIsLoading(true);
      await createChannel(activeServer.id, channelName.trim(), channelType);
      toast.success('Canal criado com sucesso!');
      closeModal();
    } catch (error) {
      toast.error('Erro ao criar o canal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#313338] w-full max-w-md rounded-lg overflow-hidden text-white shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold">Criar canal</h2>
          <button onClick={closeModal} className="text-discord-textMuted hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 pt-2">
          {/* Channel Type Selector */}
          <div>
            <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">
              Tipo de canal
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setChannelType('TEXT')}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                  channelType === 'TEXT'
                    ? 'bg-[#2b2d31] border-discord-blurple'
                    : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
                }`}
              >
                <Hash size={24} className="mr-3 text-discord-textMuted" />
                <div>
                  <div className="font-semibold text-sm">Texto</div>
                  <div className="text-xs text-discord-textMuted">Poste mensagens, imagens, memes e opiniões</div>
                </div>
              </div>

              <div
                onClick={() => setChannelType('VOICE')}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                  channelType === 'VOICE'
                    ? 'bg-[#2b2d31] border-discord-blurple'
                    : 'bg-[#2b2d31]/50 border-transparent hover:bg-[#2b2d31]'
                }`}
              >
                <Volume2 size={24} className="mr-3 text-discord-textMuted" />
                <div>
                  <div className="font-semibold text-sm">Voz</div>
                  <div className="text-xs text-discord-textMuted">Converse por voz, vídeo e compartilhamento de tela</div>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Name Input */}
          <div>
            <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">
              Nome do canal
            </label>
            <div className="relative flex items-center">
              {channelType === 'TEXT' ? (
                <Hash size={18} className="absolute left-3 text-discord-textMuted" />
              ) : (
                <Volume2 size={18} className="absolute left-3 text-discord-textMuted" />
              )}
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="novo-canal"
                className="w-full bg-[#1e1f22] text-white pl-9 pr-3 py-2.5 rounded text-sm outline-none border border-black/30 focus:border-discord-blurple"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="bg-[#2b2d31] -mx-6 -mb-6 p-4 flex justify-end gap-3 items-center">
            <button
              type="button"
              onClick={closeModal}
              className="text-sm text-white hover:underline px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !channelName.trim()}
              className="bg-discord-blurple hover:bg-discord-blurpleHover text-white text-sm font-semibold px-6 py-2 rounded transition disabled:opacity-50"
            >
              {isLoading ? 'Criando...' : 'Criar canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
