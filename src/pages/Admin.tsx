import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/QRCodeModal';
import GlobalSettings from '../components/GlobalSettings';
import { Link } from 'react-router-dom';
import { LogOut, UserPlus, RefreshCw, Trash2, Search, QrCode, GlassWater, Ban, Edit2, Settings, ListPlus, History, Download, LayoutDashboard, Users, Martini, Presentation } from 'lucide-react';

interface Guest {
  id: number;
  name: string;
  unique_code: string;
  points_consumed: number;
  points_limit: number;
  status: 'active' | 'blocked' | 'cooldown';
  category_name?: string;
}

interface ActivityItem {
  id: number;
  guest_name: string;
  action: string;
  points_transacted: number;
  timestamp: string;
}

const Admin: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'guests' | 'menu' | 'settings' | 'history'>('guests');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [guestForQR, setGuestForQR] = useState<Guest | null>(null);
  
  // Estados para formularios
  const [bulkNames, setBulkNames] = useState('');
  const [globalLimit, setGlobalLimit] = useState(100);
  const [stats, setStats] = useState({ total: 0, consumed: 0, blocked: 0 });
  const [menu, setMenu] = useState<Array<{ id: number; name: string; description?: string; category?: string; points_value: number; is_alcoholic: boolean }>>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [newDrink, setNewDrink] = useState({ name: '', description: '', category: '', points_value: 10, is_alcoholic: true });
  const [newGuest, setNewGuest] = useState({ name: '', category_id: 0 });
  const [editGuestData, setEditGuestData] = useState({ id: 0, name: '', points_limit: 100, category_id: 0, status: 'active' as 'active' | 'blocked' | 'cooldown' });

  const { logout } = useAuth();

  const fetchCategories = async () => {
    try {
      const response = await api.get('/management/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await api.get('/guests');
      setGuests(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error('Error al cargar invitados', err);
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
    const headers = ['Nombre', 'Codigo', 'Consumido', 'Limite', 'Estado', 'Categoria'];
    const csvContent = [
      headers.join(','),
      ...guests.map(g => `${g.name},${g.unique_code},${g.points_consumed},${g.points_limit},${g.status},${g.category_name || ''}`)
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
      await api.post('/guests/bulk', { names: namesArray, points_limit: globalLimit });
      setBulkNames('');
      setShowBulkModal(false);
      fetchGuests();
    } catch (err) {
      console.error('Error in bulk import', err);
    }
  };

  const calculateStats = (data: Guest[]) => {
    const total = data.length;
    const consumed = data.reduce((acc, curr) => acc + curr.points_consumed, 0);
    const blocked = data.filter(g => g.status === 'blocked').length;
    setStats({ total, consumed, blocked });
  };

  useEffect(() => {
    fetchGuests();
    fetchCategories();
  }, []);

  // Cargar menú al abrir la pestaña
  useEffect(() => {
    if (activeTab === 'menu') {
      fetchMenu();
    }
  }, [activeTab]);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/guests', { 
        name: newGuest.name, 
        category_id: newGuest.category_id || null 
      });
      setNewGuest({ name: '', category_id: 0 });
      setShowAddModal(false);
      fetchGuests();
    } catch (err) {
      console.error('Error adding guest', err);
    }
  };

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/guests/${editGuestData.id}`, {
        name: editGuestData.name, 
        points_limit: editGuestData.points_limit,
        category_id: editGuestData.category_id || null,
        status: editGuestData.status
      });
      setShowEditModal(false);
      fetchGuests();
    } catch (err) {
      console.error('Error updating guest', err);
    }
  };

  const handleGlobalLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm(`¿Seguro quieres cambiar el límite a ${globalLimit} puntos para TODOS los invitados?`)) return;
    try {
      await api.put('/guests/admin/global-limit', { points_limit: globalLimit });
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
      setNewDrink({ name: '', description: '', category: '', points_value: 10, is_alcoholic: true });
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-black text-white p-6 sticky top-0 h-screen">
        <div className="flex items-center space-x-3 mb-12">
          <div className="bg-white text-black p-2 rounded-xl">
            <GlassWater size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase">Drink Control</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <TabButton active={activeTab === 'guests'} onClick={() => setActiveTab('guests')} icon={<Users size={20} />} label="Invitados" />
          <Link to="/dashboard" className="flex items-center space-x-3 p-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/projectable" target="_blank" className="flex items-center space-x-3 p-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Presentation size={20} />
            <span>Modo Pantalla</span>
          </Link>
          <TabButton active={activeTab === 'menu'} onClick={() => { setActiveTab('menu'); }} icon={<Martini size={20} />} label="Menú" />
          <TabButton active={activeTab === 'history'} onClick={() => { fetchActivity(); setActiveTab('history'); }} icon={<History size={20} />} label="Historial" />
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="Ajustes" />
        </nav>

        <button onClick={logout} className="flex items-center space-x-3 p-4 text-red-400 font-bold uppercase text-xs tracking-widest hover:bg-red-500/10 rounded-2xl transition-all">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header Mobile */}
        <header className="md:hidden bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center sticky top-0 z-30">
          <h1 className="text-lg font-black tracking-tight uppercase">Admin</h1>
          <button onClick={logout} className="p-2 text-gray-400"><LogOut size={20} /></button>
        </header>

        <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
          {activeTab === 'guests' && (
            <>
              {/* Stats & Search */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="BUSCAR INVITADO..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-3xl font-bold focus:border-black focus:outline-none transition-all"
                      />
                    </div>
                    <button onClick={handleExportCSV} className="p-4 bg-white border-2 border-gray-100 rounded-3xl text-gray-400 hover:text-black transition-colors">
                      <Download size={24} />
                    </button>
                  </div>

                  {/* Guest List */}
                  <div className="space-y-3">
                    {filteredGuests.map(guest => (
                      <GuestCard 
                        key={guest.id} 
                        guest={guest} 
                        onQR={() => setGuestForQR(guest)}
                        onEdit={() => { setEditGuestData({ id: guest.id, name: guest.name, points_limit: guest.points_limit, category_id: (guest as any).category_id || 0, status: guest.status }); setShowEditModal(true); }}
                  onReset={() => handleResetDrinks(guest.id)}
                  onDelete={() => handleDeleteGuest(guest.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-black text-white p-8 rounded-[2.5rem] space-y-6">
              <h3 className="font-black uppercase tracking-widest text-xs opacity-50">Resumen General</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatMini label="Total" value={stats.total} />
                <StatMini label="Puntos" value={stats.consumed} />
                <StatMini label="Bloqueados" value={stats.blocked} color="text-red-400" />
              </div>
              <button onClick={() => setShowBulkModal(true)} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2">
                <ListPlus size={18} />
                <span>Carga Masiva</span>
              </button>
              <button onClick={() => setShowAddModal(true)} className="w-full py-4 border-2 border-white/20 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center space-x-2">
                <UserPlus size={18} />
                <span>Nuevo Invitado</span>
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {activeTab === 'menu' && (
      <div className="space-y-8 max-w-2xl">
        <h2 className="text-3xl font-black uppercase tracking-tight">Menú de Bebidas</h2>
        <form onSubmit={handleAddDrink} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
          <input type="text" value={newDrink.name} onChange={e => setNewDrink({...newDrink, name: e.target.value})} placeholder="Nombre" className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black focus:outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={newDrink.points_value} onChange={e => setNewDrink({...newDrink, points_value: parseInt(e.target.value)})} className="p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black focus:outline-none" />
            <select value={newDrink.is_alcoholic ? 'alcoholic' : 'non-alcoholic'} onChange={e => setNewDrink({...newDrink, is_alcoholic: e.target.value === 'alcoholic'})} className="p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black focus:outline-none">
              <option value="alcoholic">Con Alcohol</option>
              <option value="non-alcoholic">Sin Alcohol</option>
            </select>
          </div>
          <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest">Agregar Bebida</button>
        </form>

        <div className="grid grid-cols-1 gap-4">
          {menu.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-black uppercase">{item.name}</p>
                <p className="text-xs font-bold text-gray-400">{item.is_alcoholic ? 'CON ALCOHOL' : 'SIN ALCOHOL'} • {item.points_value} PUNTOS</p>
              </div>
              <button onClick={() => handleDeleteDrink(item.id)} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      </div>
    )}

    {activeTab === 'history' && (
      <div className="space-y-8 max-w-2xl">
        <h2 className="text-3xl font-black uppercase tracking-tight">Historial de Consumo</h2>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          {activity.map((item, idx) => (
            <div key={item.id} className={`p-6 flex items-center justify-between ${idx !== activity.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-50 rounded-2xl text-black"><GlassWater size={20} /></div>
                <div>
                  <p className="font-black uppercase">{item.guest_name}</p>
                  <p className="text-[10px] font-bold text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <span className="font-black text-sm text-green-600">+{item.points_transacted}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {activeTab === 'settings' && <GlobalSettings />}
  </main>

  {/* Navigation Mobile */}
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center z-30">
    <button onClick={() => setActiveTab('guests')} className={`p-2 ${activeTab === 'guests' ? 'text-black' : 'text-gray-300'}`}><Users size={24} /></button>
    <Link to="/dashboard" className="p-2 text-gray-300"><LayoutDashboard size={24} /></Link>
    <button onClick={() => { setActiveTab('menu'); }} className={`p-2 ${activeTab === 'menu' ? 'text-black' : 'text-gray-300'}`}><Martini size={24} /></button>
    <button onClick={() => setActiveTab('settings')} className={`p-2 ${activeTab === 'settings' ? 'text-black' : 'text-gray-300'}`}><Settings size={24} /></button>
  </nav>
</div>

{/* Modals */}
{showAddModal && <AddGuestModal onClose={() => setShowAddModal(false)} onSave={handleAddGuest} guest={newGuest} setGuest={setNewGuest} categories={categories} />}
{showBulkModal && <BulkImportModal onClose={() => setShowBulkModal(false)} onSave={handleBulkImport} names={bulkNames} setNames={setBulkNames} />}
{showEditModal && <EditGuestModal onClose={() => setShowEditModal(false)} onSave={handleUpdateGuest} guest={editGuestData} setGuest={setEditGuestData} categories={categories} />}
{showGlobalModal && <GlobalLimitModal onClose={() => setShowGlobalModal(false)} onSave={handleGlobalLimit} limit={globalLimit} setLimit={setGlobalLimit} />}
{guestForQR && (
        <QRCodeModal
          guestName={guestForQR.name}
          uniqueCode={guestForQR.unique_code}
          pointsConsumed={guestForQR.points_consumed}
          pointsLimit={guestForQR.points_limit}
          status={guestForQR.status}
          onClose={() => setGuestForQR(null)}
        />
      )}
    </div>
  );
};

