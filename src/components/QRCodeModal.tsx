import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download } from 'lucide-react';

interface QRCodeModalProps {
  guestName: string;
  uniqueCode: string;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ guestName, uniqueCode, onClose }) => {
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
            onClick={downloadQR}
            className="flex items-center justify-center space-x-2 bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
          >
            <Download size={20} />
            <span>DESCARGAR</span>
          </button>
{/*
<button 
  onClick={() => window.print()}
  className="flex items-center justify-center space-x-2 border-2 border-gray-100 text-gray-900 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
>
  <Printer size={20} />
  <span>IMPRIMIR</span>
</button>
*/}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
