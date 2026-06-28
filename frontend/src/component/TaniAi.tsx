import React from 'react';
import { 
  Leaf, 
  MapPin, 
  FlaskConical, 
  Route, 
  Mountain, 
  ScanLine,
  Home,
  CheckCircle,
  ShieldCheck,
  WifiOff
} from 'lucide-react';

export default function TaniAi({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col max-w-md mx-auto shadow-xl relative overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#1e2329] px-4 py-3 border-b-4 border-blue-500">
        <h1 className="text-xl font-semibold text-blue-400">TaNi Ai</h1>
      </div>

      {/* Sub Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 border border-emerald-500 rounded flex flex-col items-center justify-center text-[10px] text-emerald-600 font-bold leading-tight">
            <span>Tani</span>
            <span>Tinggi</span>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-emerald-500 font-bold text-sm">Validasi Pintar, Transparansi Akar.</h2>
          <p className="text-[10px] text-gray-500">Upland Integrity, On-Chain Authenticity.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Main Image Section */}
        <div className="px-4 py-3 bg-white">
          <div className="relative rounded-lg overflow-hidden h-64 bg-gray-200">
            {/* Background Mountain/Field Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-emerald-600 opacity-60 mix-blend-multiply"></div>
            <img 
              src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Tea Plantation" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Center Focus Square (Plant) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-black/20 rounded">
                <img 
                  src="https://images.unsplash.com/photo-1599598425947-330026296906?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" 
                  alt="Plant" 
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>

            {/* Viewfinder Corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-emerald-400"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-emerald-400"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-emerald-400"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-emerald-400"></div>

            {/* AI Detection Badge */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-gray-700 tracking-wider">AI DETECTION ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-4 py-4 bg-white">
          <h3 className="text-xs font-bold text-gray-600 tracking-widest mb-4">MASUKKAN DATA TANAMAN</h3>

          <div className="space-y-4">
            {/* Field 1 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nama Tanaman</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Misal: Kentang Granola"
                  className="w-full pl-3 pr-10 py-3 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <Leaf className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Field 2 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tempat di tanam</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Koordinat atau Nama Lahan"
                  className="w-full pl-3 pr-10 py-3 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Field 3 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jenis Pupuk</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Pilih atau Ketik Pupuk"
                  className="w-full pl-3 pr-10 py-3 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <FlaskConical className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Field 4 */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Jarak dari kota</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Kilometer (km)"
                  className="w-full pl-3 pr-10 py-3 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <Route className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>
          </div>

          {/* AI Weather Node Active Info Box */}
          <div className="mt-6 bg-[#f3edf7] rounded-xl p-4 flex items-center gap-4">
            <div className="bg-white p-2 rounded-full shadow-sm flex-shrink-0">
              <Mountain className="w-5 h-5 text-[#6750a4]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">AI Weather Node Active</h4>
              <p className="text-xs text-gray-500 leading-tight mt-1">
                Suhu & GPS otomatis<br/>
                divalidasi dari<br/>
                sensor terdekat
              </p>
            </div>
          </div>

          {/* Scan Button */}
          <button className="mt-6 w-full bg-[#059669] hover:bg-emerald-700 text-white py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors">
            <ScanLine className="w-5 h-5" />
            MULAI PINDAI DATA (FULL AI)
          </button>
        </div>
      </div>

      {/* Footer Details */}
      <div className="bg-[#f0fdf4] px-4 py-6 border-t border-emerald-100 flex-shrink-0">
        <div className="text-center mb-4">
          <p className="text-[10px] font-bold text-gray-500 tracking-widest mb-2">POWERED BY SECURE AGTECH STACK</p>
          <div className="inline-flex items-center gap-1 bg-emerald-100/50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            100% Data Integrity Guaranteed
          </div>
        </div>

        <button className="w-full bg-[#a7f3d0] text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 opacity-80 mb-2">
          <WifiOff className="w-4 h-4" />
          SIMPAN DATA KARANTINA (OFFLINE)
        </button>

        <p className="text-[9px] text-center text-gray-400 mt-4">
          © 2026 TaniTinggi Ecosystem. All Rights Reserved.
        </p>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-xl border-t-2 border-emerald-400 flex items-center px-6 py-2 gap-8 z-10 w-max">
        <button onClick={() => onNavigate?.('home')} className="flex flex-col items-center gap-1 text-emerald-500 relative group">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
          <div className="absolute -bottom-2 w-full h-0.5 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
        </button>
        
        <button onClick={() => onNavigate?.('tani-ai')} className="flex flex-col items-center gap-1 -mt-8 relative">
          <div className="bg-white rounded-full p-2 shadow-lg border-2 border-emerald-400">
            <ScanLine className="w-8 h-8 text-emerald-500" />
          </div>
          <span className="text-[10px] font-medium text-emerald-500">TaNi Ai</span>
        </button>
        
        <button onClick={() => onNavigate?.('certificate')} className="flex flex-col items-center gap-1 text-emerald-500 relative group">
          <CheckCircle className="w-6 h-6" />
          <span className="text-[10px] font-medium">Certificate</span>
          <div className="absolute -bottom-2 w-full h-0.5 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform"></div>
        </button>
      </div>
    </div>
  );
}
