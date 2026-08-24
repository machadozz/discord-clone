import { useUIStore } from '../../store/useUIStore';
import { UserSettingsModal } from './UserSettingsModal';
import { UserProfileModal } from './UserProfileModal';
import { ServerSettingsModal } from './ServerSettingsModal';
import { CreateChannelModal } from './CreateChannelModal';
import { CreateServerModal } from './CreateServerModal';
import { ScreenShareModal } from './ScreenShareModal';

export function ModalRoot() {
  const { activeModal } = useUIStore();

  return (
    <>
      {activeModal === 'userSettings' && <UserSettingsModal />}
      {activeModal === 'serverSettings' && <ServerSettingsModal />}
      {activeModal === 'createChannel' && <CreateChannelModal />}
      {activeModal === 'createServer' && <CreateServerModal />}
      {activeModal === 'screenShare' && <ScreenShareModal />}
      <UserProfileModal />
    </>
  );
}
