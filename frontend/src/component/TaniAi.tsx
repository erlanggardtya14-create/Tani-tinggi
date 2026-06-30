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
  Truck,
  Weight,
  Bug,
} from 'lucide-react';
import {
  submitScan,
  pollRecord,
  statusToMode,
  ApiError,
  type FertilizerType,
  type VehicleType,
} from '../lib/api';
import { fileToDataUrl, hashFile } from '../lib/image';

type ScanStatus = 'idle' | 'scanning' | 'safe' | 'unsafe' | 'error';

// Opsi pupuk & kendaraan dipetakan ke enum backend (Prisma).
const FERTILIZERS: { value: FertilizerType; label: string }[] = [
  { value: 'ORGANIC_COMPOST', label: 'Kompos Organik' },
  { value: 'ORGANIC_MANURE', label: 'Pupuk Kandang' },
  { value: 'ORGANIC_LIQUID', label: 'Organik Cair' },
  { value: 'CHEMICAL_UREA', label: 'Kimia — Urea' },
  { value: 'CHEMICAL_NPK', label: 'Kimia — NPK' },
  { value: 'NONE', label: 'Tanpa Pupuk' },
];

const VEHICLES: { value: VehicleType; label: string }[] = [
  { value: 'MOTORCYCLE', label: 'Motor / Ojek' },
  { value: 'PICKUP_TRUCK', label: 'Pikap' },
  { value: 'MEDIUM_TRUCK', label: 'Truk Sedang' },
  { value: 'HEAVY_TRUCK', label: 'Truk Besar' },
  { value: 'ELECTRIC_VEHICLE', label: 'Kendaraan Listrik' },
];

const inputClass =
  'w-full pl-3 pr-10 py-2.5 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white';

