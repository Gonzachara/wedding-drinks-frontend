import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/QRCodeModal';
import { LogOut, UserPlus, RefreshCw, Trash2, Search, QrCode, GlassWater, Users, Ban, PieChart } from 'lucide-react';

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
  const [newGuestName, setNewGuestName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
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

  const handleResetDrinks = async (id: number) => {
    if (window.confirm('¿Estás seguro de resetear el consumo de este invitado?')) {
      try {
        await api.put(`/guests/reset/${id}`);
        fetchGuests();
      } catch (err) {
        console.error('Error resetting drinks', err);
      }
    }
  };

  const handleDeleteGuest = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar a este invitado?')) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4 px-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-black text-white p-2 rounded-lg">
            <GlassWater size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <button 
          onClick={logout}
          className="flex items-center space-x-2 text-gray-500 hover:text-black transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Salir</span>
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Invitados</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><GlassWater size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Bebidas Consumidas</p>
              <p className="text-2xl font-bold">{stats.consumed}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><Ban size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Invitados Bloqueados</p>
              <p className="text-2xl font-bold">{stats.blocked}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><PieChart size={24} /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Promedio Consumo</p>
              <p className="text-2xl font-bold">{(stats.consumed / (stats.total || 1)).toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Actions & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
          >
            <UserPlus size={20} />
            <span>AGREGAR INVITADO</span>
          </button>
        </div>

        {/* Guest List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Bebidas</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Cargando invitados...
                    </td>
                  </tr>
                ) : filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron invitados.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map(guest => (
                    <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{guest.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-1">{guest.unique_code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${guest.status === 'blocked' ? 'text-red-600' : 'text-gray-900'}`}>
                            {guest.drinks_consumed}
                          </span>
                          <span className="text-gray-300">/</span>
                          <span className="text-gray-500">{guest.max_drinks}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          guest.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {guest.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => setSelectedGuest(guest)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Ver código QR"
                          >
                            <QrCode size={18} />
                          </button>
                          <button 
                            onClick={() => handleResetDrinks(guest.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Resetear consumo"
                          >
                            <RefreshCw size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar invitado"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Nuevo Invitado</h3>
            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                  placeholder="Ej: María García"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                >
                  GUARDAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* QR Modal */}
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

export default Admin;