// --- Helper Components ---

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 p-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
      active ? 'bg-white text-black shadow-xl scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatMini: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = "text-white" }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{label}</p>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
  </div>
);

const GuestCard: React.FC<{ guest: Guest; onQR: () => void; onEdit: () => void; onReset: () => void; onDelete: () => void }> = ({ guest, onQR, onEdit, onReset, onDelete }) => (
  <div className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
    <div>
      <div className="flex items-center space-x-2">
        <h3 className="font-black uppercase text-gray-900">{guest.name}</h3>
        {guest.status === 'blocked' && <Ban size={14} className="text-red-500" />}
      </div>
      <div className="flex items-center space-x-3 mt-1">
        <span className="text-[10px] font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-400">#{guest.unique_code}</span>
        <span className={`text-[10px] font-black ${guest.status === 'blocked' ? 'text-red-500' : 'text-gray-400'}`}>
          {guest.points_consumed}/{guest.points_limit} PTS
        </span>
      </div>
    </div>
    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={onQR} className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl"><QrCode size={18} /></button>
      <button onClick={onEdit} className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl"><Edit2 size={18} /></button>
      <button onClick={onReset} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl"><RefreshCw size={18} /></button>
      <button onClick={onDelete} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
    </div>
  </div>
);

const AddGuestModal: React.FC<{ onClose: () => void; onSave: (e: React.FormEvent) => void; guest: any; setGuest: (v: any) => void; categories: any[] }> = ({ onClose, onSave, guest, setGuest, categories }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-[3rem] w-full max-w-md p-8">
      <h3 className="text-2xl font-black mb-6 uppercase">Nuevo Invitado</h3>
      <form onSubmit={onSave} className="space-y-6">
        <input type="text" required autoFocus value={guest.name} onChange={e => setGuest({...guest, name: e.target.value})} className="w-full px-6 py-5 bg-gray-50 rounded-2xl text-lg font-bold focus:outline-none focus:ring-2 ring-black" placeholder="NOMBRE COMPLETO" />
        <select value={guest.category_id} onChange={e => setGuest({...guest, category_id: parseInt(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black focus:outline-none">
          <option value="0">Sin Categoría</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex space-x-3">
          <button type="button" onClick={onClose} className="flex-1 py-5 font-black text-gray-400 uppercase text-xs tracking-widest">Cancelar</button>
          <button type="submit" className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Guardar</button>
        </div>
      </form>
    </div>
  </div>
);

const BulkImportModal: React.FC<{ onClose: () => void; onSave: (e: React.FormEvent) => void; names: string; setNames: (v: string) => void }> = ({ onClose, onSave, names, setNames }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-[3rem] w-full max-w-md p-8 flex flex-col max-h-[90vh]">
      <h3 className="text-2xl font-black mb-2 uppercase">Carga Masiva</h3>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Un nombre por línea</p>
      <form onSubmit={onSave} className="flex-1 flex flex-col space-y-6 min-h-0">
        <textarea required value={names} onChange={e => setNames(e.target.value)} className="flex-1 w-full p-6 bg-gray-50 rounded-2xl font-bold focus:outline-none focus:ring-2 ring-black resize-none" placeholder="Juan Perez&#10;Maria Garcia..." />
        <div className="flex space-x-3">
          <button type="button" onClick={onClose} className="flex-1 py-5 font-black text-gray-400 uppercase text-xs tracking-widest">Cancelar</button>
          <button type="submit" className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Importar</button>
        </div>
      </form>
    </div>
  </div>
);

const EditGuestModal: React.FC<{ onClose: () => void; onSave: (e: React.FormEvent) => void; guest: any; setGuest: (v: any) => void; categories: any[] }> = ({ onClose, onSave, guest, setGuest, categories }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-[3rem] w-full max-w-md p-8">
      <h3 className="text-2xl font-black mb-6 uppercase">Editar Invitado</h3>
      <form onSubmit={onSave} className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nombre</label>
          <input type="text" required value={guest.name} onChange={e => setGuest({...guest, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl text-lg font-bold focus:outline-none ring-2 ring-transparent focus:ring-black" />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Categoría</label>
          <select value={guest.category_id} onChange={e => setGuest({...guest, category_id: parseInt(e.target.value)})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black focus:outline-none">
            <option value="0">Sin Categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Estado</label>
          <select value={guest.status} onChange={e => setGuest({...guest, status: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-black focus:outline-none">
            <option value="active">Activo</option>
            <option value="blocked">Bloqueado</option>
            <option value="cooldown">Cooldown</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Límite de Puntos</label>
          <div className="flex items-center space-x-4 mt-2">
            <button type="button" onClick={() => setGuest({...guest, points_limit: Math.max(0, guest.points_limit - 10)})} className="w-12 h-12 bg-gray-50 rounded-xl font-black">-10</button>
            <span className="flex-1 text-center text-3xl font-black">{guest.points_limit}</span>
            <button type="button" onClick={() => setGuest({...guest, points_limit: guest.points_limit + 10})} className="w-12 h-12 bg-gray-50 rounded-xl font-black">+10</button>
          </div>
        </div>
        <div className="flex space-x-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 py-5 font-black text-gray-400 uppercase text-xs tracking-widest">Cancelar</button>
          <button type="submit" className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Actualizar</button>
        </div>
      </form>
    </div>
  </div>
);

const GlobalLimitModal: React.FC<{ onClose: () => void; onSave: (e: React.FormEvent) => void; limit: number; setLimit: (v: number) => void }> = ({ onClose, onSave, limit, setLimit }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-[3rem] w-full max-w-md p-8">
      <h3 className="text-2xl font-black mb-6 uppercase">Límite Global</h3>
      <form onSubmit={onSave} className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Límite para todos</label>
          <div className="flex items-center space-x-4 mt-2">
            <button type="button" onClick={() => setLimit(Math.max(0, limit - 10))} className="w-12 h-12 bg-gray-50 rounded-xl font-black">-10</button>
            <span className="flex-1 text-center text-3xl font-black">{limit}</span>
            <button type="button" onClick={() => setLimit(limit + 10)} className="w-12 h-12 bg-gray-50 rounded-xl font-black">+10</button>
          </div>
        </div>
        <div className="flex space-x-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 py-5 font-black text-gray-400 uppercase text-xs tracking-widest">Cancelar</button>
          <button type="submit" className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Aplicar</button>
        </div>
      </form>
    </div>
  </div>
);

export default Admin;