// BACKEND DEV NOTE: onNavigate(tab, mode, recordId) — recordId diteruskan ke
// CertificatePanel agar ia bisa fetch detail record nyata dari backend.
export default function TaniAi({
  onNavigate,
}: {
  onNavigate?: (tab: string, mode?: 'safe' | 'unsafe', recordId?: string) => void;
}) {
  // Gambar tanaman: preview (object URL) + File asli (untuk hash & upload base64).
  const [plantImage, setPlantImage] = useState<string | null>(null);
  const [plantFile, setPlantFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status proses scan & pesan progres/error.
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [lastRecordId, setLastRecordId] = useState<string | null>(null);

  // Field form (terkontrol) — dipetakan ke payload /sync.
  const [vegetableType, setVegetableType] = useState('');
  const [vegetableWeight, setVegetableWeight] = useState('');
  const [fertilizerType, setFertilizerType] = useState<FertilizerType>('ORGANIC_COMPOST');
  const [vehicleType, setVehicleType] = useState<VehicleType>('PICKUP_TRUCK');
  const [distanceKm, setDistanceKm] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [pesticidesUsed, setPesticidesUsed] = useState(false);

  const setFile = (file: File) => {
    setPlantFile(file);
    setPlantImage(URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  // Validasi field wajib sebelum kirim ke backend.
  function validate(): string | null {
    if (!plantFile) return 'Ambil atau unggah foto tanaman terlebih dahulu.';
    if (!vegetableType.trim()) return 'Nama tanaman wajib diisi.';
    const w = Number(vegetableWeight);
    if (!w || w <= 0) return 'Berat panen harus lebih dari 0 kg.';
    const d = Number(distanceKm);
    if (!d || d <= 0) return 'Jarak pengiriman harus lebih dari 0 km.';
    if (!destinationCity.trim()) return 'Kota tujuan wajib diisi.';
    return null;
  }

  // Kirim ke backend lalu poll status sampai pipeline selesai.
  const handleStartScan = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      setScanStatus('error');
      return;
    }

    setScanStatus('scanning');
    setProgress('Mengunggah & memvalidasi foto...');
    setErrorMsg('');

    try {
      const [imageBase64, imageHash] = await Promise.all([
        fileToDataUrl(plantFile!),
        hashFile(plantFile!),
      ]);

      const recordId = await submitScan({
        vegetableType: vegetableType.trim(),
        vegetableWeight: Number(vegetableWeight),
        fertilizerType,
        pesticidesUsed,
        distanceKm: Number(distanceKm),
        vehicleType,
        destinationCity: destinationCity.trim(),
        imageBase64,
        imageHash,
      });
      setLastRecordId(recordId);

      const record = await pollRecord(recordId, {
        onTick: (r) => setProgress(statusLabel(r.status)),
      });

      const mode = statusToMode(record.status);
      setScanStatus(mode);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Terjadi kesalahan tak terduga saat memindai.';
      setErrorMsg(message);
      setScanStatus('error');
    }
  };

  const handleResetScan = () => {
    setScanStatus('idle');
    setProgress('');
    setErrorMsg('');
  };

  return (
    <div className="space-y-6 relative">
      {/* Main Image & Camera Capture Section */}
      <div className="relative rounded-xl overflow-hidden h-64 bg-gray-200 shadow-sm">
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
              src={
                plantImage ||
                'https://images.unsplash.com/photo-1599598425947-330026296906?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
              }
              alt="Plant Preview"
              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
            />

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">Ganti / Ambil Foto</span>
            </div>
          </div>

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

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-extrabold text-gray-700 tracking-wider">AI DETECTION ACTIVE</span>
        </div>
      </div>

      {/* Form Section */}
      <div className="relative">
        <h3 className="text-[10px] font-bold text-gray-500 tracking-widest mb-4">MASUKKAN DATA TANAMAN</h3>

        <div className="space-y-4">
          {/* Nama Tanaman */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Nama Tanaman</label>
            <div className="relative">
              <input
                type="text"
                value={vegetableType}
                onChange={(e) => setVegetableType(e.target.value)}
                placeholder="Misal: Kentang, Brokoli, Wortel"
                className={inputClass}
              />
              <Leaf className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Berat Panen */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Berat Panen (kg)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                value={vegetableWeight}
                onChange={(e) => setVegetableWeight(e.target.value)}
                placeholder="Misal: 50"
                className={inputClass}
              />
              <Weight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Jenis Pupuk */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Jenis Pupuk</label>
            <div className="relative">
              <select
                value={fertilizerType}
                onChange={(e) => setFertilizerType(e.target.value as FertilizerType)}
                className={`${inputClass} appearance-none`}
              >
                {FERTILIZERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <FlaskConical className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Jenis Kendaraan */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Kendaraan Pengiriman</label>
            <div className="relative">
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className={`${inputClass} appearance-none`}
              >
                {VEHICLES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
              <Truck className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Kota Tujuan */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Kota Tujuan</label>
            <div className="relative">
              <input
                type="text"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="Misal: Semarang"
                className={inputClass}
              />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Jarak dari kota */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Jarak ke Kota Tujuan</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder="Kilometer (km)"
                className={inputClass}
              />
              <Route className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>

          {/* Pestisida */}
          <button
            type="button"
            onClick={() => setPesticidesUsed((v) => !v)}
            className="w-full flex items-center justify-between border border-emerald-300 rounded-lg px-3 py-2.5 bg-white"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Bug className="w-4 h-4 text-gray-400" />
              Menggunakan Pestisida?
            </span>
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                pesticidesUsed ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pesticidesUsed ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </div>

        {/* AI Weather Node Active Info Box */}
        <div className="mt-5 bg-[#f3edf7] rounded-xl p-3.5 flex items-center gap-4">
          <div className="bg-white p-2 rounded-full shadow-sm flex-shrink-0">
            <Mountain className="w-5 h-5 text-[#6750a4]" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-gray-800">AI Weather Node Active</h4>
            <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
              Suhu &amp; GPS otomatis
              <br />
              divalidasi dari
              <br />
              sensor terdekat
            </p>
          </div>
        </div>

        {/* Inline error message */}
        {scanStatus === 'error' && errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            <X className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons based on Scan State */}
        {(scanStatus === 'idle' || scanStatus === 'error') && (
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
              onClick={() => onNavigate?.('certificate', 'safe', lastRecordId ?? undefined)}
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
              onClick={() => onNavigate?.('certificate', 'unsafe', lastRecordId ?? undefined)}
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

        {/* FLOATING MODAL OVERLAYS */}
        {scanStatus === 'scanning' && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs rounded-xl flex items-center justify-center z-30 animate-fade-in p-4">
            <div className="bg-[#00945e] text-white p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center w-52 min-h-44 text-center border-2 border-white/20">
              <p className="text-sm font-bold leading-tight mb-4">Memindai tanaman</p>
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              {progress && <p className="text-[10px] opacity-90 mt-4 leading-tight">{progress}</p>}
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
              <p className="text-sm font-bold leading-tight mb-3">
                Tanaman
                <br />
                mu Aman!
              </p>
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
              <p className="text-sm font-bold leading-tight mb-3">
                Tanaman
                <br />
                tidak aman
              </p>
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

// Label progres ramah-pengguna dari status pipeline backend.
function statusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Menunggu antrean proses...';
    case 'AI_VALIDATING':
      return 'AI memvalidasi keaslian foto...';
    case 'CALCULATING':
      return 'Menghitung jejak karbon...';
    case 'CERTIFYING':
      return 'Menerbitkan sertifikat blockchain...';
    case 'CERTIFIED':
      return 'Sertifikat terbit!';
    case 'AI_REJECTED':
      return 'Foto ditolak AI';
    case 'FAILED':
      return 'Validasi gagal';
    default:
      return 'Memproses...';
  }
}
