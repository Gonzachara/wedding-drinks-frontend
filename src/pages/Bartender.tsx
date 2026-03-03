import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, QrCode, Search, GlassWater, AlertTriangle, CheckCircle2, XCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Guest {
  id: number;
  name: string;
  unique_code: string;
  points_consumed: number;
  points_limit: number;
  status: 'active' | 'blocked' | 'cooldown';
}

interface OfflineTransaction {
  id: string;
  guest_code: string;
  drink_id: number;
  points_value: number;
  local_timestamp: string;
}

const Bartender: React.FC = () => {
  const [code, setCode] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [blockedMsg, setBlockedMsg] = useState('');
  const [menu, setMenu] = useState<Array<{ id: number; name: string; points_value: number; category?: string; is_alcoholic: boolean }>>([]);
  const [showDrinkSelect, setShowDrinkSelect] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineTransaction[]>([]);
  const [emergencyMode, setEmergencyMode] = useState<'inactive' | 'alcohol_off' | 'full_stop'>('inactive');

  const { logout } = useAuth();
  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    api.get('/menu').then(res => setMenu(res.data)).catch(console.error);
    
    const savedQueue = localStorage.getItem('offline_queue');
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar sonido de notificación
    audioRef.current = new Audio('/notification.mp3');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('emergency_mode_update', (data: { mode: any }) => {
        setEmergencyMode(data.mode);
        if (data.mode !== 'inactive') {
          setBlockedMsg(data.mode === 'full_stop' ? 'SISTEMA BLOQUEADO' : 'ALCOHOL BLOQUEADO');
        } else {
          setBlockedMsg('');
        }
      });
    }
    return () => {
      if (socket) socket.off('emergency_mode_update');
    };
  }, [socket]);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineTransactions();
    }
  }, [isOnline]);

  const syncOfflineTransactions = async () => {
    if (offlineQueue.length === 0) return;
    try {
      const response = await api.post('/sync', { transactions: offlineQueue });
      const { synced, conflicts } = response.data;
      
      const newQueue = offlineQueue.filter(tx => !synced.includes(tx.id) && !conflicts.some((c: any) => c.id === tx.id));
      setOfflineQueue(newQueue);
      localStorage.setItem('offline_queue', JSON.stringify(newQueue));
      
      if (synced.length > 0) {
        setSuccessMsg(`SINCRO: ${synced.length} OK`);
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } catch (err) {
      console.error('Error syncing transactions', err);
    }
  };

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
    const match = decodedText.match(/\/guest\/(\d{4})$/);
    const cleanCode = match ? match[1] : decodedText;
    
    setCode(cleanCode);
    setShowScanner(false);
    handleSearch(cleanCode);
  }

  function onScanError() {}

  const handleSearch = async (searchCode?: string) => {
    const codeToSearch = searchCode || code;
    if (!codeToSearch) return;

    setLoading(true);
    setError('');
    setGuest(null);
    setSuccessMsg('');
    setBlockedMsg('');
    setShowDrinkSelect(false);

    try {
      const response = await api.get(`/bartender/guest/${codeToSearch}`);
      setGuest(response.data);
      if (response.data.status === 'blocked') {
        setBlockedMsg('LÍMITE ALCANZADO');
      } else if (response.data.status === 'cooldown') {
        setError('INVITADO EN COOLDOWN');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invitado no encontrado');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDrink = async (drink: any) => {
    if (!guest) return;
    
    // Check emergency mode client-side
    if (emergencyMode === 'full_stop' || (emergencyMode === 'alcohol_off' && drink.is_alcoholic)) {
      setError('MODO EMERGENCIA ACTIVO');
      return;
    }

    setLoading(true);
    setError('');

    const pointsValue = drink.points_value;

    if (!isOnline) {
      const offlineTx: OfflineTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        guest_code: guest.unique_code,
        drink_id: drink.id,
        points_value: pointsValue,
        local_timestamp: new Date().toISOString()
      };
      
      const newQueue = [...offlineQueue, offlineTx];
      setOfflineQueue(newQueue);
      localStorage.setItem('offline_queue', JSON.stringify(newQueue));
      
      processSuccessfulRegistration(pointsValue, 'active'); // Assume active for offline
      setSuccessMsg('GUARDADO OFFLINE');
      setTimeout(() => setSuccessMsg(''), 2000);
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(`/bartender/drink`, {
        guest_code: guest.unique_code,
        drink_id: drink.id,
        device_info: window.navigator.userAgent
      });

      setSuccessMsg('¡REGISTRADO!');
      processSuccessfulRegistration(pointsValue, response.data.guest_status);

      setTimeout(() => {
        setSuccessMsg('');
        setShowDrinkSelect(false);
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const processSuccessfulRegistration = (pointsValue: number, newStatus: string) => {
    const newPoints = (guest?.points_consumed || 0) + pointsValue;
    
    setGuest(prev => prev ? {
      ...prev,
      points_consumed: newPoints,
      status: newStatus as any
    } : null);

    if (newStatus === 'blocked') {
      setTimeout(() => setBlockedMsg('LÍMITE ALCANZADO'), 1500);
    }

    // Haptic and Sound feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100]);
    }
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleClear = () => {
    setGuest(null);
    setCode('');
    setError('');
    setSuccessMsg('');
    setBlockedMsg('');
  };

  const pointsRemaining = guest ? Math.max(0, guest.points_limit - guest.points_consumed) : 0;
  const consumptionPercentage = guest ? (guest.points_consumed / guest.points_limit) * 100 : 0;
  const isWarning = consumptionPercentage >= 75 && consumptionPercentage < 100;

  if (blockedMsg) {
    return (
      <div className="fixed inset-0 bg-red-600 z-50 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
        <XCircle size={120} strokeWidth={2.5} className="mb-8" />
        <h1 className="text-6xl font-black text-center mb-4 leading-tight tracking-tighter">
          {blockedMsg}
        </h1>
        <p className="text-2xl font-bold opacity-80 mb-12 uppercase tracking-widest">
          {emergencyMode !== 'inactive' ? 'Acción restringida por administrador' : 'No puede consumir más alcohol'}
        </p>
        <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md w-full max-w-sm text-center mb-12">
            <p className="text-lg font-medium opacity-80 mb-1">Invitado:</p>
            <p className="text-3xl font-black">{guest?.name.toUpperCase() || 'SISTEMA'}</p>
        </div>
        <button 
          onClick={handleClear}
          className="bg-white text-red-600 px-12 py-6 rounded-3xl font-black text-2xl shadow-2xl active:scale-95 transition-all"
        >
          {emergencyMode !== 'inactive' ? 'VOLVER' : 'SIGUIENTE INVITADO'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Network Status */}
      <div className={`text-[10px] font-black uppercase tracking-widest py-1 px-4 text-center transition-colors ${isOnline ? 'bg-green-500/10 text-green-600' : 'bg-red-500 text-white'}`}>
        <div className="flex items-center justify-center space-x-2">
          {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
          <span>{isOnline ? 'Conectado' : 'Modo Offline'}</span>
          {offlineQueue.length > 0 && <span> | {offlineQueue.length} pendientes</span>}
        </div>
      </div>

      {/* Header Bartender */}
      <header className="bg-white border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-black text-white p-2 rounded-lg">
            <GlassWater size={20} />
          </div>
          <span className="font-bold tracking-tight uppercase text-sm">Bartender Mode</span>
        </div>
        <div className="flex items-center space-x-2">
          {offlineQueue.length > 0 && isOnline && (
            <button onClick={syncOfflineTransactions} className="p-2 text-blue-500 animate-spin">
              <RefreshCw size={20} />
            </button>
          )}
          <button onClick={logout} className="p-2 text-gray-400 hover:text-black">
            <LogOut size={20} />
          </button>
        </div>
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
            <div className={`bg-white p-8 rounded-[3rem] shadow-xl border-4 ${isWarning ? 'border-yellow-400' : 'border-gray-100'} text-center space-y-6 relative overflow-hidden transition-colors`}>
              {successMsg && (
                <div className="absolute inset-0 bg-green-500 flex flex-col items-center justify-center text-white animate-in zoom-in duration-200 z-20">
                  <CheckCircle2 size={80} className="mb-4" />
                  <span className="text-3xl font-black">{successMsg}</span>
                </div>
              )}

              {isWarning && (
                <div className="absolute top-4 left-0 right-0 animate-pulse">
                  <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    ⚠️ ALCANZANDO LÍMITE
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Invitado</p>
                <h3 className="text-4xl font-black text-gray-900 leading-none">
                  {guest.name.toUpperCase()}
                </h3>
              </div>

              <div className={`py-8 rounded-[2.5rem] space-y-2 border ${isWarning ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Puntos Restantes</p>
                <p className={`text-7xl font-black leading-none tracking-tighter ${isWarning ? 'text-yellow-700' : 'text-gray-900'}`}>
                  {pointsRemaining}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Consumido: {guest.points_consumed}/{guest.points_limit}
                </p>
              </div>

              <div className="space-y-4">
                {!showDrinkSelect ? (
                  <button
                    onClick={() => setShowDrinkSelect(true)}
                    disabled={loading || guest.status !== 'active'}
                    className="w-full bg-black text-white py-8 rounded-[2rem] font-black text-2xl shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                  >
                    <GlassWater size={32} />
                    <span>SELECCIONAR BEBIDA</span>
                  </button>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Carta de Tragos</p>
                    <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                      {menu.map(drink => (
                        <button
                          key={drink.id}
                          onClick={() => handleRegisterDrink(drink)}
                          disabled={loading}
                          className="flex items-center justify-between p-4 bg-gray-50 hover:bg-black hover:text-white rounded-2xl transition-all border border-gray-100 text-left group"
                        >
                          <div>
                            <p className="font-black text-sm uppercase leading-none">{drink.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 group-hover:text-white/60">
                              {drink.category || 'Sin categoría'} {drink.is_alcoholic ? '🍸' : '💧'}
                            </p>
                          </div>
                          <span className="font-black text-lg">+{drink.points_value}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowDrinkSelect(false)}
                      className="w-full py-4 text-gray-400 font-bold tracking-widest uppercase hover:text-black"
                    >
                      VOLVER
                    </button>
                  </div>
                )}
                {!showDrinkSelect && (
                  <button
                    onClick={handleClear}
                    className="w-full py-6 text-gray-400 font-bold tracking-widest uppercase hover:text-black transition-colors"
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            </div>
            {error && (
              <div className="bg-red-50 text-red-600 p-6 rounded-3xl text-center font-bold flex items-center justify-center space-x-2 border-2 border-red-100 animate-in shake duration-300">
                <AlertTriangle size={24} />
                <span>{error.toUpperCase()}</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Bartender;
