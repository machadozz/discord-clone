import { useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { AudioPresets } from 'livekit-client';
import '@livekit/components-styles';
import { useVoiceStore } from '../../store/useVoiceStore';
import { Loader2 } from 'lucide-react';

function VoiceRoomContent() {
  const room = useRoomContext();
  const { audioSettings } = useVoiceStore();

  useEffect(() => {
    if (room) {
      room.startAudio().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, [room]);

  return (
    <div className="flex-1 bg-[#1e1f22] flex flex-col h-full overflow-hidden relative">
      <div className="flex-1 overflow-hidden relative p-4">
        <VideoConference />
      </div>
      <RoomAudioRenderer />
    </div>
  );
}

export function VoiceRoom() {
  const { voiceToken, livekitUrl, leaveVoiceChannel, audioSettings } = useVoiceStore();

  if (!voiceToken || !livekitUrl) {
    return (
      <div className="flex-1 bg-[#1e1f22] flex items-center justify-center text-white h-full">
        <Loader2 className="animate-spin mr-2" /> Conectando ao LiveKit...
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={voiceToken}
      serverUrl={livekitUrl}
      onDisconnected={leaveVoiceChannel}
      audioCaptureDefaults={{
        autoGainControl: audioSettings?.autoGainControl ?? true,
        echoCancellation: audioSettings?.echoCancellation ?? true,
        noiseSuppression: audioSettings?.noiseSuppression ?? true,
      }}
      options={{
        adaptiveStream: false,
        publishDefaults: {
          dtx: true,
          red: true,
          audioPreset: AudioPresets.music,
          screenShareSimulcast: false,
          screenShareEncoding: {
            maxBitrate: 40000000,
            maxFramerate: 60,
            priority: 'high',
          },
        },
      }}
      data-lk-theme="default"
      className="h-full w-full flex-1"
    >
      <VoiceRoomContent />
    </LiveKitRoom>
  );
}
