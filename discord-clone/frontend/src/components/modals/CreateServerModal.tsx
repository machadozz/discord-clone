import { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useServerStore } from '../../store/useServerStore';
import { useNavigate } from 'react-router-dom';
import { X, Layers, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export function CreateServerModal() {
  const { closeModal } = useUIStore();
  const { createServer, joinServer } = useServerStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      const newServer = await createServer(name.trim());
      toast.success('Comunidade criada com sucesso!');
      closeModal();
      if (newServer && newServer.id) {
        navigate(`/app/${newServer.id}`);
      }
    } catch (error) {
      toast.error('Erro ao criar a comunidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      setIsLoading(true);
      const joinedServer = await joinServer(inviteCode.trim());
      toast.success('Você entrou na comunidade!');
      closeModal();
      if (joinedServer && joinedServer.id) {
        navigate(`/app/${joinedServer.id}`);
      }
    } catch (error) {
      toast.error('Erro ao entrar na comunidade. Verifique o código.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fade-in-zoom">
      <div className="pulse-glass-card w-full max-w-md rounded-3xl overflow-hidden text-white shadow-2xl border border-white/10 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <h2 className="text-lg font-bold">Criar ou Entrar em uma Comunidade</h2>
          </div>
          <button onClick={closeModal} className="text-[#8B949E] hover:text-white transition cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8B949E] uppercase mb-1.5">
              Nome da sua nova comunidade
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Comunidade Gamer, Squad Dev..."
              className="w-full bg-[#121820] text-xs text-white px-4 py-3 rounded-xl outline-none border border-white/10 focus:border-[#10B981]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full bg-[#10B981] hover:bg-emerald-600 disabled:opacity-40 text-black font-extrabold text-xs py-3 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20 btn-motion"
          >
            {isLoading ? 'Criando...' : 'Criar Nova Comunidade'}
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-1 h-[1px] bg-white/10"></div>
          <span className="px-3 text-[10px] uppercase font-bold text-[#8B949E]">ou</span>
          <div className="flex-1 h-[1px] bg-white/10"></div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8B949E] uppercase mb-1.5">
              Código de Convite
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Cole o código do convite aqui..."
              className="w-full bg-[#121820] text-xs text-white px-4 py-3 rounded-xl outline-none border border-white/10 focus:border-[#06B6D4]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inviteCode.trim()}
            className="w-full bg-[#06B6D4] hover:bg-cyan-600 disabled:opacity-40 text-black font-bold text-xs py-3 rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 btn-motion"
          >
            <LogIn size={14} />
            <span>Entrar em uma Comunidade Existente</span>
          </button>
        </form>
      </div>
    </div>
  );
}
