import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const currentHostname = window.location.hostname;
    const isProduction = import.meta.env.PROD;
    const PROD_URL = 'https://wedding-drinks-api.onrender.com'; 
    const socketURL = isProduction ? PROD_URL : `http://${currentHostname}:3000`;

    const newSocket = io(socketURL);

    newSocket.on('connect', () => {
      console.log('Socket conectado');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket desconectado');
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
