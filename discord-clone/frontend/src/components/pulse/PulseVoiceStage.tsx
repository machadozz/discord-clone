import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import '@livekit/components-styles';
import {
  VideoConference,
  useParticipants,
  useRoomContext,
  useTracks,
  VideoTrack,
  ControlBar,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { getAvatarUrl } from '../../utils/avatar';
import { 
  Loader2, Radio, UserPlus, PhoneOff, 
  VolumeX, Monitor, Settings, Maximize2, Minimize2, Maximize
} from 'lucide-react';
import toast from 'react-hot-toast';

function VoiceStageContent({ channelName }: { channelName: string }) {
  const participants = useParticipants();
  const room = useRoomContext();
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamSizeMode, setStreamSizeMode] = useState<'normal' | 'compact'>('normal');

  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);

      if (!room || !room.localParticipant) return;
      try {
        const publications = Array.from(room.localParticipant.videoTrackPublications.values());
        const screenSharePub = publications.find((pub) => pub.source === Track.Source.ScreenShare);
        const sender = screenSharePub?.track?.sender || (screenSharePub as any)?.sender;

        if (sender && typeof sender.getParameters === 'function') {
          const params = sender.getParameters();
          if (params.encodings && params.encodings[0]) {
            if (isFull) {
              // Fullscreen Mode: Lock native resolution & boost bitrate for crisp zero-artifact output
              (params as any).degradationPreference = 'maintain-resolution';
              params.encodings[0].maxBitrate = Math.max(params.encodings[0].maxBitrate || 22500000, 35000000);
              params.encodings[0].priority = 'high';
              params.encodings[0].networkPriority = 'high';
            } else {
              (params as any).degradationPreference = 'maintain-framerate';
            }
            await sender.setParameters(params);
            console.log('[WebRTC Fullscreen Quality] Nitidez maximizada sem artefatos!');
          }
        }
      } catch (e) {
        console.warn('Otimização de Fullscreen:', e);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [room]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (videoContainerRef.current) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
    }
  };
  const { activeServer, members } = useServerStore();
  const { user: currentUser } = useAuthStore();
  const { leaveVoiceChannel, audioSettings } = useVoiceStore();
  const { openModal } = useUIStore();
  const [audioUnlocked, setAudioUnlocked] = useState(true);

  // Active Screen Share Quality state (for persistence in modal)
  const [activeResolution, setActiveResolution] = useState<'720p' | '1080p' | '1440p' | '2k'>('1080p');
  const [activeFps, setActiveFps] = useState<30 | 60 | 120>(60);

  // Automatically attempt to unlock browser WebAudio playback on mount
  useEffect(() => {
    if (room) {
      room.startAudio().then(() => {
        setAudioUnlocked(true);
      }).catch(() => {
        setAudioUnlocked(false);
      });
    }
  }, [room]);

  // Enforce mandatory studio noise suppression on ALL microphone tracks for ALL participants
  useEffect(() => {
    if (!room) return;

    const enforceAudioConstraints = async () => {
      try {
        if (room.localParticipant) {
          const pubs = Array.from(room.localParticipant.audioTrackPublications.values());
          const micPub = pubs.find((p) => p.source === Track.Source.Microphone);
          
          if (!micPub) {
            await room.localParticipant.setMicrophoneEnabled(true, {
              noiseSuppression: true,
              echoCancellation: true,
              autoGainControl: true,
            });
          } else if (micPub.track?.mediaStreamTrack) {
            const track = micPub.track.mediaStreamTrack;
            await track.applyConstraints({
              deviceId: audioSettings.inputDeviceId !== 'default' ? { exact: audioSettings.inputDeviceId } : undefined,
              noiseSuppression: audioSettings.noiseSuppression ?? true,
              echoCancellation: audioSettings.echoCancellation ?? true,
              autoGainControl: audioSettings.autoGainControl ?? true,
              sampleRate: audioSettings.audioMode === 'hifi' ? 48000 : 44100,
            });
          }
        }
      } catch (err) {
        console.warn('[WebAudio DSP] Enforcing noise suppression:', err);
      }
    };

    enforceAudioConstraints();
    const interval = setInterval(enforceAudioConstraints, 2000);

    room.on(RoomEvent.LocalTrackPublished, enforceAudioConstraints);
    room.on(RoomEvent.TrackSubscribed, enforceAudioConstraints);

    return () => {
      clearInterval(interval);
      room.off(RoomEvent.LocalTrackPublished, enforceAudioConstraints);
      room.off(RoomEvent.TrackSubscribed, enforceAudioConstraints);
    };
  }, [room, audioSettings]);

  const handleUnlockAudio = async () => {
    if (room) {
      try {
        await room.startAudio();
        setAudioUnlocked(true);
        toast.success('Áudio da chamada ativado!');
      } catch (err) {
        console.error('Falha ao ativar áudio:', err);
      }
    }
  };

  const handleCopyInvite = () => {
    if (activeServer?.inviteCode) {
      navigator.clipboard.writeText(activeServer.inviteCode);
      toast.success('Código de convite copiado!');
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link de convite copiado!');
    }
  };

  // Helper 2: Codec Preferences (AV1 / VP9 -> VP8 / H264 fallback)
  const applyCodecPreferences = (transceiver: RTCRtpTransceiver) => {
    try {
      if (typeof RTCRtpSender.getCapabilities === 'function' && transceiver && typeof transceiver.setCodecPreferences === 'function') {
        const capabilities = RTCRtpSender.getCapabilities('video');
        if (capabilities && capabilities.codecs) {
          const preferredCodecs = capabilities.codecs.filter((codec) => {
            const name = codec.mimeType.toLowerCase();
            return name.includes('av1') || name.includes('vp9') || name.includes('vp8') || name.includes('h264');
          });

          preferredCodecs.sort((a, b) => {
            const mimeA = a.mimeType.toLowerCase();
            const mimeB = b.mimeType.toLowerCase();
            const getRank = (m: string) => (m.includes('av1') ? 1 : m.includes('vp9') ? 2 : m.includes('h264') ? 3 : 4);
            return getRank(mimeA) - getRank(mimeB);
          });

          if (preferredCodecs.length > 0) {
            transceiver.setCodecPreferences(preferredCodecs);
          }
        }
      }
    } catch (e) {
      console.warn('[WebRTC Engine] Configuração de codec:', e);
    }
  };

  // Helper: Optimize RTCRtpSender & Quality Parameters
  const optimizeRtpSender = async (screenSharePub: any, options: { maxBitrate: number; frameRate: number }) => {
    try {
      if (!screenSharePub) return;
      
      if (screenSharePub.track?.mediaStreamTrack) {
        const mediaTrack = screenSharePub.track.mediaStreamTrack;
        if ('contentHint' in mediaTrack) {
          mediaTrack.contentHint = 'motion';
        }
      }

      const sender = screenSharePub.track?.sender || (screenSharePub as any).sender;
      if (sender && typeof sender.getParameters === 'function') {
        const params = sender.getParameters();
        if (!params.encodings || params.encodings.length === 0) {
          params.encodings = [{}];
        }

        params.encodings[0].maxBitrate = options.maxBitrate;
        params.encodings[0].maxFramerate = options.frameRate;
        params.encodings[0].priority = 'high';
        params.encodings[0].networkPriority = 'high';
        (params as any).degradationPreference = 'maintain-framerate';
        (params.encodings[0] as any).powerPreference = 'high-performance';

        await sender.setParameters(params);
      }

      if ((screenSharePub as any).transceiver) {
        applyCodecPreferences((screenSharePub as any).transceiver);
      }

      if (typeof screenSharePub.setVideoBitrate === 'function') {
        await screenSharePub.setVideoBitrate(options.maxBitrate);
      }
    } catch (err) {
      console.warn('Configuração de RTCRtpSender aplicada:', err);
    }
  };

  // Helper 5: Telemetry & Automatic Adaptive Quality Fallback Loop via sender.getStats()
  useEffect(() => {
    if (!room || !room.localParticipant) return;

    const intervalId = setInterval(async () => {
      try {
        if (!room.localParticipant.isScreenShareEnabled) return;

        const publications = Array.from(room.localParticipant.videoTrackPublications.values());
        const screenSharePub = publications.find((pub) => pub.source === Track.Source.ScreenShare);
        const sender = screenSharePub?.track?.sender || (screenSharePub as any)?.sender;

        if (sender && typeof sender.getStats === 'function') {
          const stats = await sender.getStats();
          stats.forEach((report: any) => {
            if (report.type === 'outbound-rtp' && report.kind === 'video') {
              const framesDropped = report.framesDropped || 0;
              const framesSent = report.framesSent || 0;
              const totalFrames = framesSent + framesDropped;
              const dropRate = totalFrames > 0 ? framesDropped / totalFrames : 0;
              const qualityLimitationReason = report.qualityLimitationReason || 'none';
              const fps = report.framesPerSecond || 0;

              console.log(`[WebRTC Telemetry] FPS: ${fps} | Frames Enviados: ${framesSent} | Perda: ${(dropRate * 100).toFixed(1)}% | Limitação: ${qualityLimitationReason}`);

              // Fallback automático se a perda for superior a 15% ou se a CPU estiver sob contenção
              if (framesSent > 30 && (dropRate > 0.15 || (qualityLimitationReason === 'cpu' && framesDropped > 15))) {
                console.warn('[WebRTC Adaptive Fallback] Contenção de CPU/Rede detectada. Ajustando taxa de quadros adaptativamente para 30 FPS...');
                if (screenSharePub?.track?.mediaStreamTrack) {
                  screenSharePub.track.mediaStreamTrack.applyConstraints({
                    frameRate: { ideal: 30, max: 30 },
                  }).catch(() => {});
                }
              }
            }
          });
        }
      } catch (err) {
        // Silent catch for stats interval
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [room]);

  // Screen Share Quality Selection Modal Trigger
  const handleOpenQualityModal = useCallback(() => {
    if (!room || !room.localParticipant) return;

    const isSharing = room.localParticipant.isScreenShareEnabled;

    openModal('screenShare', {
      currentResolution: activeResolution,
      currentFps: activeFps,
      isSharing,
      onConfirm: async (options: {
        width: number;
        height: number;
        frameRate: number;
        maxBitrate: number;
        resolutionId: '720p' | '1080p' | '1440p' | '2k';
        includeAudio?: boolean;
      }) => {
        try {
          setActiveResolution(options.resolutionId);
          setActiveFps(options.frameRate as any);

          const publications = Array.from(room.localParticipant.videoTrackPublications.values());
          const screenSharePub = publications.find((pub) => pub.source === Track.Source.ScreenShare);

          if (isSharing && screenSharePub && screenSharePub.track) {
            const mediaTrack = screenSharePub.track.mediaStreamTrack;
            if ('contentHint' in mediaTrack) {
              mediaTrack.contentHint = 'motion';
            }

            await mediaTrack.applyConstraints({
              width: { ideal: options.width, max: options.width },
              height: { ideal: options.height, max: options.height },
              frameRate: { ideal: options.frameRate, max: options.frameRate },
            });

            await optimizeRtpSender(screenSharePub, options);
            toast.success(`Transmissão ajustada para ${options.resolutionId.toUpperCase()} @ ${options.frameRate} FPS!`);
          } else {
            await room.localParticipant.setScreenShareEnabled(true, {
              resolution: {
                width: options.width,
                height: options.height,
                frameRate: options.frameRate,
              },
              screenShareEncoding: {
                maxBitrate: options.maxBitrate,
                maxFramerate: options.frameRate,
                priority: 'high',
              },
              simulcast: false,
              audio: options.includeAudio ?? true,
            });

            setTimeout(async () => {
              const newPubs = Array.from(room.localParticipant.videoTrackPublications.values());
              const newScreenPub = newPubs.find((pub) => pub.source === Track.Source.ScreenShare);
              if (newScreenPub) {
                await optimizeRtpSender(newScreenPub, options);
              }
            }, 300);

            toast.success(`Transmissão iniciada em ${options.resolutionId.toUpperCase()} @ ${options.frameRate} FPS!`);
          }
        } catch (error: any) {
          console.warn('Transmissão de tela finalizada:', error);
          if (error?.name !== 'NotAllowedError') {
            toast.error('Não foi possível iniciar a transmissão.');
          }
        }
      },
    });
  }, [room, activeResolution, activeFps, openModal]);

  // Intercept click on LiveKit's screen share button to show Quality Selector
  useEffect(() => {
    const handleBarClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('button');
      if (btn) {
        const text = (btn.textContent || '').toLowerCase();
        const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
        const className = (btn.className || '').toLowerCase();
        
        if (target.closest('.pulse-glass-card') && !target.closest('.lk-video-conference')) {
          return;
        }

        if (
          text.includes('share') || 
          text.includes('screen') || 
          text.includes('tela') || 
          aria.includes('screen') || 
          className.includes('screenshare') ||
          className.includes('lk-button-screen-share')
        ) {
          e.preventDefault();
          e.stopPropagation();
          handleOpenQualityModal();
        }
      }
    };

    document.addEventListener('click', handleBarClick, true);
    return () => {
      document.removeEventListener('click', handleBarClick, true);
    };
  }, [handleOpenQualityModal]);

  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const activeScreenTrack = screenTracks.find((t) => t.publication) || screenTracks[0];

  // Helper: Get avatar URL for a participant in the voice call
  const getParticipantAvatar = (identity: string): string | null => {
    if (currentUser && (identity === currentUser.username || identity === currentUser.id)) {
      return currentUser.avatarUrl ? getAvatarUrl(currentUser.avatarUrl) : null;
    }
    const foundMember = members.find(m => (m.user?.username === identity || m.user?.id === identity || m.id === identity));
    if (foundMember?.user?.avatarUrl) {
      return getAvatarUrl(foundMember.user.avatarUrl);
    }
    return currentUser?.avatarUrl ? getAvatarUrl(currentUser.avatarUrl) : null;
  };

  // Helper: Get clean display username for a participant
  const getParticipantName = (identity: string): string => {
    if (currentUser && (identity === currentUser.username || identity === currentUser.id)) {
      return currentUser.username;
    }
    const foundMember = members.find(m => (m.user?.username === identity || m.user?.id === identity || m.id === identity));
    if (foundMember?.user?.username) {
      return foundMember.user.username;
    }
    if (foundMember?.username) {
      return foundMember.username;
    }
    if (identity.length > 20 || identity.includes('-')) {
      return currentUser?.username || 'Usuário';
    }
    return identity;
  };

  // Check if ANY participant is currently sharing screen or has video active
  const anyScreenShareActive = participants.some(p => p.isScreenShareEnabled) || room?.localParticipant?.isScreenShareEnabled;

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#090D12] relative overflow-hidden select-none">
      {/* Top Stage Navigation Header */}
      <div className="h-14 pulse-glass-nav flex items-center px-6 justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></div>
          <Radio size={18} className="text-[#10B981]" />
          <span className="font-bold text-sm text-white tracking-wide truncate max-w-[200px]">
            {channelName || 'Palco de Voz'}
          </span>
          <span className="text-xs bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2.5 py-0.5 rounded-full font-mono">
            {participants.length} CONECTADO(S)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {!audioUnlocked && (
            <button
              onClick={handleUnlockAudio}
              className="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-amber-500/30 btn-motion"
              title="Clique para permitir que o navegador toque o áudio dos participantes"
            >
              <VolumeX size={14} />
              <span>Ativar Áudio</span>
            </button>
          )}

          <button
            onClick={handleOpenQualityModal}
            className="bg-[#10B981]/20 hover:bg-[#10B981] text-[#10B981] hover:text-black border border-[#10B981]/40 px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer btn-motion shadow-lg shadow-emerald-500/20"
            title="Escolha a qualidade da transmissão (1080p / 60 FPS)"
          >
            <Monitor size={14} />
            <span>Transmitir Tela ({activeResolution.toUpperCase()})</span>
          </button>

          <button
            onClick={() => openModal('userSettings')}
            className="bg-[#121820] hover:bg-[#1A222D] text-[#8B949E] hover:text-white border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-motion"
            title="Configurações de Áudio & Supressão de Ruído"
          >
            <Settings size={14} className="text-[#10B981]" />
            <span className="hidden sm:inline">Áudio & Voz</span>
          </button>

          <button
            onClick={handleCopyInvite}
            className="bg-[#121820] hover:bg-[#1A222D] text-[#10B981] border border-[#10B981]/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer btn-motion"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Convidar</span>
          </button>

          <button
            onClick={leaveVoiceChannel}
            className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer btn-motion"
          >
            <PhoneOff size={14} />
            <span>Sair da Sala</span>
          </button>
        </div>
      </div>

      {/* Responsive Center Video/Audio Conference Stage */}
      <div ref={stageContainerRef} className="flex-1 overflow-hidden relative p-3 flex flex-col items-center justify-center w-full bg-[#090D12]">
        <div className="w-full h-full pulse-glass-card rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border border-white/10">
          {anyScreenShareActive && activeScreenTrack ? (
            <div className="w-full h-full flex flex-col bg-[#090D12] overflow-hidden relative">
              {/* Flex Row Stage: Left Sidebar + Right Stream Video */}
              <div className="flex-1 flex flex-row gap-3 p-3 overflow-hidden">
                {/* Left Column: Participant Cards Sidebar (HIDDEN in Fullscreen mode!) */}
                {!isFullscreen && (
                  <div className="w-44 shrink-0 flex flex-col gap-3 h-full overflow-y-auto custom-scrollbar pointer-events-auto pr-1 z-10">
                    {participants.map((p) => {
                      const avatarUrl = getParticipantAvatar(p.identity);
                      const displayName = getParticipantName(p.identity);
                      const isSpeaking = p.isSpeaking;

                      return (
                        <div
                          key={p.sid}
                          className={`w-full h-28 bg-[#090D12]/95 border rounded-2xl p-3 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-xl shrink-0 overflow-hidden transition-all ${
                            isSpeaking ? 'border-[#10B981] shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105' : 'border-white/10'
                          }`}
                        >
                          {/* Avatar Container with Animated Glow Aura (Contained 100% inside card) */}
                          <div className="relative flex flex-col items-center justify-center">
                            <div
                              className={`absolute w-20 h-20 rounded-full blur-md transition-all pointer-events-none bg-[conic-gradient(from_0deg,#10B981,#06B6D4,#10B981)] animate-aura-spin ${
                                isSpeaking ? 'opacity-90 scale-125' : 'opacity-40 scale-100'
                              }`}
                            ></div>

                            <div
                              className={`w-12 h-12 rounded-full overflow-hidden border-2 relative shadow-lg flex items-center justify-center transition-all z-10 ${
                                isSpeaking ? 'border-[#10B981] scale-105' : 'border-[#10B981]/50 bg-[#121820]'
                              }`}
                            >
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-[#10B981] to-[#06B6D4] text-black font-black text-xs flex items-center justify-center rounded-full">
                                  {(displayName || 'U').charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Display Username Badge (Contained 100% inside card) */}
                          <div className="mt-2 text-[10px] font-black text-white px-2.5 py-0.5 rounded-full bg-[#121820] border border-white/10 truncate max-w-[130px] z-10 tracking-wide text-center">
                            {displayName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Right Column: Screen Share Video (Fills 100% of display in Fullscreen mode!) */}
                <div
                  ref={videoContainerRef}
                  className={`flex-1 h-full relative flex items-center justify-center bg-black overflow-hidden group ${
                    isFullscreen ? 'w-full h-full border-none rounded-none p-0' : 'rounded-2xl border border-white/10'
                  }`}
                >
                  <VideoTrack
                    trackRef={activeScreenTrack}
                    className={`w-full h-full transition-all duration-300 ${
                      !isFullscreen && streamSizeMode === 'compact'
                        ? 'object-contain p-8 max-w-[85%] max-h-[85%]'
                        : 'object-contain p-0'
                    } ${isFullscreen ? 'rounded-none' : 'rounded-2xl'}`}
                  />

                  {/* Floating Quick Stream Controls (Top Right of Video Stream) */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-30 opacity-90 hover:opacity-100 transition-opacity">
                    {!isFullscreen && (
                      <button
                        type="button"
                        onClick={() => setStreamSizeMode((prev) => (prev === 'normal' ? 'compact' : 'normal'))}
                        className="bg-[#090D12]/90 hover:bg-[#10B981] text-white hover:text-black border border-white/20 px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xl backdrop-blur-md btn-motion"
                        title={streamSizeMode === 'normal' ? 'Diminuir tamanho da transmissão' : 'Expandir tamanho da transmissão'}
                      >
                        {streamSizeMode === 'normal' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        <span className="hidden sm:inline text-[11px] font-black">
                          {streamSizeMode === 'normal' ? 'Diminuir Tamanho' : 'Expandir Tamanho'}
                        </span>
                      </button>
                    )}

                    {/* Tela Cheia (Fullscreen) */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="bg-[#10B981]/20 hover:bg-[#10B981] text-[#10B981] hover:text-black border border-[#10B981]/50 px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xl backdrop-blur-md btn-motion"
                      title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia (Fullscreen)'}
                    >
                      {isFullscreen ? <Minimize2 size={16} /> : <Maximize size={16} />}
                      <span className="hidden sm:inline text-[11px] font-black">
                        {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Control Bar (Microphone, Camera, Screen Share, Leave - HIDDEN in Fullscreen mode for 100% video immersion) */}
              {!isFullscreen && (
                <div className="py-2.5 px-4 bg-[#090D12] flex items-center justify-center shrink-0 z-30 border-t border-white/10">
                  <ControlBar
                    controls={{
                      microphone: true,
                      camera: true,
                      screenShare: true,
                      chat: false,
                      leave: true,
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <VideoConference />
          )}

          {/* Participant Real Avatar & Glow Aura Overlay (ONLY shown when NO screen share is active) */}
          {!anyScreenShareActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-6 p-6 z-10 flex-wrap">
              {participants.map((p) => {
                const isCameraOn = p.isCameraEnabled;
                const isScreenShareOn = p.isScreenShareEnabled;
                if (isCameraOn || isScreenShareOn) return null;

                const avatarUrl = getParticipantAvatar(p.identity);
                const displayName = getParticipantName(p.identity);
                const isSpeaking = p.isSpeaking;

                return (
                  <div
                    key={p.sid}
                    className={`relative flex flex-col items-center justify-center transition-all ${
                      isSpeaking ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    {/* Concentric Animated Soundwave Pulse Rings */}
                    <div className="absolute w-28 h-28 rounded-full border-2 border-[#10B981]/50 animate-soundwave-ripple-1 pointer-events-none"></div>
                    <div className="absolute w-28 h-28 rounded-full border-2 border-[#06B6D4]/50 animate-soundwave-ripple-2 pointer-events-none"></div>

                    {/* 360-degree Rotating Conic Energy Aura Behind Avatar */}
                    <div
                      className={`absolute w-40 h-40 rounded-full blur-2xl transition-all duration-700 pointer-events-none bg-[conic-gradient(from_0deg,#10B981,#06B6D4,#8B5CF6,#10B981)] animate-aura-spin ${
                        isSpeaking ? 'opacity-95 scale-135' : 'opacity-60 scale-100'
                      }`}
                    ></div>

                    {/* Avatar Circle with Glowing Neon Ring */}
                    <div
                      className={`w-28 h-28 rounded-full overflow-hidden border-4 relative shadow-2xl flex items-center justify-center transition-all z-10 ${
                        isSpeaking
                          ? 'border-[#10B981] shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-105'
                          : 'border-[#10B981]/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-[#121820]'
                      }`}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-[#10B981] to-[#06B6D4] text-black font-black text-3xl flex items-center justify-center rounded-full">
                          {(displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Clean Display Name Badge Below Photo */}
                    <div className="mt-3 bg-[#090D12]/95 border border-white/15 px-4 py-1 rounded-full text-xs font-black text-white shadow-xl z-10 tracking-wide">
                      {displayName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PulseVoiceStage() {
  const { channelId } = useParams();
  const { channels, activeChannel: storeActiveChannel, activeServer } = useServerStore();
  const { voiceToken, livekitUrl, connectedChannelId, joinVoiceChannel, channelMembers } = useVoiceStore();

  const currentChannel = channels.find((c) => c.id === channelId) || storeActiveChannel;

  if (!currentChannel) {
    return (
      <div className="flex-1 bg-[#090D12] flex items-center justify-center text-[#8B949E] text-xs">
        Canal de voz não encontrado.
      </div>
    );
  }

  const targetChannelId = currentChannel.id;
  const isConnected = connectedChannelId === targetChannelId;
  const members = channelMembers[targetChannelId] || [];

  const handleCopyInvite = () => {
    if (activeServer?.inviteCode) {
      navigator.clipboard.writeText(activeServer.inviteCode);
      toast.success('Código de convite copiado!');
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link de convite copiado!');
    }
  };

  // If not connected yet, show the Voice Preview Card
  if (!isConnected) {
    return (
      <div className="flex-1 bg-[#090D12] flex flex-col items-center justify-center h-full relative p-6 select-none animate-fade-in-zoom">
        <div className="pulse-glass-card max-w-lg w-full rounded-3xl p-8 text-center border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#10B981] via-[#06B6D4] to-[#10B981]"></div>
          
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-[#10B981]/20 to-[#06B6D4]/20 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <Radio size={40} className="animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-[#F0F6FC] tracking-tight uppercase mb-2">{currentChannel.name}</h2>
          <p className="text-xs text-[#8B949E] mb-6 font-medium">
            {members.length > 0 ? `${members.length} participante(s) nesta sala` : 'Ninguém conectado no momento'}
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => joinVoiceChannel(targetChannelId)}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer text-sm tracking-wide btn-motion"
            >
              Entrar na Chamada
            </button>

            <button
              onClick={handleCopyInvite}
              className="w-full bg-[#121820] hover:bg-[#1A222D] text-[#10B981] border border-[#10B981]/30 font-semibold py-3 px-6 rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-2 btn-motion"
            >
              <UserPlus size={16} />
              <span>Convidar Pessoas para a Chamada</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connecting to LiveKit
  if (!voiceToken || !livekitUrl) {
    return (
      <div className="flex-1 bg-[#090D12] flex items-center justify-center text-white h-full">
        <Loader2 className="animate-spin mr-2 text-[#10B981]" />
        <span className="text-xs font-semibold tracking-wider uppercase text-[#8B949E]">Conectando ao WebRTC...</span>
      </div>
    );
  }

  // Active call content (uses parent LiveKitRoom context)
  return <VoiceStageContent channelName={currentChannel.name} />;
}
