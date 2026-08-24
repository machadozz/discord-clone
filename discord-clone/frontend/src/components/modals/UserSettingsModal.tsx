import { useRef, useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { 
  X, Upload, Palette, UserCheck, Shield, LogOut, Check, Image as ImageIcon, 
  Mic, MicOff, Volume2, VolumeX, Radio, Sparkles, Sliders, ShieldCheck, Zap
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { getAvatarUrl } from '../../utils/avatar';

export function UserSettingsModal() {
  const { user, logout } = useAuthStore();
  const { closeModal } = useUIStore();
  const { audioSettings, updateAudioSettings } = useVoiceStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'voice' | 'system'>('profile');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Profile Form State
  const [nickname, setNickname] = useState(user?.username || '');
  const [bio, setBio] = useState('Apaixonado por comunidades, games e comunicação em tempo real.');
  const [bannerUrl, setBannerUrl] = useState<string>(user?.bannerUrl || '');
  const [isVideoBanner, setIsVideoBanner] = useState(
    !!(user?.bannerUrl && (user.bannerUrl.endsWith('.mp4') || user.bannerUrl.endsWith('.webm')))
  );

  useEffect(() => {
    if (user?.bannerUrl) {
      setBannerUrl(user.bannerUrl);
      setIsVideoBanner(user.bannerUrl.endsWith('.mp4') || user.bannerUrl.endsWith('.webm'));
    }
  }, [user?.bannerUrl]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setBannerUrl(localUrl);
    setIsVideoBanner(file.type.startsWith('video/'));

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);

    try {
      const res = await api.post('/uploads/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.bannerUrl) {
        setBannerUrl(res.data.bannerUrl);
        setIsVideoBanner(!!res.data.isVideo);
        useAuthStore.getState().updateUserBanner(res.data.bannerUrl);
        toast.success('Banner de perfil atualizado com sucesso!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao atualizar arquivo do banner');
    } finally {
      setLoading(false);
    }
  };
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'midnight' | 'graphite' | 'light' | 'amoled'>(
    (localStorage.getItem('discordia_theme') as any) || 'dark'
  );
  const [selectedAccent, setSelectedAccent] = useState<'emerald' | 'cyan' | 'violet' | 'amber' | 'rose'>(
    (localStorage.getItem('discordia_accent') as any) || 'emerald'
  );

  // Audio Device Enumeration State
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  
  // Mic Test State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0); // 0 to 100
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('discordia_theme') || 'dark';
    const savedAccent = localStorage.getItem('discordia_accent') || 'emerald';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-accent', savedAccent);

    // Enumerate media input & output devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const inputs = devices.filter((d) => d.kind === 'audioinput');
        const outputs = devices.filter((d) => d.kind === 'audiooutput');
        setAudioInputDevices(inputs);
        setAudioOutputDevices(outputs);
      }).catch((err) => {
        console.warn('Erro ao enumerar dispositivos de áudio:', err);
      });
    }

    return () => {
      stopMicTest();
    };
  }, []);

  if (!user) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);

    try {
      const res = await api.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.avatarUrl) {
        useAuthStore.getState().updateUserAvatar(res.data.avatarUrl);
        toast.success('Foto de perfil atualizada com sucesso!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao atualizar foto de perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTheme = (themeId: 'dark' | 'midnight' | 'graphite' | 'light' | 'amoled') => {
    setSelectedTheme(themeId);
    localStorage.setItem('discordia_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    toast.success(`Tema ${themeId.toUpperCase()} aplicado!`);
  };

  const handleApplyAccent = (accentId: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose') => {
    setSelectedAccent(accentId);
    localStorage.setItem('discordia_accent', accentId);
    document.documentElement.setAttribute('data-accent', accentId);
    toast.success(`Cor de destaque alterada!`);
  };

  const handleSaveProfile = () => {
    toast.success('Perfil atualizado com sucesso!');
  };

  // Mic Testing Logic
  const startMicTest = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: audioSettings.inputDeviceId !== 'default' ? { exact: audioSettings.inputDeviceId } : undefined,
          noiseSuppression: audioSettings.noiseSuppression,
          echoCancellation: audioSettings.echoCancellation,
          autoGainControl: audioSettings.autoGainControl,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      setIsTestingMic(true);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        setMicVolumeLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
      toast.success('Teste de microfone iniciado! Fale algo para ver o nível de áudio.');
    } catch (err) {
      console.error('Erro ao testar microfone:', err);
      toast.error('Não foi possível acessar o microfone para teste.');
    }
  };

  const stopMicTest = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsTestingMic(false);
    setMicVolumeLevel(0);
  };

  const toggleMicTest = () => {
    if (isTestingMic) {
      stopMicTest();
      toast.success('Teste de microfone encerrado.');
    } else {
      startMicTest();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 select-none animate-fade-in-zoom">
      <div className="pulse-glass-card w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden border border-white/10 relative">
        
        {/* Left Sidebar Menu */}
        <div className="w-64 bg-[#090D12]/90 p-6 flex flex-col justify-between border-r border-white/5 shrink-0">
          <div className="space-y-6">
            <div className="flex items-center space-x-2 px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></div>
              <span className="font-extrabold text-xs tracking-wider uppercase text-white">DISCORDIA Configurações</span>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => { stopMicTest(); setActiveTab('profile'); }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer btn-motion ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-[#10B981]/20 to-transparent text-white border-l-2 border-[#10B981]'
                    : 'text-[#8B949E] hover:bg-white/5 hover:text-white'
                }`}
              >
                <UserCheck size={16} />
                <span>Perfil do Usuário</span>
              </button>

              <button
                onClick={() => setActiveTab('voice')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer btn-motion ${
                  activeTab === 'voice'
                    ? 'bg-gradient-to-r from-[#10B981]/20 to-transparent text-white border-l-2 border-[#10B981]'
                    : 'text-[#8B949E] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Mic size={16} />
                <span>Voz & Áudio (Supressão)</span>
              </button>

              <button
                onClick={() => { stopMicTest(); setActiveTab('system'); }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer btn-motion ${
                  activeTab === 'system'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-transparent text-white border-l-2 border-cyan-400'
                    : 'text-[#8B949E] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Palette size={16} />
                <span>Sistema & Temas</span>
              </button>
            </nav>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer btn-motion"
          >
            <LogOut size={16} />
            <span>Sair da Conta</span>
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-[#090D12]/70 p-8 overflow-y-auto relative">
          {/* Close button */}
          <button
            onClick={() => { stopMicTest(); closeModal(); }}
            className="absolute top-6 right-6 flex items-center space-x-1 text-[#8B949E] hover:text-white transition cursor-pointer btn-motion"
          >
            <X size={20} />
            <span className="text-[10px] font-mono tracking-widest uppercase">ESC</span>
          </button>

          {/* TAB 1: PERFIL DO USUÁRIO */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-extrabold text-white mb-1">Personalização do Perfil</h2>
                <p className="text-xs text-[#8B949E]">Edite seu avatar, banner (imagem ou vídeo), apelido e biografia.</p>
              </div>

              {/* Profile Card Live Preview */}
              <div className="pulse-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                {/* Banner Header */}
                <div className="h-32 relative bg-gradient-to-r from-[#10B981]/30 via-cyan-500/30 to-purple-500/30 overflow-hidden">
                  {bannerUrl ? (
                    isVideoBanner ? (
                      <video src={bannerUrl} autoPlay loop muted className="w-full h-full object-cover" />
                    ) : (
                      <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    )
                  ) : null}

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => bannerInputRef.current?.click()}
                      className="bg-black/60 hover:bg-black/80 text-xs px-3 py-1.5 rounded-lg text-white font-semibold backdrop-blur-sm flex items-center gap-1.5 transition cursor-pointer btn-motion"
                    >
                      <ImageIcon size={14} />
                      <span>Alterar Banner (GIF / Imagem)</span>
                    </button>
                    <input
                      type="file"
                      ref={bannerInputRef}
                      className="hidden"
                      accept="image/*,image/gif,video/mp4,video/webm"
                      onChange={handleBannerUpload}
                    />
                  </div>
                </div>

                {/* Avatar Bar */}
                <div className="p-4 pt-0 relative flex justify-between items-end">
                  <div className="relative -mt-12 ml-2">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-20 h-20 rounded-full border-4 border-[#090D12] bg-[#121820] overflow-hidden relative group cursor-pointer shadow-2xl"
                    >
                      {(() => {
                        const activeSrc = avatarPreview || (user?.avatarUrl ? getAvatarUrl(user.avatarUrl) : null);
                        if (activeSrc && !imgError) {
                          return (
                            <img
                              src={activeSrc}
                              alt=""
                              onError={() => setImgError(true)}
                              className="w-full h-full object-cover"
                            />
                          );
                        }
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-[#10B981] text-2xl font-bold text-black">
                            {user?.username?.charAt(0).toUpperCase()}
                          </div>
                        );
                      })()}
                      <div className="absolute inset-0 bg-black/60 hidden group-hover:flex flex-col items-center justify-center text-white transition-all">
                        <Upload size={18} />
                      </div>
                    </div>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                </div>

                {/* Info Fields */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#8B949E] uppercase mb-1">Apelido (Display Name)</label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full bg-[#121820] text-xs text-white px-3 py-2 rounded-xl border border-white/10 outline-none focus:border-[#10B981]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#8B949E] uppercase mb-1">Usuário</label>
                      <input
                        type="text"
                        disabled
                        value={`${user.username}#${user.discriminator || '0001'}`}
                        className="w-full bg-[#121820]/50 text-xs text-[#8B949E] px-3 py-2 rounded-xl border border-white/5 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#8B949E] uppercase mb-1">Sobre Mim (Bio)</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-[#121820] text-xs text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 btn-motion cursor-pointer"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VOZ & ÁUDIO (SUPRESSÃO DE RUÍDO & DSP) */}
          {activeTab === 'voice' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-extrabold text-white mb-1">Configurações de Voz & Áudio</h2>
                <p className="text-xs text-[#8B949E]">Ajuste a supressão de ruído, cancelamento de eco, ganho e selecione seus dispositivos de áudio.</p>
              </div>

              {/* 1. Device Selection (Input & Output) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-white uppercase tracking-wider">
                    Dispositivo de Entrada (Microfone)
                  </label>
                  <select
                    value={audioSettings.inputDeviceId}
                    onChange={(e) => updateAudioSettings({ inputDeviceId: e.target.value })}
                    className="w-full bg-[#121820] text-xs text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] font-semibold"
                  >
                    <option value="default">Microfone Padrão do Sistema</option>
                    {audioInputDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microfone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-white uppercase tracking-wider">
                    Dispositivo de Saída (Alto-falante / Fone)
                  </label>
                  <select
                    value={audioSettings.outputDeviceId}
                    onChange={(e) => updateAudioSettings({ outputDeviceId: e.target.value })}
                    className="w-full bg-[#121820] text-xs text-white p-3 rounded-xl border border-white/10 outline-none focus:border-[#10B981] font-semibold"
                  >
                    <option value="default">Alto-falante Padrão do Sistema</option>
                    {audioOutputDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Alto-falante ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Live Mic Testing & VU Meter */}
              <div className="pulse-glass-card p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Mic size={18} className="text-[#10B981]" />
                    <span className="text-xs font-extrabold text-white uppercase tracking-wider">Teste de Microfone em Tempo Real</span>
                  </div>
                  <button
                    onClick={toggleMicTest}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer btn-motion flex items-center gap-1.5 ${
                      isTestingMic
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white'
                        : 'bg-[#10B981] text-black shadow-lg shadow-emerald-500/20 hover:bg-[#059669]'
                    }`}
                  >
                    {isTestingMic ? <MicOff size={14} /> : <Mic size={14} />}
                    <span>{isTestingMic ? 'Parar Teste' : 'Testar Microfone'}</span>
                  </button>
                </div>

                {/* Animated VU Meter Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-[#8B949E]">
                    <span>Nível de Captação da Voz</span>
                    <span className="text-[#10B981] font-bold">{micVolumeLevel}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#090D12] rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                    <div
                      className="h-full bg-gradient-to-r from-[#10B981] via-cyan-400 to-[#10B981] rounded-full transition-all duration-75 shadow-lg shadow-emerald-500/30"
                      style={{ width: `${micVolumeLevel}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 3. Advanced Digital Signal Processing (DSP Controls) */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-white uppercase tracking-wider">
                  Processamento Digital de Áudio (Filtros DSP)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Noise Suppression Toggle */}
                  <div
                    onClick={() => updateAudioSettings({ noiseSuppression: !audioSettings.noiseSuppression })}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-24 btn-motion ${
                      audioSettings.noiseSuppression
                        ? 'bg-gradient-to-r from-[#10B981]/20 to-transparent border-[#10B981] shadow-lg shadow-emerald-500/10'
                        : 'bg-[#121820]/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-[#10B981]">
                        <ShieldCheck size={18} />
                        <span className="text-xs font-extrabold text-white">Supressão de Ruído</span>
                      </div>
                      {audioSettings.noiseSuppression && <Check size={16} className="text-[#10B981]" />}
                    </div>
                    <span className="text-[10px] text-[#8B949E]">Filtra barulhos de teclado, ventiladores e ruídos de fundo.</span>
                  </div>

                  {/* Echo Cancellation Toggle */}
                  <div
                    onClick={() => updateAudioSettings({ echoCancellation: !audioSettings.echoCancellation })}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-24 btn-motion ${
                      audioSettings.echoCancellation
                        ? 'bg-gradient-to-r from-cyan-500/20 to-transparent border-cyan-400 shadow-lg shadow-cyan-500/10'
                        : 'bg-[#121820]/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-cyan-400">
                        <Volume2 size={18} />
                        <span className="text-xs font-extrabold text-white">Cancelamento de Eco</span>
                      </div>
                      {audioSettings.echoCancellation && <Check size={16} className="text-cyan-400" />}
                    </div>
                    <span className="text-[10px] text-[#8B949E]">Elimina retornos de áudio dos alto-falantes no microfone.</span>
                  </div>

                  {/* Auto Gain Control Toggle */}
                  <div
                    onClick={() => updateAudioSettings({ autoGainControl: !audioSettings.autoGainControl })}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-24 btn-motion ${
                      audioSettings.autoGainControl
                        ? 'bg-gradient-to-r from-purple-500/20 to-transparent border-purple-400 shadow-lg shadow-purple-500/10'
                        : 'bg-[#121820]/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-purple-400">
                        <Zap size={18} />
                        <span className="text-xs font-extrabold text-white">Ganho Automático</span>
                      </div>
                      {audioSettings.autoGainControl && <Check size={16} className="text-purple-400" />}
                    </div>
                    <span className="text-[10px] text-[#8B949E]">Nivela o volume da sua voz automaticamente em tempo real.</span>
                  </div>
                </div>
              </div>

              {/* 4. Audio Mode Selection (Voice vs Hifi Studio) */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-white uppercase tracking-wider">Modo de Transmissão de Áudio</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateAudioSettings({ audioMode: 'voice' })}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left btn-motion ${
                      audioSettings.audioMode === 'voice'
                        ? 'bg-[#10B981]/20 border-[#10B981] text-white shadow-md shadow-emerald-500/10'
                        : 'bg-[#121820]/40 border-white/5 text-[#8B949E] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold">🎙️ Voz Inteligente</span>
                      {audioSettings.audioMode === 'voice' && <Check size={14} className="text-[#10B981]" />}
                    </div>
                    <span className="text-[10px] text-[#8B949E] block">Otimizado para conversação com supressão de ruído pesada.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateAudioSettings({ audioMode: 'hifi' })}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer text-left btn-motion ${
                      audioSettings.audioMode === 'hifi'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                        : 'bg-[#121820]/40 border-white/5 text-[#8B949E] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold">🎹 Música & Hifi (48kHz Estéreo)</span>
                      {audioSettings.audioMode === 'hifi' && <Check size={14} className="text-cyan-400" />}
                    </div>
                    <span className="text-[10px] text-[#8B949E] block">Sem compressão nem supressão agressiva para instrumentos e som de qualidade.</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SISTEMA & TEMAS VISUAIS */}
          {activeTab === 'system' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-extrabold text-white mb-1">Sistema & Temas Visuais</h2>
                <p className="text-xs text-[#8B949E]">Escolha o tema da interface (Dark, Midnight, Graphite, Light ou AMOLED) e a cor de destaque.</p>
              </div>

              {/* 5 Themes Selection Grid */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">Tema de Interface</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'dark', name: 'Dark', desc: 'Obsidian Glass (Padrão)', bg: '#090D12' },
                    { id: 'midnight', name: 'Midnight', desc: 'Azul Marinho Profundo', bg: '#080C19' },
                    { id: 'graphite', name: 'Graphite', desc: 'Cinza Slate Corporativo', bg: '#111318' },
                    { id: 'light', name: 'Light Modern', desc: 'Interface Clara Clean', bg: '#F8FAFC' },
                    { id: 'amoled', name: 'AMOLED', desc: 'Preto Pitch Absoluto #000', bg: '#000000' },
                  ].map((t) => {
                    const isSelected = selectedTheme === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => handleApplyTheme(t.id as any)}
                        className={`p-3 rounded-2xl cursor-pointer transition border flex flex-col justify-between h-20 ${
                          isSelected
                            ? 'border-[#10B981] bg-[#121820] shadow-lg shadow-emerald-500/10'
                            : 'border-white/5 bg-[#121820]/40 hover:border-white/20'
                        }`}
                        style={{ borderLeftColor: isSelected ? '#10B981' : undefined }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#FFFFFF]">{t.name}</span>
                          {isSelected && <Check size={14} className="text-[#10B981]" />}
                        </div>
                        <span className="text-[10px] text-[#8B949E]">{t.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">Cor de Destaque (Accent Color)</label>
                <div className="flex items-center space-x-3">
                  {[
                    { id: 'emerald', name: 'Emerald', color: '#10B981' },
                    { id: 'cyan', name: 'Cyan', color: '#06B6D4' },
                    { id: 'violet', name: 'Violet', color: '#8B5CF6' },
                    { id: 'amber', name: 'Amber', color: '#F59E0B' },
                    { id: 'rose', name: 'Rose', color: '#F43F5E' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleApplyAccent(a.id as any)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-black font-bold transition btn-motion border-2 ${
                        selectedAccent === a.id ? 'border-white shadow-xl scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: a.color }}
                      title={a.name}
                    >
                      {selectedAccent === a.id && <Check size={18} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#121820] rounded-2xl border border-white/5 text-xs text-[#8B949E]">
                <Shield size={16} className="text-[#10B981] inline mr-2" />
                <span>As personalizações visuais são armazenadas no navegador (`localStorage`) e afetam exclusivamente a sua sessão no DISCORDIA.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
