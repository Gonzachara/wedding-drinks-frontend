import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Martini, History } from 'lucide-react';
import MenuModal from './MenuModal';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

interface QRCodeModalProps {
  guestName: string;
  uniqueCode: string;
  onClose: () => void;
  pointsConsumed?: number;
  pointsLimit?: number;
  status?: 'active' | 'blocked' | 'cooldown';
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ guestName, uniqueCode, onClose, pointsConsumed, pointsLimit, status }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [history, setHistory] = useState<Array<{ id: number; drink_name: string; points: number; timestamp: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    let mounted = true;
    api.get(`/guests/public/history/${uniqueCode}`)
      .then(res => { if (mounted) setHistory(res.data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [uniqueCode]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: any) => {
      if (payload && payload.guest_code === uniqueCode) {
        setHistory(prev => [
          { id: Date.now(), drink_name: payload.drink_name, points: payload.points, timestamp: new Date().toISOString() },
          ...prev.slice(0, 19)
        ]);
      }
    };
    socket.on('new_transaction', handler);
    return () => { socket.off('new_transaction', handler); };
  }, [socket, uniqueCode]);

  const downloadQR = () => {
    const svg = document.getElementById('guest-qr');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-${guestName.replace(/\s+/g, '-')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in fade-in zoom-in duration-200 flex flex-col items-center">
        <div className="w-full flex justify-end">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="text-center space-y-2 mb-8">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{guestName.toUpperCase()}</h3>
          <p className="text-2xl text-gray-500 font-mono tracking-widest">{uniqueCode}</p>
          {(typeof pointsConsumed === 'number' && typeof pointsLimit === 'number') && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase
              bg-gray-100 text-gray-700">
              {pointsConsumed}/{pointsLimit} bebidas {status === 'blocked' ? '• LÍMITE' : status === 'cooldown' ? '• COOLDOWN' : ''}
            </div>
          )}
        </div>

        <div className="p-5 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 mb-8">
          <QRCodeSVG 
            id="guest-qr"
            value={`${window.location.origin}/guest/${uniqueCode}`} 
            size={300} 
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 w-full">
          <button 
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center justify-center space-x-2 bg-white border-2 border-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          >
            <Martini size={20} />
            <span>{showMenu ? 'Ocultar carta' : 'Ver carta de tragos'}</span>
          </button>
          <button 
            onClick={downloadQR}
            className="flex items-center justify-center space-x-2 bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
          >
            <Download size={20} />
            <span>DESCARGAR</span>
          </button>
          {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
          
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center justify-center space-x-2 bg-white border-2 border-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
          >
            <History size={20} />
            <span>Historial</span>
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black uppercase text-sm">Historial de {guestName}</h4>
              <button onClick={() => setShowHistory(false)} className="p-2 text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">Sin movimientos aún.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    <div>
                      <p className="font-bold">{h.drink_name || 'Bebida'}</p>
                      <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="font-black text-gray-700">+1 bebida</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeModal;
