import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { VerifyEmailModal } from '../components/auth/VerifyEmailModal';
import { Flame, Shield, Check, X, Calendar, Lock, Mail, User } from 'lucide-react';
import api from '../lib/axios';

export function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [devCode, setDevCode] = useState('');

  const navigate = useNavigate();

  // Password strength calculation
  const hasMinLength = password.length >= 8;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const isPasswordStrong = hasMinLength && hasLetters && hasNumbers;

  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'bg-white/10' };
    if (isPasswordStrong) return { label: 'Forte', color: 'bg-[#10B981]' };
    if (hasMinLength && (hasLetters || hasNumbers)) return { label: 'Média', color: 'bg-amber-400' };
    return { label: 'Fraca', color: 'bg-rose-500' };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side Age Verification (13+ years)
    if (birthdate) {
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 13) {
        setError('Você precisa ter pelo menos 13 anos para se cadastrar no DISCORDIA.');
        return;
      }
    }

    if (!isPasswordStrong) {
      setError('A senha precisa ter no mínimo 8 caracteres, contendo letras e números.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        email,
        username,
        password,
        birthdate: birthdate || undefined,
      });

      if (res.data.devVerificationCode) {
        setDevCode(res.data.devVerificationCode);
      }
      setShowVerifyModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao criar conta. Verifique os dados informados.');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#090D12] bg-radial-gradient flex items-center justify-center p-4 relative select-none overflow-hidden">
      {/* Glow background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="pulse-glass-card w-full max-w-md rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl relative z-10 bg-[#090D12]/90 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#06B6D4] flex items-center justify-center text-black font-extrabold mx-auto mb-3 shadow-lg shadow-emerald-500/20">
            <Flame size={26} className="fill-black stroke-black" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Criar sua Conta</h2>
          <p className="text-xs text-[#8B949E] mt-1 font-medium">Junte-se à comunidade do DISCORDIA</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* E-mail */}
          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-[#10B981]" />
              <span>E-mail</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-xs placeholder-[#8B949E]"
              placeholder="seuemail@exemplo.com"
            />
          </div>

          {/* Nome de Usuário */}
          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={13} className="text-[#10B981]" />
              <span>Nome de Usuário</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-xs placeholder-[#8B949E]"
              placeholder="ex: gamer_pro"
            />
          </div>

          {/* Senha + Medidor de Força */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={13} className="text-[#10B981]" />
                <span>Senha Forte</span>
              </label>
              {password && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${strength.color} text-black`}>
                  {strength.label}
                </span>
              )}
            </div>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-xs placeholder-[#8B949E]"
              placeholder="••••••••"
            />

            {/* Checklist de requisitos de senha */}
            <div className="mt-2 space-y-1 bg-[#121820]/60 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center space-x-1.5 text-[10px]">
                {hasMinLength ? <Check size={12} className="text-[#10B981]" /> : <X size={12} className="text-[#8B949E]" />}
                <span className={hasMinLength ? 'text-white' : 'text-[#8B949E]'}>Pelo menos 8 caracteres</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px]">
                {hasLetters && hasNumbers ? <Check size={12} className="text-[#10B981]" /> : <X size={12} className="text-[#8B949E]" />}
                <span className={hasLetters && hasNumbers ? 'text-white' : 'text-[#8B949E]'}>Contém letras e números</span>
              </div>
            </div>
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#10B981]" />
              <span>Data de Nascimento (Idade Mínima: 13 anos)</span>
            </label>
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full bg-[#121820] text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-xs text-white"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isPasswordStrong}
            className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-black font-extrabold py-3.5 px-6 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 btn-motion mt-4"
          >
            {loading ? 'Criando Conta...' : 'Continuar para Verificação'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#8B949E]">
          Já possui uma conta?{' '}
          <Link to="/login" className="text-[#10B981] hover:underline font-bold">
            Fazer Login
          </Link>
        </div>
      </div>

      {/* Verification Code Modal */}
      {showVerifyModal && (
        <VerifyEmailModal
          email={email}
          devCode={devCode}
          onSuccess={() => navigate('/app')}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </div>
  );
}
