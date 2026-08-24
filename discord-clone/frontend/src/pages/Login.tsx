import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { VerifyEmailModal } from '../components/auth/VerifyEmailModal';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { TwoFactorModal } from '../components/auth/TwoFactorModal';
import { GoogleOAuthModal } from '../components/auth/GoogleOAuthModal';
import { Flame, LogIn, Lock, User, CheckSquare, Square, Code2, Globe } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    google?: any;
  }
}

export function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [authProvider, setAuthProvider] = useState<'google' | 'github'>('google');
  const [twoFactorUserId, setTwoFactorUserId] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '510885981110-3mupj2h3okrdo2ohck1u8kfnpfdk9vjh.apps.googleusercontent.com';

  useEffect(() => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
      } catch (err) {
        console.warn('Google Identity Services setup warning:', err);
      }
    }
  }, [GOOGLE_CLIENT_ID]);

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
      navigate('/app');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  };

  // DIRECT GOOGLE / GITHUB OAUTH POPUP (Google Identity Services GIS One Tap & Modal Fallback)
  const handleGoogleLoginDirect = () => {
    setAuthProvider('google');
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowGoogleModal(true);
          }
        });
        return;
      } catch (e) {
        console.warn('Google GIS prompt warn:', e);
      }
    }

    setShowGoogleModal(true);
  };

  const handleGitHubLoginDirect = () => {
    setAuthProvider('github');
    setShowGoogleModal(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        identifier,
        password,
        rememberMe,
      });

      if (res.data.requiresTwoFactor) {
        setTwoFactorUserId(res.data.userId);
        setShowTwoFactorModal(true);
        return;
      }

      login(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate('/app');
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.requiresVerification && errData?.email) {
        setUnverifiedEmail(errData.email);
        setShowVerifyModal(true);
      } else {
        setError(errData?.message || 'Falha ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D12] bg-radial-gradient flex items-center justify-center p-4 relative select-none overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="pulse-glass-card w-full max-w-4xl rounded-3xl overflow-hidden flex relative z-10 bg-[#090D12]/90 border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Left Form Area */}
        <div className="flex-1 p-8 sm:p-10">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#06B6D4] flex items-center justify-center text-black font-extrabold mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              <Flame size={26} className="fill-black stroke-black" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Boas-vindas de volta!</h2>
            <p className="text-xs text-[#8B949E] mt-1 font-medium">Estamos muito felizes em ver você novamente!</p>
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLoginDirect}
              className="bg-[#121820] hover:bg-[#1A222D] text-white border border-white/10 p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer btn-motion"
            >
              <Globe size={16} className="text-rose-400" />
              <span>Entrar com Google</span>
            </button>
            <button
              type="button"
              onClick={handleGitHubLoginDirect}
              className="bg-[#121820] hover:bg-[#1A222D] text-white border border-white/10 p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer btn-motion"
            >
              <Code2 size={16} className="text-cyan-400" />
              <span>Entrar com GitHub</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#8B949E] font-bold uppercase tracking-wider">ou com e-mail / username</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* E-mail ou Username */}
            <div>
              <label className="block text-[11px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-[#10B981]" />
                <span>E-mail ou Nome de Usuário</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-[#121820] text-[#F0F6FC] p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-xs placeholder-[#8B949E]"
                placeholder="seuemail@exemplo.com ou username"
              />
            </div>

            {/* Senha */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock size={13} className="text-[#10B981]" />
                  <span>Senha</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#10B981] hover:underline font-bold transition cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121820] text-[#F0F6FC] p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] transition text-xs placeholder-[#8B949E]"
                placeholder="••••••••"
              />
            </div>

            {/* Lembrar de mim */}
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center space-x-2 text-xs text-[#8B949E] hover:text-white cursor-pointer transition select-none pt-1"
            >
              {rememberMe ? (
                <CheckSquare size={16} className="text-[#10B981]" />
              ) : (
                <Square size={16} className="text-[#8B949E]" />
              )}
              <span className="font-medium">Lembrar de mim neste dispositivo (Sessão de 30 dias)</span>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-black font-extrabold py-3.5 px-6 rounded-xl transition cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 btn-motion mt-4"
            >
              <LogIn size={16} />
              <span>{loading ? 'Entrando...' : 'Entrar na Conta'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#8B949E]">
            Precisando de uma conta?{' '}
            <Link to="/register" className="text-[#10B981] hover:underline font-bold">
              Registre-se
            </Link>
          </div>
        </div>

        {/* Right Feature Panel */}
        <div className="hidden md:flex w-80 bg-[#121820]/60 p-8 flex-col items-center justify-center text-center border-l border-white/5 relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#10B981]/20 to-[#06B6D4]/20 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] mb-6 shadow-xl">
            <Flame size={40} className="animate-pulse" />
          </div>
          <h3 className="text-lg font-extrabold text-white mb-2 tracking-wide uppercase">DISCORDIA V2</h3>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Comunicação de áudio studio 48kHz, vídeos de tela em 60 FPS com aceleração por GPU e supressão de ruído ativada para todos.
          </p>
        </div>
      </div>

      {/* Modals */}
      {showVerifyModal && (
        <VerifyEmailModal
          email={unverifiedEmail || identifier}
          onSuccess={() => navigate('/app')}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}

      {showTwoFactorModal && (
        <TwoFactorModal
          userId={twoFactorUserId}
          rememberMe={rememberMe}
          onSuccess={() => navigate('/app')}
          onClose={() => setShowTwoFactorModal(false)}
        />
      )}

      {showGoogleModal && (
        <GoogleOAuthModal
          provider={authProvider}
          onSuccess={() => navigate('/app')}
          onClose={() => setShowGoogleModal(false)}
        />
      )}
    </div>
  );
}
