import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Mail, CheckCircle2, RefreshCw, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface VerifyEmailModalProps {
  email: string;
  devCode?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function VerifyEmailModal({ email, devCode, onSuccess, onClose }: VerifyEmailModalProps) {
  const [code, setCode] = useState(devCode || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const { verifyEmail, resendVerification } = useAuthStore();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('O código deve conter exatamente 6 dígitos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verifyEmail(email, code);
      toast.success('🎉 E-mail verificado com sucesso! Bem-vindo ao DISCORDIA!');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await resendVerification(email);
      if (res.devVerificationCode) {
        setCode(res.devVerificationCode);
      }
      toast.success('Novo código enviado para seu e-mail!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao reenviar código.');
    } finally {
      setResending(false);
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
          <Mail size={32} className="animate-pulse" />
        </div>

        <h2 className="text-xl font-extrabold text-white text-center tracking-wide mb-1">
          Confirme seu E-mail
        </h2>
        <p className="text-xs text-[#8B949E] text-center mb-6">
          Enviamos um código de 6 dígitos para <strong className="text-white">{email}</strong>
        </p>

        {devCode && (
          <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
            <Sparkles size={16} className="shrink-0 text-cyan-400" />
            <span><strong>Modo de Teste:</strong> Código preenchido: <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-white font-bold">{devCode}</code></span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-2 text-center">
              Código de 6 dígitos
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
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
            <span>{loading ? 'Verificando...' : 'Confirmar e Entrar'}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-xs text-[#10B981] hover:underline flex items-center justify-center gap-1.5 mx-auto font-semibold transition cursor-pointer"
          >
            <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
            <span>Não recebeu o código? Reenviar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
