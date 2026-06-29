import React, { useState, useRef } from 'react';
import { 
  Leaf, 
  MapPin, 
  FlaskConical, 
  Route, 
  Mountain, 
  ScanLine,
  Check,
  X,
  Camera,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

type ScanStatus = 'idle' | 'scanning' | 'safe' | 'unsafe';

// BACKEND DEV NOTE: onNavigate(tab, mode) navigates to a tab.
// When mode is 'safe' or 'unsafe', it tells the CertificatePanel which view to show.
export default function TaniAi({ onNavigate }: { onNavigate?: (tab: string, mode?: 'safe' | 'unsafe') => void }) {
  // State for camera/uploaded image
  const [plantImage, setPlantImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for scan process & mock logic for backend connection
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  
  // Toggle for testing both backend responses (True = Safe/Aman, False = Unsafe/Tidak Aman)
  const [mockResultType, setMockResultType] = useState<'safe' | 'unsafe'>('safe');

  // Handle image upload / capture
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPlantImage(URL.createObjectURL(file));
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setPlantImage(URL.createObjectURL(file));
    }
  };

  // Trigger scanning process (Simulating AI Backend call)
  const handleStartScan = () => {
    setScanStatus('scanning');
    
    // BACKEND DEV NOTE: Replace this setTimeout with your actual API call.
    // Example: fetch('/api/scan', { method: 'POST', body: formData })
    setTimeout(() => {
      setScanStatus(mockResultType);
    }, 2000);
  };

  // Reset scan state
  const handleResetScan = () => {
    setScanStatus('idle');
  };

  return (
    <div className="space-y-6 relative">
        {/* Main Image & Camera Capture Section */}
        <div className="relative rounded-xl overflow-hidden h-64 bg-gray-200 shadow-sm">
          {/* Background Mountain/Field */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-emerald-600 opacity-60 mix-blend-multiply"></div>
          <img 
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Tea Plantation Background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Center Interactive Focus Square (Plant Viewfinder & Drag-and-Drop) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="w-40 h-40 bg-black/30 backdrop-blur-xs rounded-xl border-2 border-dashed border-white/70 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-emerald-400 transition-all relative"
              title="Klik atau Drag & Drop foto tanaman di sini"
            >
              <img 
                src={plantImage || "https://images.unsplash.com/photo-1599598425947-330026296906?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"} 
                alt="Plant Preview" 
                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay camera prompt on hover/touch */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Ganti / Ambil Foto</span>
              </div>
            </div>

            {/* Hidden Input File for Mobile Camera & File Upload */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageChange} 
              className="hidden" 
            />
          </div>

          {/* Viewfinder Corner Framing */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-sm"></div>

          {/* AI Detection Active Badge */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-extrabold text-gray-700 tracking-wider">AI DETECTION ACTIVE</span>
          </div>
        </div>

        {/* Form Section */}
        <div className="relative">
          <h3 className="text-[10px] font-bold text-gray-500 tracking-widest mb-4">MASUKKAN DATA TANAMAN</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Nama Tanaman</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Misal: Kentang Granola"
                  className="w-full pl-3 pr-10 py-2.5 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <Leaf className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Tempat di tanam</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Koordinat atau Nama Lahan"
                  className="w-full pl-3 pr-10 py-2.5 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Jenis Pupuk</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Pilih atau Ketik Pupuk"
                  className="w-full pl-3 pr-10 py-2.5 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <FlaskConical className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Jarak dari kota</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Kilometer (km)"
                  className="w-full pl-3 pr-10 py-2.5 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <Route className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>

          {/* AI Weather Node Active Info Box */}
          <div className="mt-5 bg-[#f3edf7] rounded-xl p-3.5 flex items-center gap-4">
            <div className="bg-white p-2 rounded-full shadow-sm flex-shrink-0">
              <Mountain className="w-5 h-5 text-[#6750a4]" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-gray-800">AI Weather Node Active</h4>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                Suhu & GPS otomatis<br/>
                divalidasi dari<br/>
                sensor terdekat
              </p>
            </div>
          </div>

          {/* Action Buttons based on Scan State */}
          {scanStatus === 'idle' && (
            <button 
              onClick={handleStartScan}
              className="mt-5 w-full bg-[#00945e] hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors touch-manipulation active:scale-95"
            >
              <ScanLine className="w-5 h-5" />
              MULAI PINDAI DATA (FULL AI)
            </button>
          )}

          {scanStatus === 'scanning' && (
            <button 
              disabled
              className="mt-5 w-full bg-emerald-800/80 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm opacity-90 cursor-wait"
            >
              <RefreshCw className="w-5 h-5 animate-spin" />
              MEMINDAI TANAMAN...
            </button>
          )}

          {scanStatus === 'safe' && (
            <div className="space-y-2 mt-5">
              <button 
                onClick={() => onNavigate?.('certificate', 'safe')}
                className="w-full bg-[#00945e] hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all touch-manipulation active:scale-95"
              >
                Lihat Sertifikasi <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={handleResetScan}
                className="w-full text-center text-xs font-semibold text-emerald-700 py-1 hover:underline"
              >
                Pindai Tanaman Lain
              </button>
            </div>
          )}

          {scanStatus === 'unsafe' && (
            <div className="space-y-2 mt-5">
              <button 
                onClick={() => onNavigate?.('certificate', 'unsafe')}
                className="w-full bg-[#c53030] hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all touch-manipulation active:scale-95"
              >
                Lihat kenapa <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={handleResetScan}
                className="w-full text-center text-xs font-semibold text-red-600 py-1 hover:underline"
              >
                Coba Ulang Pemindaian
              </button>
            </div>
          )}

          {/* MOCK BACKEND RESULT TOGGLE SWITCHER (FOR EASY BACKEND INTEGRATION) */}
          <div className="mt-6 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              🔧 Simulasi Hasil AI (Uji Coba Backend)
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => { setMockResultType('safe'); setScanStatus('idle'); }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  mockResultType === 'safe' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                Set: Tanaman Aman
              </button>
              <button
                onClick={() => { setMockResultType('unsafe'); setScanStatus('idle'); }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  mockResultType === 'unsafe' 
                    ? 'bg-red-600 text-white shadow-xs' 
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                Set: Tidak Aman
              </button>
            </div>
          </div>

          {/* FLOATING MODAL OVERLAYS (NON-BLOCKING POPUP THAT DISMISSES ON TAP OR TIMEOUT) */}
          {scanStatus === 'scanning' && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-xs rounded-xl flex items-center justify-center z-30 animate-fade-in p-4">
              <div className="bg-[#00945e] text-white p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center w-44 h-44 text-center border-2 border-white/20">
                <p className="text-sm font-bold leading-tight mb-4">Memindai<br />tanaman</p>
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            </div>
          )}

          {scanStatus === 'safe' && (
            <div 
              onClick={() => setScanStatus('safe')}
              className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xs rounded-2xl flex items-center justify-center z-30 p-2 cursor-pointer animate-fade-in"
              title="Ketuk untuk menutup pop-up"
            >
              <div className="bg-[#00945e] text-white p-5 rounded-2xl shadow-2xl flex flex-col items-center justify-center w-44 h-44 text-center border-2 border-white/20">
                <p className="text-sm font-bold leading-tight mb-3">Tanaman<br />mu Aman!</p>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <Check className="w-8 h-8 text-white" strokeWidth={3.5} />
                </div>
                <span className="text-[9px] opacity-80">(Ketuk untuk tutup)</span>
              </div>
            </div>
          )}

          {scanStatus === 'unsafe' && (
            <div 
              onClick={() => setScanStatus('unsafe')}
              className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xs rounded-2xl flex items-center justify-center z-30 p-2 cursor-pointer animate-fade-in"
              title="Ketuk untuk menutup pop-up"
            >
              <div className="bg-[#c53030] text-white p-5 rounded-2xl shadow-2xl flex flex-col items-center justify-center w-44 h-44 text-center border-2 border-white/20">
                <p className="text-sm font-bold leading-tight mb-3">Tanaman<br />tidak aman</p>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <X className="w-8 h-8 text-white" strokeWidth={3.5} />
                </div>
                <span className="text-[9px] opacity-80">(Ketuk untuk tutup)</span>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
