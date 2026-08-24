import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';
import { MeLayout } from './pages/MeLayout';
import { ServerLayout } from './pages/ServerLayout';
import { FriendTabs } from './components/dms/FriendTabs';
import { DMChatArea } from './components/chat/DMChatArea';
import { ChannelContent } from './components/layout/ChannelContent';
import { ModalRoot } from './components/modals/ModalRoot';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  return (isAuthenticated && user) ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Disable default browser context menu (right-click) across the entire application
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
          <Route index element={<Navigate to="/app/@me" replace />} />
          
          {/* DM / Friends routes */}
          <Route path="@me" element={<MeLayout />}>
            <Route index element={<FriendTabs />} />
            <Route path=":dmId" element={<DMChatArea />} />
          </Route>
          
          {/* Server routes */}
          <Route path=":serverId" element={<ServerLayout />}>
            <Route index element={<div className="flex-1 bg-[#090D12] flex items-center justify-center text-[#8B949E] text-xs">Selecione um canal</div>} />
            <Route path=":channelId" element={<ChannelContent />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/app/@me" />} />
      </Routes>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#121820', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <ModalRoot />
    </BrowserRouter>
  );
}

export default App;
