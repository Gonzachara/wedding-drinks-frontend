import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GlassWater, Lock, UserRound } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showSetup = new URLSearchParams(location.search).get('setup') === '1';
  const [role, setRole] = useState<'admin' | 'bartender'>('admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = username.trim();
      const pass = password.trim();
      if (!user || !pass) {
        setError('Por favor, ingresa usuario y contraseña válidos');
        setLoading(false);
        return;
      }
      const response = await api.post('/auth/login', { username: user, password: pass });
      const { token } = response.data;
      login(token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    const user = username.trim();
    const pass = password.trim();
    if (!user || !pass) {
      setError('Ingresa usuario y contraseña válidos');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/register', { username: user, password: pass, role });
      const response = await api.post('/auth/login', { username: user, password: pass });
      const { token } = response.data;
      login(token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-black text-white rounded-full flex items-center justify-center mb-4">
            <GlassWater size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Wedding Drinks
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Control de bebidas para invitados
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 animate-pulse">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <UserRound size={20} />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all sm:text-sm"
                placeholder="Usuario"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all transform active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Iniciando sesión...' : 'INGRESAR'}
            </button>
          </div>
        </form>

        {showSetup && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="role" className="text-xs font-bold text-gray-500">Rol</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'bartender')}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="admin">admin</option>
                <option value="bartender">bartender</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 px-4 mt-2 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
              title="Crear usuario si no existe"
            >
              {loading ? 'Creando usuario...' : 'Crear usuario con estas credenciales'}
            </button>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400 font-bold uppercase tracking-widest text-[10px]">O SI ERES INVITADO</span></div>
        </div>

        <button 
          onClick={() => navigate('/portal')}
          className="w-full py-4 px-4 bg-gray-50 text-gray-900 rounded-xl font-bold text-sm border-2 border-gray-100 hover:bg-gray-100 transition-all active:scale-95 uppercase tracking-widest"
        >
          BUSCAR MI CÓDIGO
        </button>
        
      </div>
    </div>
  );
};

export default Login;
