import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { GlassWater, Users, Ban, TrendingUp, Clock, MapPin, Download } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  total_drinks_served: number;
  total_points_consumed: number;
  total_guests: number;
  blocked_guests: number;
  most_requested_drink: { name: string; times_served: number } | string;
  average_points_per_guest: string;
  consumption_by_hour: Array<{ hour: number; drinks_served: number }>;
  consumption_by_bar: Array<{ bar_name: string; total_drinks: number; total_points: number }>;
  consumption_timeline: Array<{ minute: string; drinks_served: number; points_consumed: number }>;
  consumption_by_category: Array<{ category_name: string; total_drinks: number; total_points: number }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (socket) {
      socket.on('new_transaction', () => {
        fetchStats();
      });
    }

    return () => {
      if (socket) {
        socket.off('new_transaction');
      }
    };
  }, [socket]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Cargando Dashboard...</p>
        </div>
      </div>
    );
  }

  const timelineData = {
    labels: stats.consumption_timeline.map(t => t.minute.split(' ')[1]),
    datasets: [
      {
        label: 'Bebidas por minuto',
        data: stats.consumption_timeline.map(t => t.drinks_served),
        borderColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const categoryData = {
    labels: stats.consumption_by_category.map(c => c.category_name),
    datasets: [
      {
        label: 'Consumo por Categoría',
        data: stats.consumption_by_category.map(c => c.total_drinks),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      },
    ],
  };

  const barData = {
    labels: stats.consumption_by_bar.map(b => b.bar_name),
    datasets: [
      {
        label: 'Bebidas por Barra',
        data: stats.consumption_by_bar.map(b => b.total_drinks),
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Dashboard</h1>
          <p className="text-gray-500 font-medium">Estadísticas en tiempo real del evento</p>
        </div>
        <div className="flex space-x-2">
          <a 
            href={`${api.defaults.baseURL}/export/pdf/report`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-2xl font-bold uppercase text-sm tracking-widest shadow-lg hover:scale-105 transition-transform"
          >
            <Download size={18} />
            <span>Reporte PDF</span>
          </a>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Bebidas" 
          value={stats.total_drinks_served} 
          icon={<GlassWater size={24} />} 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Puntos Totales" 
          value={stats.total_points_consumed} 
          icon={<TrendingUp size={24} />} 
          color="bg-green-50 text-green-600"
        />
        <StatCard 
          title="Promedio/Invitado" 
          value={stats.average_points_per_guest} 
          icon={<Users size={24} />} 
          color="bg-purple-50 text-purple-600"
        />
        <StatCard 
          title="Bloqueados" 
          value={stats.blocked_guests} 
          icon={<Ban size={24} />} 
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black uppercase mb-6 flex items-center space-x-2">
            <Clock size={20} />
            <span>Evolución Temporal (Última hora)</span>
          </h3>
          <div className="h-64">
            <Line data={timelineData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black uppercase mb-6 flex items-center space-x-2">
            <Users size={20} />
            <span>Consumo por Grupo</span>
          </h3>
          <div className="h-64 flex justify-center">
            <Pie data={categoryData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black uppercase mb-6 flex items-center space-x-2">
            <MapPin size={20} />
            <span>Rendimiento por Barra</span>
          </h3>
          <div className="h-64">
            <Bar data={barData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-center items-center text-center space-y-4">
          <h3 className="text-xl font-black uppercase opacity-60">Bebida más solicitada</h3>
          <p className="text-5xl font-black uppercase">
            {typeof stats.most_requested_drink === 'object' ? stats.most_requested_drink.name : stats.most_requested_drink}
          </p>
          <p className="text-xl font-bold opacity-60">
            {typeof stats.most_requested_drink === 'object' ? `${stats.most_requested_drink.times_served} veces servida` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-4 rounded-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black uppercase">{value}</p>
    </div>
  </div>
);

export default Dashboard;
