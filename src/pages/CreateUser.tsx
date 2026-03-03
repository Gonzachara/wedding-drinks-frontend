import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, Lock, ShieldAlert, ArrowLeft } from 'lucide-react';

const CreateUser: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'bartender' | 'supervisor'>('bartender');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const user = username.trim();
    const pass = password.trim();
    if (!user || !pass) {
      setError('Ingresa usuario y contraseña válidos');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/register', { username: user, password: pass, role });
      setSuccess('Usuario creado correctamente. Ahora puedes iniciar sesión.');
      setUsername('');
      setPassword('');
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.message ?? 'No se pudo crear el usuario';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Crear usuario temporal</h1>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} /> Volver a ingresar
          </button>
        </div>

        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-amber-800 text-sm">
          <ShieldAlert size={18} />
          Esta página es temporal para crear usuarios y asignar roles.
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500">Usuario</label>
            <div className="mt-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <UserPlus size={18} className="text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Nombre de usuario"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Contraseña</label>
            <div className="mt-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <Lock size={18} className="text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'bartender' | 'supervisor')}
              className="mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm w-full"
            >
              <option value="admin">admin</option>
              <option value="bartender">bartender</option>
              <option value="supervisor">supervisor</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition-all active:scale-95"
          >
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
