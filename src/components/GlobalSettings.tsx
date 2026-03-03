import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, Shield, Clock, Coins, AlertCircle } from 'lucide-react';

interface Setting {
  setting_key: string;
  setting_value: string;
  description: string;
}

const GlobalSettings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const response = await api.get('/management/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSaving(true);
    try {
      await api.put(`/management/settings/${key}`, { setting_value: value });
      setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s));
      setMsg('Cambio guardado');
      setTimeout(() => setMsg(''), 2000);
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando configuración...</div>;

  const getSetting = (key: string) => settings.find(s => s.setting_key === key);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tight flex items-center space-x-2">
          <Settings size={24} />
          <span>Configuración Global</span>
        </h2>
        {msg && <span className="bg-green-100 text-green-600 px-4 py-1 rounded-full text-xs font-bold animate-pulse">{msg}</span>}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emergency Mode */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center space-x-3 text-red-600">
            <Shield size={20} />
            <h3 className="font-black uppercase text-sm">Modo Emergencia</h3>
          </div>
          <div className="flex flex-col space-y-2">
            {[
              { id: 'inactive', label: 'Inactivo', color: 'bg-gray-100 text-gray-600' },
              { id: 'alcohol_off', label: 'Bloquear Alcohol', color: 'bg-orange-100 text-orange-600' },
              { id: 'full_stop', label: 'Bloqueo Total', color: 'bg-red-100 text-red-600' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => handleUpdate('emergency_mode', mode.id)}
                disabled={saving}
                className={`p-4 rounded-2xl font-bold text-sm uppercase transition-all ${
                  getSetting('emergency_mode')?.setting_value === mode.id 
                  ? `${mode.color} ring-2 ring-offset-2 ring-current` 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 font-medium leading-tight">
            Bloquea el consumo de forma global e inmediata en todas las barras.
          </p>
        </section>

        {/* Cooldown Settings */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center space-x-3 text-blue-600">
            <Clock size={20} />
            <h3 className="font-black uppercase text-sm">Intervalo Cooldown</h3>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={getSetting('guest_cooldown_seconds')?.setting_value || 30}
              onChange={(e) => handleUpdate('guest_cooldown_seconds', e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-xl font-black focus:border-blue-600 focus:outline-none"
            />
            <span className="font-bold text-gray-400 uppercase text-xs">Segundos</span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium leading-tight">
            Tiempo mínimo de espera entre registros para un mismo invitado.
          </p>
        </section>

        {/* Default Points */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center space-x-3 text-green-600">
            <Coins size={20} />
            <h3 className="font-black uppercase text-sm">Puntos por Defecto</h3>
          </div>
          <input
            type="number"
            value={getSetting('default_guest_points')?.setting_value || 100}
            onChange={(e) => handleUpdate('default_guest_points', e.target.value)}
            className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-xl font-black focus:border-green-600 focus:outline-none"
          />
          <p className="text-[10px] text-gray-400 font-medium leading-tight">
            Límite de puntos asignado automáticamente a nuevos invitados.
          </p>
        </section>

        {/* suspicious activity */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center space-x-3 text-purple-600">
            <AlertCircle size={20} />
            <h3 className="font-black uppercase text-sm">Detección Sospechosa</h3>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={getSetting('suspicious_behavior_interval')?.setting_value || 10}
              onChange={(e) => handleUpdate('suspicious_behavior_interval', e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-xl font-black focus:border-purple-600 focus:outline-none"
            />
            <span className="font-bold text-gray-400 uppercase text-xs">Segundos</span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium leading-tight">
            Intervalo para marcar una transacción como sospechosa (fraude).
          </p>
        </section>
      </div>
    </div>
  );
};

export default GlobalSettings;
