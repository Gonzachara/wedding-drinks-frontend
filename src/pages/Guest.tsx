import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface GuestData {
  name: string;
  drinks_consumed: number;
  max_drinks: number;
  status: 'active' | 'blocked';
}

const Guest: React.FC = () => {
  const { code } = useParams();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const response = await api.get(`/bartender/public/guest/${code}`);
        setGuest(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invitado no encontrado');
      } finally {
        setLoading(false);
      }
    };
    if (code) fetchGuest();
  }, [code]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando...</div>;

  if (error || !guest) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <XCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
        <p className="text-gray-500">{error || 'El código no es válido'}</p>
      </div>
    );
  }

  const drinksRemaining = guest.max_drinks - guest.drinks_consumed;
  const isBlocked = guest.status === 'blocked';

  return (
    <div className={`min-h-screen flex flex-col p-6 transition-colors duration-500 ${isBlocked ? 'bg-red-600' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full mx-auto p-8 rounded-[3rem] shadow-2xl text-center space-y-8 ${isBlocked ? 'bg-white/10 backdrop-blur-lg border border-white/20 text-white' : 'bg-white text-gray-900 border border-gray-100'}`}>
        
        <div className="space-y-2">
          <p className={`text-xs font-bold uppercase tracking-widest ${isBlocked ? 'text-white/60' : 'text-gray-400'}`}>Hola,</p>
          <h1 className="text-4xl font-black leading-none">{guest.name.toUpperCase()}</h1>
        </div>

        <div className={`py-10 rounded-[2.5rem] space-y-2 ${isBlocked ? 'bg-white/10 border border-white/10' : 'bg-gray-50 border border-gray-100'}`}>
          <p className={`text-xs font-bold uppercase tracking-widest ${isBlocked ? 'text-white/60' : 'text-gray-400'}`}>Bebidas Disponibles</p>
          <p className={`text-9xl font-black leading-none tracking-tighter ${isBlocked ? 'text-white' : 'text-gray-900'}`}>
            {drinksRemaining > 0 ? drinksRemaining : 0}
          </p>
        </div>

        {isBlocked ? (
          <div className="space-y-4 animate-bounce">
            <AlertTriangle size={48} className="mx-auto text-white" />
            <p className="text-xl font-black uppercase tracking-widest">¡LÍMITE ALCANZADO!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <CheckCircle2 size={48} className="mx-auto text-green-500" />
            <p className="text-lg font-bold text-gray-500 uppercase tracking-widest">¡Disfruta la fiesta!</p>
          </div>
        )}

        <div className="pt-4 opacity-50 text-xs font-medium uppercase tracking-widest">
            Control de Bebidas - Wedding 2026
        </div>
      </div>
    </div>
  );
};

export default Guest;
