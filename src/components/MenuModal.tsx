import React, { useEffect, useMemo, useState } from 'react';
import { X, Martini, Sparkles } from 'lucide-react';
import api from '../services/api';

interface Drink {
  id: number;
  name: string;
  description?: string;
  category?: string;
}

interface Props {
  onClose: () => void;
}

const MenuModal: React.FC<Props> = ({ onClose }) => {
  const [items, setItems] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/menu')
      .then(res => { if (mounted) setItems(res.data); })
      .catch(() => { if (mounted) setItems([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Drink[]> = {};
    for (const d of items) {
      const k = (d.category || 'Clásicos').trim();
      if (!map[k]) map[k] = [];
      map[k].push(d);
    }
    const entries = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [items]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-t-[3rem] md:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-lg">
              <Martini size={18} />
            </div>
            <h3 className="text-xl font-black uppercase dark:text-white">Carta de Tragos</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black dark:hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {loading ? (
            <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Sin tragos por ahora</div>
          ) : (
            grouped.map(([cat, list]) => (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">{cat}</p>
                  <div className="h-px bg-gray-100 dark:bg-white/10 flex-1 ml-3" />
                </div>
                <div className="space-y-2">
                  {list.sort((a,b)=>a.name.localeCompare(b.name)).map(item => (
                    <div key={item.id} className="flex items-start space-x-3 bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3">
                      <div className="p-2 bg-black text-white rounded-lg">
                        <Sparkles size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 dark:text-white leading-tight">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="w-full mt-4 py-5 bg-gray-50 dark:bg-white/10 text-gray-900 dark:text-white rounded-2xl font-black uppercase tracking-widest">Cerrar</button>
      </div>
    </div>
  );
};

export default MenuModal;
