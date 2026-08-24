import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldCheck, CheckCircle2, X } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

interface TwoFactorModalProps {
  userId: string;
  rememberMe?: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function TwoFactorModal({ userId, rememberMe, onSuccess, onClose }: TwoFactorModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuthStore();

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('O código de autenticação precisa ter 6 dígitos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/2fa/verify-login', {
        userId,
        code,
        rememberMe,
      });

      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      toast.success('Autenticação 2FA confirmada com sucesso!');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código de 2FA incorreto ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-zoom select-none">
      <div className="pulse-glass-card w-full max-w-md rounded-3xl p-8 bg-[#090D12]/95 border border-[#10B981]/40 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B949E] hover:text-white transition p-2 rounded-xl hover:bg-white/5 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={36} className="animate-pulse" />
        </div>

        <h2 className="text-xl font-extrabold text-white text-center tracking-wide mb-1">
          Autenticação em 2 Etapas (2FA)
        </h2>
        <p className="text-xs text-[#8B949E] text-center mb-6">
          Insira o código de 6 dígitos do seu aplicativo autenticador (Google Authenticator / Authy).
        </p>

        <form onSubmit={handleVerify2FA} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-2 text-center">
              Código 2FA (TOTP)
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono bg-[#121820] text-white p-3.5 rounded-2xl border border-white/10 outline-none focus:border-[#10B981] transition shadow-inner"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-black font-extrabold py-3.5 px-6 rounded-2xl transition cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 btn-motion"
          >
            <CheckCircle2 size={16} />
            <span>{loading ? 'Validando 2FA...' : 'Verificar e Entrar'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
