//socket pour connexion backend pour utilisateur

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');

    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const s = io(API_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
    });

    s.on('connect', () => console.log('✅ Socket connectée', s.id));
    s.on('connect_error', (err) => console.warn('❌ Socket connect_error:', err?.message));
    s.on('disconnect', (reason) => console.log('ℹ️ Socket disconnect:', reason));

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

