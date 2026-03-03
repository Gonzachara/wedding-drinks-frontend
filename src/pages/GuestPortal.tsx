import React, { useState } from 'react';
import api from '../services/api';
import QRCodeModal from '../components/QRCodeModal';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GuestPortal: React.FC = () => {
  const [name, setName] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 3) return;
    setLoading(true);
    try {
      const response = await api.get(`/guests/public/search/${name}`);
      setResults(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-8">
        <button onClick={() => navigate('/login')} className="flex items-center text-gray-400 hover:text-black font-bold uppercase tracking-widest text-xs">
          <ArrowLeft size={16} className="mr-2" /> VOLVER
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tighter uppercase">¿QUIÉN ERES?</h1>
          <p className="text-gray-500 font-medium">Busca tu nombre para ver tu código QR</p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Escribe tu nombre..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-6 py-6 bg-white border-2 border-gray-100 rounded-3xl text-xl font-bold focus:border-black focus:outline-none shadow-sm"
          />
          <button type="submit" className="absolute right-4 top-4 p-3 bg-black text-white rounded-2xl">
            <Search size={24} />
          </button>
        </form>

        <div className="space-y-4">
          {loading && <p className="text-center text-gray-400">Buscando...</p>}
          {results.map((guest) => (
            <button
              key={guest.unique_code}
              onClick={() => setSelectedGuest(guest)}
              className="w-full p-6 bg-white border-2 border-gray-100 rounded-3xl flex items-center justify-between hover:border-black transition-all active:scale-95 shadow-sm"
            >
              <div className="flex items-center space-x-4">

                <div className="text-left">
                  <p className="font-black text-lg text-gray-900">{guest.name.toUpperCase()}</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Toca para ver QR</p>
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900">#{guest.unique_code}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedGuest && (
        <QRCodeModal
          guestName={selectedGuest.name}
          uniqueCode={selectedGuest.unique_code}
          onClose={() => setSelectedGuest(null)}
        />
      )}
    </div>
  );
};

export default GuestPortal;
