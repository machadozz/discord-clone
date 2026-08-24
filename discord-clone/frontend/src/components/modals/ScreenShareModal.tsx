import { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { X, Monitor, Zap, Sparkles, ShieldCheck, Volume2, VolumeX, Check } from 'lucide-react';

export interface ScreenShareOptions {
  width: number;
  height: number;
  frameRate: number;
  maxBitrate: number;
  resolutionId: '720p' | '1080p' | '1440p' | '2k';
  includeAudio?: boolean;
}

export function ScreenShareModal() {
  const { closeModal, modalData } = useUIStore();

  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '2k'>(
    modalData?.currentResolution || '1080p'
  );
  const [fps, setFps] = useState<30 | 60 | 120>(modalData?.currentFps || 60);
  const [includeAudio, setIncludeAudio] = useState(true);

  const handleStartShare = () => {
    let width = 1920;
    let height = 1080;
    let maxBitrate = fps === 120 ? 30000000 : fps === 60 ? 22500000 : 15000000;

    if (resolution === '720p') {
      width = 1280;
      height = 720;
      maxBitrate = fps === 120 ? 18000000 : fps === 60 ? 12000000 : 8000000;
    } else if (resolution === '1080p') {
      width = 1920;
      height = 1080;
      maxBitrate = fps === 120 ? 30000000 : fps === 60 ? 22500000 : 15000000; // 22.5 Mbps @ 60 FPS (1.5x do original de 15 Mbps)
    } else if (resolution === '1440p') {
      width = 2560;
      height = 1440;
      maxBitrate = fps === 120 ? 40000000 : fps === 60 ? 32000000 : 22500000;
    } else if (resolution === '2k') {
      width = 2560;
      height = 1440;
      maxBitrate = fps === 120 ? 60000000 : fps === 60 ? 50000000 : 35000000;
    }

    if (modalData?.onConfirm) {
      modalData.onConfirm({
        width,
        height,
        frameRate: fps,
        maxBitrate,
        resolutionId: resolution,
        includeAudio,
      });
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 select-none animate-fade-in-zoom">
      <div className="pulse-glass-card w-full max-w-md rounded-3xl p-6 text-white border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#10B981]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#10B981]/20 to-cyan-500/20 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Taxa de Quadros & Fluidez (Até 120 FPS)</h2>
              <span className="text-[10px] text-[#10B981] font-mono uppercase tracking-wider">Modo Ultra High Hz eSports</span>
            </div>
          </div>
          <button onClick={closeModal} className="text-[#8B949E] hover:text-white transition cursor-pointer btn-motion">
            <X size={20} />
          </button>
        </div>

        {/* Resolution Selection */}
        <div className="space-y-2 relative z-10">
          <label className="block text-xs font-extrabold text-[#8B949E] uppercase tracking-wider">
            Resolução & Banda da Transmissão
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: '720p', label: '720p HD High', bitrate: '12.0 Mbps' },
              { id: '1080p', label: '1080p Full HD (1.5x)', bitrate: '22.5 Mbps (1.5x Banda)' },
              { id: '1440p', label: '1440p Quad HD', bitrate: '32.0 Mbps' },
              { id: '2k', label: '2K Extreme Gaming', bitrate: '50.0 Mbps' },
            ].map((res) => {
              const isSelected = resolution === res.id;
              return (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => setResolution(res.id as any)}
                  className={`p-3 rounded-2xl border text-xs font-bold transition cursor-pointer btn-motion flex flex-col justify-between h-16 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#10B981]/20 to-cyan-500/20 border-[#10B981] text-white shadow-lg shadow-emerald-500/15'
                      : 'bg-[#121820]/60 border-white/5 text-[#8B949E] hover:bg-[#121820] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-extrabold">{res.label}</span>
                    {isSelected && <Check size={14} className="text-[#10B981]" />}
                  </div>
                  <span className="text-[10px] font-mono text-[#10B981] truncate">{res.bitrate}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Frame Rate (FPS) Selection */}
        <div className="space-y-2 relative z-10">
          <label className="block text-xs font-extrabold text-[#8B949E] uppercase tracking-wider">
            Taxa de Quadros & Fluidez (FPS)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { fps: 30, label: '30 FPS', desc: 'Estável' },
              { fps: 60, label: '60 FPS Ultra', desc: '60 Hz Fluido' },
              { fps: 120, label: '120 FPS eSports', desc: '120 Hz Máxima' },
            ].map((item) => {
              const isSelected = fps === item.fps;
              return (
                <button
                  key={item.fps}
                  type="button"
                  onClick={() => setFps(item.fps as any)}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer btn-motion flex flex-col justify-between h-16 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/15'
                      : 'bg-[#121820]/60 border-white/5 text-[#8B949E] hover:bg-[#121820] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-extrabold">{item.label}</span>
                    {isSelected && <Check size={14} className="text-cyan-400" />}
                  </div>
                  <span className="text-[9px] font-mono text-cyan-400 truncate">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Toggle Button */}
        <div className="relative z-10">
          <button
            type="button"
            onClick={() => setIncludeAudio((prev) => !prev)}
            className={`w-full py-2.5 px-4 rounded-2xl border text-xs font-bold transition cursor-pointer btn-motion flex items-center justify-between ${
              includeAudio
                ? 'bg-[#10B981]/20 border-[#10B981] text-white shadow-sm shadow-emerald-500/10'
                : 'bg-[#121820]/80 border-white/10 text-[#8B949E]'
            }`}
          >
            <div className="flex items-center gap-2">
              {includeAudio ? (
                <Volume2 size={16} className="text-[#10B981]" />
              ) : (
                <VolumeX size={16} className="text-rose-400" />
              )}
              <span>{includeAudio ? 'Áudio do Sistema / Jogo Ativado' : 'Áudio do Sistema Desativado'}</span>
            </div>
            {includeAudio && <Check size={14} className="text-[#10B981]" />}
          </button>
        </div>

        <div className="flex items-center space-x-2.5 text-[11px] text-[#8B949E] bg-[#121820] p-3 rounded-2xl border border-white/5 relative z-10">
          <ShieldCheck size={18} className="text-[#10B981] shrink-0" />
          <span>Configurado para {resolution.toUpperCase()} @ {fps} FPS com encodificação de alta velocidade GPU.</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-2 relative z-10">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 text-xs font-bold text-[#8B949E] hover:text-white transition cursor-pointer btn-motion"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleStartShare}
            className="bg-gradient-to-r from-[#10B981] via-cyan-400 to-[#10B981] text-black font-black text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-500/25 btn-motion cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span>{modalData?.isSharing ? `Aplicar ${fps} FPS` : `Iniciar Transmissão (${fps} FPS)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
