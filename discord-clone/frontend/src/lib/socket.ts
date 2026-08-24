import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket) return socket;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  socket = io(`${API_URL}/chat`, {
    auth: { token },
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
