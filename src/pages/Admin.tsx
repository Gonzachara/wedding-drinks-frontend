import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/QRCodeModal';
import { LogOut, UserPlus, RefreshCw, Trash2, Search, QrCode, GlassWater, Ban, Edit2, Settings } from 'lucide-react';

interface Guest {
  id: number;
  name: string;
  unique_code: string;
  drinks_consumed: number;
  max_drinks: number;
  status: 'active' | 'blocked';
}

const Admin: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [guestForQR, setGuestForQR] = useState<Guest | null>(null);
  
  // Estados para formularios
  const [newGuestName, setNewGuestName] = useState('');
  const [editGuest, setEditGuest] = useState({ id: 0, name: '', max_drinks: 4 });
  const [globalLimit, setGlobalLimit] = useState(4);
  const [stats, setStats] = useState({ total: 0, consumed: 0, blocked: 0 });

  const { logout } = useAuth();

  const fetchGuests = async () => {
    try {
      const response = await api.get('/guests');
      setGuests(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error('Error fetching guests', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Guest[]) => {
    const total = data.length;
    const consumed = data.reduce((acc, curr) => acc + curr.drinks_consumed, 0);
    const blocked = data.filter(g => g.status === 'blocked').length;
    setStats({ total, consumed, blocked });
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/guests', { name: newGuestName });
      setNewGuestName('');
      setShowAddModal(false);
      fetchGuests();
    } catch (err) {
      console.error('Error adding guest', err);
    }
  };

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/guests/${editGuest.id}`, { 
        name: editGuest.name, 
        max_drinks: editGuest.max_drinks 
      });
      setShowEditModal(false);
      fetchGuests();
    } catch (err) {
      console.error('Error updating guest', err);
    }
  };

  const handleGlobalLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`¿Seguro quieres cambiar el límite a ${globalLimit} tragos para TODOS los invitados?`)) return;
    try {
      await api.put('/guests/admin/global-limit', { max_drinks: globalLimit });
      setShowGlobalModal(false);
      fetchGuests();
    } catch (err) {
      console.error('Error updating global limit', err);
    }
  };

  const handleResetDrinks = async (id: number) => {
    if (window.confirm('¿Resetear consumo de este invitado?')) {
      try {
        await api.put(`/guests/reset/${id}`);
        fetchGuests();
      } catch (err) {
        console.error('Error resetting drinks', err);
      }
    }
  };

  const handleDeleteGuest = async (id: number) => {
    if (window.confirm('¿Eliminar invitado?')) {
      try {
        await api.delete(`/guests/${id}`);
        fetchGuests();
      } catch (err) {
        console.error('Error deleting guest', err);
      }
    }
  };

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.unique_code.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      {/* Header Fijo */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="bg-black text-white p-2 rounded-lg">
            <GlassWater size={20} />
          </div>
          <h1 className="text-lg font-black tracking-tight uppercase">Admin</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setShowGlobalModal(true)} className="p-2 text-gray-400 hover:text-black">
            <Settings size={22} />
          </button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-600">
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        {/* Stats - Compactas para mobile */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total</p>
            <p className="text-xl font-black">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tragos</p>
            <p className="text-xl font-black">{stats.consumed}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Bajo Límite</p>
            <p className="text-xl font-black text-red-600">{stats.blocked}</p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="BUSCAR NOMBRE O CÓDIGO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-3xl text-sm font-bold placeholder-gray-300 focus:border-black focus:outline-none transition-all"
          />
        </div>

        {/* Lista de Invitados (Cards) */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando...</div>
          ) : filteredGuests.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No hay resultados</div>
          ) : (
            filteredGuests.map(guest => (
              <div key={guest.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-gray-900 text-lg uppercase leading-none">{guest.name}</h3>
                    {guest.status === 'blocked' && <Ban size={14} className="text-red-600" />}
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-bold">#{guest.unique_code}</span>
                    <span className={`text-xs font-black ${guest.drinks_consumed >= guest.max_drinks ? 'text-red-600' : 'text-gray-400'}`}>
                      {guest.drinks_consumed}/{guest.max_drinks} TRAGOS
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => setGuestForQR(guest)}
                    className="p-3 text-gray-400 hover:bg-gray-50 rounded-2xl"
                  >
                    <QrCode size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      setEditGuest({ id: guest.id, name: guest.name, max_drinks: guest.max_drinks });
                      setShowEditModal(true);
                    }}
                    className="p-3 text-gray-400 hover:bg-gray-50 rounded-2xl"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleResetDrinks(guest.id)}
                    className="p-3 text-blue-400 hover:bg-blue-50 rounded-2xl"
                  >
                    <RefreshCw size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeleteGuest(guest.id)}
                    className="p-3 text-red-300 hover:bg-red-50 rounded-2xl"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Botón Flotante Agregar (Solo Mobile) */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform md:hidden"
      >
        <UserPlus size={28} />
      </button>

      {/* Modal Agregar */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black mb-6 uppercase">Nuevo Invitado</h3>
            <form onSubmit={handleAddGuest} className="space-y-6">
              <input
                type="text"
                required
                autoFocus
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl text-lg font-bold focus:border-black focus:outline-none"
                placeholder="NOMBRE COMPLETO"
              />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Individual */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black mb-6 uppercase">Editar Invitado</h3>
            <form onSubmit={handleUpdateGuest} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nombre</label>
                <input
                  type="text"
                  required
                  value={editGuest.name}
                  onChange={(e) => setEditGuest({...editGuest, name: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-lg font-bold focus:border-black focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Límite de Tragos</label>
                <div className="flex items-center space-x-4 mt-2">
                  <button type="button" onClick={() => setEditGuest({...editGuest, max_drinks: Math.max(1, editGuest.max_drinks - 1)})} className="w-12 h-12 bg-gray-100 rounded-xl font-black text-xl">-</button>
                  <span className="flex-1 text-center text-3xl font-black">{editGuest.max_drinks}</span>
                  <button type="button" onClick={() => setEditGuest({...editGuest, max_drinks: editGuest.max_drinks + 1})} className="w-12 h-12 bg-gray-100 rounded-xl font-black text-xl">+</button>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Límite Global */}
      {showGlobalModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black mb-2 uppercase">Límite Global</h3>
            <p className="text-gray-400 text-sm mb-6 font-medium leading-tight">Cambia el límite para TODOS los invitados de la fiesta.</p>
            <form onSubmit={handleGlobalLimit} className="space-y-6">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => setGlobalLimit(Math.max(1, globalLimit - 1))} className="w-16 h-16 bg-gray-100 rounded-2xl font-black text-2xl">-</button>
                <span className="flex-1 text-center text-5xl font-black">{globalLimit}</span>
                <button type="button" onClick={() => setGlobalLimit(globalLimit + 1)} className="w-16 h-16 bg-gray-100 rounded-2xl font-black text-2xl">+</button>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowGlobalModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest">Cerrar</button>
                <button type="submit" className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Aplicar a todos</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {guestForQR && (
        <QRCodeModal
          guestName={guestForQR.name}
          uniqueCode={guestForQR.unique_code}
          onClose={() => setGuestForQR(null)}
        />
      )}
    </div>
  );
};

export default Admin;
