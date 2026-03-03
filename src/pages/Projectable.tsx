import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { GlassWater, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectableData {
  total_drinks_served: number;
  top_drinks: Array<{ name: string; times_served: number }>;
}

const Projectable: React.FC = () => {
  const [data, setData] = useState<ProjectableData | null>(null);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const response = await api.get('/dashboard/projectable');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching projectable data:', error);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('new_transaction', () => {
        fetchData();
      });
    }

    return () => {
      if (socket) {
        socket.off('new_transaction');
      }
    };
  }, [socket]);

  if (!data) return null;

  return (
    <div className="min-h-screen bg-black text-white p-20 flex flex-col items-center justify-center space-y-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white/5 blur-[150px] rounded-full pointer-events-none" />

      <header className="text-center space-y-4 relative">
        <h1 className="text-8xl font-black uppercase tracking-tighter animate-pulse">
          Control de Consumo
        </h1>
        <p className="text-2xl font-bold tracking-widest uppercase opacity-40">Estadísticas en Vivo</p>
      </header>

      <div className="grid grid-cols-2 gap-20 w-full max-w-7xl relative">
        {/* Total Stats */}
        <div className="flex flex-col items-center justify-center space-y-6 bg-white/5 p-20 rounded-[4rem] border border-white/10 backdrop-blur-sm">
          <div className="p-10 bg-white text-black rounded-[3rem]">
            <GlassWater size={80} />
          </div>
          <div className="text-center">
            <p className="text-3xl font-black uppercase opacity-40 tracking-widest mb-2">Bebidas Servidas</p>
            <motion.p 
              key={data.total_drinks_served}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-9xl font-black tracking-tighter"
            >
              {data.total_drinks_served}
            </motion.p>
          </div>
        </div>

        {/* Top Drinks Ranking */}
        <div className="flex flex-col space-y-10 bg-white/5 p-20 rounded-[4rem] border border-white/10 backdrop-blur-sm">
          <div className="flex items-center space-x-6">
            <Trophy size={60} className="text-yellow-500" />
            <h2 className="text-5xl font-black uppercase tracking-tighter">Más Pedidos</h2>
          </div>
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {data.top_drinks.map((drink, index) => (
                <motion.div 
                  key={drink.name}
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0"
                >
                  <div className="flex items-center space-x-6">
                    <span className="text-4xl font-black opacity-20">#{index + 1}</span>
                    <span className="text-4xl font-black uppercase">{drink.name}</span>
                  </div>
                  <span className="text-4xl font-black text-white/40">{drink.times_served}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <footer className="text-center relative">
        <div className="flex items-center space-x-4 opacity-30">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
          <p className="text-xl font-black uppercase tracking-widest">Actualizando en Tiempo Real</p>
        </div>
      </footer>
    </div>
  );
};

export default Projectable;
