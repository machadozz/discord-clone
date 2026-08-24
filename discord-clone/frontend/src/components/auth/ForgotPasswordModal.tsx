import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { KeyRound, ArrowRight, CheckCircle2, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devToken, setDevToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { forgotPassword, resetPassword } = useAuthStore();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      if (res.devResetToken) {
        setDevToken(res.devResetToken);
        setToken(res.devResetToken);
      }
      toast.success('Instruções de redefinição enviadas!');
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao solicitar redefinição.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) return;

    if (newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      setError('A nova senha precisa ter no mínimo 8 caracteres, incluindo letras e números.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await resetPassword(email, token, newPassword);
      toast.success('🎉 Senha redefinida com sucesso! Faça login com sua nova senha.');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token inválido ou expirado.');
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
          <KeyRound size={32} className="animate-pulse" />
        </div>

        <h2 className="text-xl font-extrabold text-white text-center tracking-wide mb-1">
          {step === 'request' ? 'Recuperação de Senha' : 'Definir Nova Senha'}
        </h2>
        <p className="text-xs text-[#8B949E] text-center mb-6">
          {step === 'request'
            ? 'Informe seu e-mail cadastrado para receber o código de recuperação.'
            : 'Insira o código enviado e sua nova senha.'}
        </p>

        {step === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-2">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-xs"
              />
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-black font-extrabold py-3.5 px-6 rounded-2xl transition cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 btn-motion"
            >
              <span>{loading ? 'Enviando...' : 'Receber Código'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {devToken && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
                <Sparkles size={16} className="shrink-0 text-cyan-400" />
                <span>Código preenchido: <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-white font-bold">{devToken}</code></span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-2">
                Código de Recuperação (6 dígitos)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="000000"
                className="w-full text-center tracking-[0.3em] font-mono bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres (letras e números)"
                className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-xs"
              />
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token || !newPassword}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-black font-extrabold py-3.5 px-6 rounded-2xl transition cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 btn-motion"
            >
              <CheckCircle2 size={16} />
              <span>{loading ? 'Alterando...' : 'Salvar Nova Senha'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
