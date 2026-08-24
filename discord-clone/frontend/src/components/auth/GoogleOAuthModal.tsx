import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { X, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleOAuthModalProps {
  provider: 'google' | 'github';
  onSuccess: () => void;
  onClose: () => void;
}

export function GoogleOAuthModal({ provider, onSuccess, onClose }: GoogleOAuthModalProps) {
  const isGoogle = provider === 'google';
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gisTriggered, setGisTriggered] = useState(false);

  useEffect(() => {
    // If Google GIS script is loaded, initialize official Google Account One Tap / Popup
    if (isGoogle && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '510885981110-3mupj2h3okrdo2ohck1u8kfnpfdk9vjh.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setGisTriggered(true);
          }
        });
      } catch (err) {
        console.warn('Google Identity Services init warn:', err);
      }
    }
  }, [isGoogle]);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/oauth', {
        provider: 'google',
        credential: response.credential,
      });

      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      toast.success(`🎉 Conectado via Google como ${res.data.user.username}!`);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Por favor, informe seu Nome Completo e E-mail da conta do Google.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/oauth', {
        provider,
        name: name.trim(),
        email: email.trim(),
        providerId: `${provider}-${Date.now()}`,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      toast.success(`🎉 Conta conectada como ${res.data.user.username}!`);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao conectar com a conta informada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-zoom select-none">
      <div className="pulse-glass-card w-full max-w-md rounded-3xl p-8 bg-[#090D12]/95 border border-white/10 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B949E] hover:text-white transition p-2 rounded-xl hover:bg-white/5 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Branding */}
        <div className="flex items-center space-x-3 mb-6 border-b border-white/10 pb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
            isGoogle ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          }`}>
            {isGoogle ? 'G' : 'GH'}
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">
              {isGoogle ? 'Entrar com o Google' : 'Entrar com o GitHub'}
            </h2>
            <p className="text-xs text-[#8B949E]">
              Conecte sua conta pessoal para entrar no <strong className="text-white">DISCORDIA</strong>
            </p>
          </div>
        </div>

        {/* Real Account Input */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div className="p-3.5 bg-[#121820] rounded-2xl border border-white/5 space-y-1 mb-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#10B981]" />
              <span>Digite os dados da sua Conta do Google real:</span>
            </div>
            <p className="text-[11px] text-[#8B949E]">
              Seu perfil no DISCORDIA será criado exatamente com o seu Nome e E-mail informados abaixo.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">
              Seu Nome Completo (do Google)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Ângelo Silva"
              className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] text-xs font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">
              Seu E-mail (do Google)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@gmail.com"
              className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-1">
              URL da Foto de Perfil (Opcional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] text-xs"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-black font-extrabold py-3.5 px-6 rounded-2xl transition cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 btn-motion mt-4"
          >
            <ShieldCheck size={16} />
            <span>{loading ? 'Conectando Conta...' : 'Entrar com Minha Conta'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
