import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LogOut, QrCode, Search, GlassWater, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Guest {
  id: number;
  name: string;
  unique_code: string;
  drinks_consumed: number;
  max_drinks: number;
  status: 'active' | 'blocked';
}

const Bartender: React.FC = () => {
  const [code, setCode] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [blockedMsg, setBlockedMsg] = useState('');

  const { logout } = useAuth();

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(onScanSuccess, onScanError);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [showScanner]);

  function onScanSuccess(decodedText: string) {
    setCode(decodedText);
    setShowScanner(false);
    handleSearch(decodedText);
  }

  function onScanError() {
    // console.warn(err);
  }

  const handleSearch = async (searchCode?: string) => {
    const codeToSearch = searchCode || code;
    if (!codeToSearch) return;

    setLoading(true);
    setError('');
    setGuest(null);
    setSuccessMsg('');
    setBlockedMsg('');

    try {
      const response = await api.get(`/bartender/guest/${codeToSearch}`);
      setGuest(response.data);
      if (response.data.status === 'blocked') {
        setBlockedMsg('LÍMITE ALCANZADO');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invitado no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDrink = async () => {
    if (!guest) return;
    setLoading(true);

    try {
      await api.post(`/bartender/drink/${guest.unique_code}`);
      setSuccessMsg('¡BEBIDA REGISTRADA!');
      
      // Actualizar datos del invitado localmente para reflejar el cambio inmediato
      setGuest(prev => prev ? {
        ...prev,
        drinks_consumed: prev.drinks_consumed + 1,
        status: (prev.drinks_consumed + 1 >= prev.max_drinks) ? 'blocked' : 'active'
      } : null);

      if (guest.drinks_consumed + 1 >= guest.max_drinks) {
        setTimeout(() => setBlockedMsg('LÍMITE ALCANZADO'), 1500);
      }

      // Limpiar mensaje de éxito después de 2 segundos
      setTimeout(() => setSuccessMsg(''), 2000);

      // Feedback háptico si está disponible
      if (window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar bebida');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setGuest(null);
    setCode('');
    setError('');
    setSuccessMsg('');
    setBlockedMsg('');
  };

  // Pantalla de bloqueo total si el límite se alcanzó
  if (blockedMsg) {
    return (
      <div className="fixed inset-0 bg-red-600 z-50 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
        <XCircle size={120} strokeWidth={2.5} className="mb-8" />
        <h1 className="text-6xl font-black text-center mb-4 leading-tight tracking-tighter">
          {blockedMsg}
        </h1>
        <p className="text-2xl font-bold opacity-80 mb-12 uppercase tracking-widest">
          No puede consumir más alcohol
        </p>
        <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md w-full max-w-sm text-center mb-12">
            <p className="text-lg font-medium opacity-80 mb-1">Invitado:</p>
            <p className="text-3xl font-black">{guest?.name.toUpperCase()}</p>
        </div>
        <button 
          onClick={handleClear}
          className="bg-white text-red-600 px-12 py-6 rounded-3xl font-black text-2xl shadow-2xl active:scale-95 transition-all"
        >
          SIGUIENTE INVITADO
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      {/* Header Bartender */}
      <header className="bg-white border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-black text-white p-2 rounded-lg">
            <GlassWater size={20} />
          </div>
          <span className="font-bold tracking-tight uppercase text-sm">Bartender Mode</span>
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-black">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {!guest ? (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black text-gray-900 leading-tight tracking-tighter">
                BUSCAR INVITADO
              </h2>
              <p className="text-gray-500 font-medium">Ingresa el código o usa la cámara</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="CÓDIGO ALFANUMÉRICO"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-6 py-6 bg-white border-2 border-gray-100 rounded-3xl text-2xl font-black text-center placeholder-gray-300 focus:border-black focus:outline-none transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSearch()}
                  disabled={loading || !code}
                  className="flex flex-col items-center justify-center p-8 bg-black text-white rounded-3xl space-y-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  <Search size={32} />
                  <span className="font-black text-xs tracking-widest uppercase">BUSCAR</span>
                </button>
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 text-gray-900 rounded-3xl space-y-3 shadow-sm active:scale-95 transition-all"
                >
                  <QrCode size={32} />
                  <span className="font-black text-xs tracking-widest uppercase">ESCANEAR</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-center font-bold flex items-center justify-center space-x-2 border-2 border-red-100">
                <AlertTriangle size={24} />
                <span>{error.toUpperCase()}</span>
              </div>
            )}

            {showScanner && (
              <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
                <div id="reader" className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl"></div>
                <button 
                  onClick={() => setShowScanner(false)}
                  className="mt-12 bg-white text-black px-10 py-5 rounded-3xl font-black tracking-widest uppercase shadow-xl"
                >
                  CERRAR CÁMARA
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in zoom-in duration-300">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-6 relative overflow-hidden">
              {successMsg && (
                <div className="absolute inset-0 bg-green-500 flex flex-col items-center justify-center text-white animate-in zoom-in duration-200">
                  <CheckCircle2 size={80} className="mb-4" />
                  <span className="text-3xl font-black">{successMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Invitado</p>
                <h3 className="text-4xl font-black text-gray-900 leading-none">
                  {guest.name.toUpperCase()}
                </h3>
              </div>

              <div className="py-8 bg-gray-50 rounded-[2.5rem] space-y-2 border border-gray-100">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Bebidas Restantes</p>
                <p className="text-9xl font-black text-gray-900 leading-none tracking-tighter">
                  {guest.max_drinks - guest.drinks_consumed}
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleRegisterDrink}
                  disabled={loading}
                  className="w-full bg-black text-white py-8 rounded-[2rem] font-black text-2xl shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3"
                >
                  <GlassWater size={32} />
                  <span>REGISTRAR BEBIDA</span>
                </button>
                <button
                  onClick={handleClear}
                  className="w-full py-6 text-gray-400 font-bold tracking-widest uppercase hover:text-black transition-colors"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Bartender;
