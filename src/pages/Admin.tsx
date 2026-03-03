import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/QRCodeModal';
import { LogOut, UserPlus, RefreshCw, Trash2, Search, QrCode, GlassWater, Ban, Edit2, Settings, ListPlus, History, Download } from 'lucide-react';

interface Guest {
  id: number;
  name: string;
  unique_code: string;
  drinks_consumed: number;
  max_drinks: number;
  status: 'active' | 'blocked';
}

interface ActivityItem {
  id: number;
  guest_name: string;
  action: string;
  timestamp: string;
}

const Admin: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [guestForQR, setGuestForQR] = useState<Guest | null>(null);
  
  // Estados para formularios
  const [newGuestName, setNewGuestName] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [editGuest, setEditGuest] = useState({ id: 0, name: '', max_drinks: 4 });
  const [globalLimit, setGlobalLimit] = useState(4);
  const [stats, setStats] = useState({ total: 0, consumed: 0, blocked: 0 });
  const [menu, setMenu] = useState<Array<{ id: number; name: string; description?: string; category?: string }>>([]);
  const [newDrink, setNewDrink] = useState({ name: '', description: '', category: '' });

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

  const fetchActivity = async () => {
    try {
      const response = await api.get('/guests/admin/activity');
      setActivity(response.data);
    } catch (err) {
      console.error('Error fetching activity', err);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await api.get('/menu');
      setMenu(response.data);
    } catch (err) {
      console.error('Error fetching menu', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Codigo', 'Consumido', 'Limite', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...guests.map(g => `${g.name},${g.unique_code},${g.drinks_consumed},${g.max_drinks},${g.status}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `invitados_wedding.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const namesArray = bulkNames.split('\n').filter(n => n.trim() !== '');
    if (namesArray.length === 0) return;

    try {
      setLoading(true);
      await api.post('/guests/bulk', { names: namesArray, max_drinks: globalLimit });
      setBulkNames('');
      setShowBulkModal(false);
      fetchGuests();
    } catch (err) {
      console.error('Error in bulk import', err);
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

  const handleAddDrink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrink.name.trim()) return;
    try {
      await api.post('/menu', {
        name: newDrink.name.trim(),
        description: newDrink.description?.trim() || undefined,
        category: newDrink.category?.trim() || undefined
      });
      setNewDrink({ name: '', description: '', category: '' });
      fetchMenu();
    } catch (err) {
      console.error('Error adding drink', err);
    }
  };

  const handleDeleteDrink = async (id: number) => {
    if (!window.confirm('¿Eliminar este trago del menú?')) return;
    try {
      await api.delete(`/menu/${id}`);
      fetchMenu();
    } catch (err) {
      console.error('Error deleting drink', err);
    }
  };

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.unique_code.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      {/* Header Fijo */}
      <header className="bg-white dark:bg-black border-b border-gray-100 dark:border-white/10 py-4 px-6 flex justify-between items-center sticky top-0 z-30 transition-colors">
        <div className="flex items-center space-x-2">
          <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-lg">
            <GlassWater size={20} />
          </div>
          <h1 className="text-lg font-black tracking-tight uppercase dark:text-white">Admin</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowGlobalModal(true)} className="p-2 text-gray-400 hover:text-black dark:hover:text-white">
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
          <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total</p>
            <p className="text-xl font-black dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tragos</p>
            <p className="text-xl font-black dark:text-white">{stats.consumed}</p>
          </div>
          <div className="bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Bajo Límite</p>
            <p className="text-xl font-black text-red-600">{stats.blocked}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setShowBulkModal(true)}
            className="flex items-center justify-center space-x-2 p-4 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-bold text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <ListPlus size={20} />
            <span>Carga Masiva</span>
          </button>
          <button 
            onClick={() => {
              fetchActivity();
              setShowHistoryModal(true);
            }}
            className="flex items-center justify-center space-x-2 p-4 bg-white dark:bg-white/10 text-black dark:text-white border-2 border-gray-100 dark:border-white/10 rounded-3xl font-bold text-sm uppercase tracking-widest shadow-sm active:scale-95 transition-all"
          >
            <History size={20} />
            <span>Historial</span>
          </button>
          <button 
            onClick={() => { fetchMenu(); setShowMenuModal(true); }}
            className="flex items-center justify-center space-x-2 p-4 bg-white dark:bg-white/10 text-black dark:text-white border-2 border-gray-100 dark:border-white/10 rounded-3xl font-bold text-sm uppercase tracking-widest shadow-sm active:scale-95 transition-all"
          >
            <GlassWater size={20} />
            <span>Carta de Tragos</span>
          </button>
        </div>

        {/* Buscador y Exportar */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="BUSCAR NOMBRE O CÓDIGO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-3xl text-sm font-bold placeholder-gray-300 dark:text-white focus:border-black dark:focus:border-white focus:outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleExportCSV}
            className="p-4 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-3xl text-gray-400 hover:text-black dark:hover:text-white"
            title="Exportar CSV"
          >
            <Download size={24} />
          </button>
        </div>

        {/* Lista de Invitados (Cards) */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando...</div>
          ) : filteredGuests.length === 0 ? (
            <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No hay resultados</div>
          ) : (
            filteredGuests.map(guest => (
              <div key={guest.id} className="bg-white dark:bg-white/5 p-5 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-gray-900 dark:text-white text-lg uppercase leading-none">{guest.name}</h3>
                    {guest.status === 'blocked' && <Ban size={14} className="text-red-600" />}
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-[10px] font-mono bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md text-gray-500 dark:text-gray-400 font-bold">#{guest.unique_code}</span>
                    <span className={`text-xs font-black ${guest.drinks_consumed >= guest.max_drinks ? 'text-red-600' : 'text-gray-400'}`}>
                      {guest.drinks_consumed}/{guest.max_drinks} TRAGOS
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => setGuestForQR(guest)}
                    className="p-3 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                  >
                    <QrCode size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      setEditGuest({ id: guest.id, name: guest.name, max_drinks: guest.max_drinks });
                      setShowEditModal(true);
                    }}
                    className="p-3 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleResetDrinks(guest.id)}
                    className="p-3 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-2xl"
                  >
                    <RefreshCw size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeleteGuest(guest.id)}
                    className="p-3 text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl"
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform md:hidden"
      >
        <UserPlus size={28} />
      </button>

      {/* Modal Agregar */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black mb-6 uppercase dark:text-white">Nuevo Invitado</h3>
            <form onSubmit={handleAddGuest} className="space-y-6">
              <input
                type="text"
                required
                autoFocus
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="w-full px-6 py-5 bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl text-lg font-bold focus:border-black dark:focus:border-white focus:outline-none dark:text-white"
                placeholder="NOMBRE COMPLETO"
              />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest shadow-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Carga Masiva */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
            <h3 className="text-2xl font-black mb-2 uppercase dark:text-white">Carga Masiva</h3>
            <p className="text-gray-400 text-sm mb-6 font-medium leading-tight">Pegá una lista de nombres (uno por línea).</p>
            <form onSubmit={handleBulkImport} className="space-y-6 flex-1 flex flex-col min-h-0">
              <textarea
                required
                rows={10}
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                className="w-full flex-1 px-6 py-5 bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl text-lg font-bold focus:border-black dark:focus:border-white focus:outline-none dark:text-white resize-none"
                placeholder="Ej:&#10;Juan Perez&#10;Maria Garcia&#10;Tio Alberto"
              />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowBulkModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest shadow-xl">
                  {loading ? 'Cargando...' : 'Importar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
            <h3 className="text-2xl font-black mb-6 uppercase dark:text-white">Historial de Actividad</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {activity.length === 0 ? (
                <p className="text-center text-gray-400 py-10 uppercase font-bold text-xs tracking-widest">No hay actividad aún</p>
              ) : (
                activity.map(item => (
                  <div key={item.id} className="flex items-center space-x-4 border-b border-gray-100 dark:border-white/10 pb-4 last:border-0">
                    <div className="p-3 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-2xl">
                      <GlassWater size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900 dark:text-white uppercase leading-none">{item.guest_name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Bebida Registrada</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="w-full mt-6 py-5 bg-gray-50 dark:bg-white/10 text-gray-900 dark:text-white rounded-2xl font-black uppercase tracking-widest">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal Editar Individual */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black mb-6 uppercase dark:text-white">Editar Invitado</h3>
            <form onSubmit={handleUpdateGuest} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nombre</label>
                <input
                  type="text"
                  required
                  value={editGuest.name}
                  onChange={(e) => setEditGuest({...editGuest, name: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl text-lg font-bold focus:border-black dark:focus:border-white focus:outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Límite de Tragos</label>
                <div className="flex items-center space-x-4 mt-2">
                  <button type="button" onClick={() => setEditGuest({...editGuest, max_drinks: Math.max(1, editGuest.max_drinks - 1)})} className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-xl font-black text-xl dark:text-white">-</button>
                  <span className="flex-1 text-center text-3xl font-black dark:text-white">{editGuest.max_drinks}</span>
                  <button type="button" onClick={() => setEditGuest({...editGuest, max_drinks: editGuest.max_drinks + 1})} className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-xl font-black text-xl dark:text-white">+</button>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-5 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest shadow-xl">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Límite Global */}
      {showGlobalModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-2xl font-black mb-2 uppercase dark:text-white">Límite Global</h3>
            <p className="text-gray-400 text-sm mb-6 font-medium leading-tight">Cambia el límite para TODOS los invitados de la fiesta.</p>
            <form onSubmit={handleGlobalLimit} className="space-y-6">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => setGlobalLimit(Math.max(1, globalLimit - 1))} className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl font-black text-2xl dark:text-white">-</button>
                <span className="flex-1 text-center text-5xl font-black dark:text-white">{globalLimit}</span>
                <button type="button" onClick={() => setGlobalLimit(globalLimit + 1)} className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl font-black text-2xl dark:text-white">+</button>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowGlobalModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase tracking-widest">Cerrar</button>
                <button type="submit" className="flex-1 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Aplicar a todos</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Carta de Tragos */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
            <h3 className="text-2xl font-black mb-4 uppercase dark:text-white">Carta de Tragos</h3>
            <form onSubmit={handleAddDrink} className="grid grid-cols-1 gap-3 mb-4">
              <input
                type="text"
                value={newDrink.name}
                onChange={(e) => setNewDrink({ ...newDrink, name: e.target.value })}
                placeholder="Nombre del trago"
                className="px-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl font-bold focus:border-black dark:focus:border-white dark:text-white"
              />
              <input
                type="text"
                value={newDrink.description}
                onChange={(e) => setNewDrink({ ...newDrink, description: e.target.value })}
                placeholder="Descripción (opcional)"
                className="px-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl font-bold focus:border-black dark:focus:border-white dark:text-white"
              />
              <input
                type="text"
                value={newDrink.category}
                onChange={(e) => setNewDrink({ ...newDrink, category: e.target.value })}
                placeholder="Categoría (opcional)"
                className="px-4 py-3 bg-gray-50 dark:bg-white/5 border-2 border-transparent rounded-2xl font-bold focus:border-black dark:focus:border-white dark:text-white"
              />
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowMenuModal(false)} className="flex-1 py-4 font-black text-gray-400 uppercase tracking-widest">Cerrar</button>
                <button type="submit" className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest shadow-xl">Agregar</button>
              </div>
            </form>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {menu.length === 0 ? (
                <p className="text-center text-gray-400 uppercase font-bold text-xs tracking-widest">No hay tragos cargados</p>
              ) : (
                menu.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white/60 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex-1">
                      <p className="font-black dark:text-white">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteDrink(item.id)} className="text-red-500 font-bold text-xs uppercase tracking-widest">Eliminar</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {guestForQR && (
        <QRCodeModal
          guestName={guestForQR.name}
          uniqueCode={guestForQR.unique_code}
          drinksConsumed={guestForQR.drinks_consumed}
          maxDrinks={guestForQR.max_drinks}
          status={guestForQR.status}
          onClose={() => setGuestForQR(null)}
        />
      )}
    </div>
  );
};

export default Admin;
