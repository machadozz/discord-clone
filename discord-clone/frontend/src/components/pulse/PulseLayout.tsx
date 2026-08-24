import { Outlet, useLocation } from 'react-router-dom';
import { useVoiceStore } from '../../store/useVoiceStore';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { AudioPresets } from 'livekit-client';
import { DiscordiaNavRail } from '../layout/DiscordiaNavRail';
import { PulseChannelSidebar } from './PulseChannelSidebar';
import { RightContextPanel } from '../layout/RightContextPanel';
import { PulseActiveCallDock } from './PulseActiveCallDock';

export function PulseLayout() {
  const { connectedChannelId, voiceToken, livekitUrl, leaveVoiceChannel, audioSettings } = useVoiceStore();
  const location = useLocation();

  const isVoicePage = location.pathname.includes('/voice');

  const mainLayoutContent = (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090D12] text-[#F0F6FC] font-sans antialiased select-none">
      {/* Far Left Navigation Rail (Server List) */}
      <DiscordiaNavRail />

      {/* Channels Sidebar */}
      <PulseChannelSidebar />

      {/* Center Main Canvas Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Outlet />
      </main>

      {/* Far Right Collapsible Context Panel */}
      <RightContextPanel />

      {/* Floating Background Active Call Dock */}
      {connectedChannelId && !isVoicePage && <PulseActiveCallDock />}
    </div>
  );

  // If connected to WebRTC voice call, wrap entire app with LiveKitRoom so WebRTC audio persists globally
  if (connectedChannelId && voiceToken && livekitUrl) {
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
        className="h-full w-full flex-1 flex flex-col overflow-hidden"
      >
        {mainLayoutContent}
        <RoomAudioRenderer />
      </LiveKitRoom>
    );
  }

  return mainLayoutContent;
}
