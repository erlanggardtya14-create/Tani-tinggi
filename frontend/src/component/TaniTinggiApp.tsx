import { useState, type ReactNode } from 'react';
import { Award, CloudOff, Home, Leaf, Scan, BadgeCheck, ShieldCheck, AlertTriangle, Copy, ChevronRight, Image as ImageIcon } from 'lucide-react';
import TaniAi from './TaniAi';

// BACKEND DEV NOTE: This type represents the AI scan result.
// 'safe' = plant passed validation → shows green certificate
// 'unsafe' = plant failed validation → shows red audit report
// null = no scan performed yet → shows default certificate list
export type CertResultMode = 'safe' | 'unsafe' | null;

type ActiveTab = 'home' | 'tani-ai' | 'certificate';

type Step = {
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    title: 'Ambil Foto & Isi Data',
    description:
      'Buka menu TaNi AI, ambil foto sayuran segar di ladang, dan masukkan data pupuk serta lokasi.',
  },
  {
    title: 'Audit Otonom AI',
    description:
      'Sistem AI secara otomatis memvalidasi keaslian visual sayur serta mencocokkan suhu cuaca lokal secara offline.',
  },
  {
    title: 'Kunci Data ke Blockchain',
    description:
      'Begitu mendapat sinyal internet, laporanmu otomatis terenkripsi dan masuk ke jaringan Web3 menjadi Sertifikat Hijau.',
  },
];

const navItems: Array<{
  id: ActiveTab;
  label: string;
  icon: any;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tani-ai', label: 'TaNi Ai', icon: Scan },
  { id: 'certificate', label: 'Certificate', icon: BadgeCheck },
];

export default function TaniTinggiApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  
  // BACKEND DEV NOTE: certMode tracks the last AI scan result.
  // When the backend returns a scan result, set this to 'safe' or 'unsafe'
  // to control which certificate view is shown.
  const [certMode, setCertMode] = useState<CertResultMode>(null);

  // Navigation handler that also sets certMode when coming from scan results
  const handleNavigateWithResult = (tab: string, mode?: 'safe' | 'unsafe') => {
    if (mode) setCertMode(mode);
    setActiveTab(tab as ActiveTab);
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-[#064e3b] antialiased"
      style={{ fontFamily: 'Montserrat, ui-sans-serif, system-ui, sans-serif' }}
    >
      <MobileLayout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        certMode={certMode}
        onNavigateWithResult={handleNavigateWithResult}
      />
    </div>
  );
}

function MobileLayout({
  activeTab,
  setActiveTab,
  certMode,
  onNavigateWithResult,
}: {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  certMode: CertResultMode;
  onNavigateWithResult: (tab: string, mode?: 'safe' | 'unsafe') => void;
}) {
  return (
    <div className="block min-h-screen bg-slate-50 relative">
      <header className="flex items-center bg-white px-5 py-4 border-b border-gray-200 sticky top-0 z-30">
        <div className="shrink-0">
          <img 
            src="/logo.png" 
            alt="Tani Tinggi Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="flex-1 text-center pr-10">
          <h2 className="text-[15px] italic font-semibold text-[#2bb27b]">
            Validasi Pintar, Transparansi Akar.
          </h2>
          <p className="text-[10px] text-gray-400 italic mt-0.5">
            Upland Integrity, On-Chain Authenticity.
          </p>
        </div>
      </header>

      <main className="px-4 py-6 pb-28">
        <div key={activeTab} className="mx-auto max-w-md space-y-6 animate-page-tab">
          {activeTab === 'home' && (
            <>
              <HeroFarm compact />
              <MobileHomeCopy />
              <StepsList />
              <PrimaryCta onClick={() => setActiveTab('tani-ai')} />
            </>
          )}

          {activeTab === 'tani-ai' && (
            <TaniAi onNavigate={(tab, mode) => onNavigateWithResult(tab, mode)} />
          )}

          {activeTab === 'certificate' && <CertificatePanel mode={certMode} />}
        </div>
      </main>

      {(activeTab === 'home' || activeTab === 'tani-ai') && <Footer />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ease-out active:scale-95 ${
        active ? 'bg-[#00945e] text-white shadow-sm' : 'text-[#064e3b] hover:bg-white'
      }`}
    >
      <Icon size={17} />
      {item.label}
    </button>
  );
}

function BottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[400px] touch-manipulation">
      <div className="relative flex items-center justify-between rounded-[2.5rem] border-[1.5px] border-[#00945e] bg-white px-7 py-3 shadow-xl">
        
        <button 
          onClick={() => setActiveTab('home')}
          className="flex flex-col items-center gap-1 w-16 group active:scale-90 transition-transform duration-200 ease-out touch-manipulation will-change-transform"
        >
          <Home 
            className={`w-[22px] h-[22px] text-[#00945e] transition-all duration-300 ease-out will-change-transform ${
              activeTab === 'home' ? 'scale-110' : 'opacity-70 group-hover:opacity-100 scale-100'
            }`} 
            fill="none" 
            strokeWidth={activeTab === 'home' ? 2.8 : 2.2} 
          />
          <span className={`text-[11px] font-bold text-[#00945e] transition-opacity duration-300 ${
            activeTab === 'home' ? 'opacity-100' : 'opacity-75'
          }`}>Home</span>
          <div 
            className={`mt-0.5 h-[2.5px] w-6 rounded-full bg-[#00945e] transition-all duration-300 ease-out transform will-change-transform ${
              activeTab === 'home' ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
            }`} 
          />
        </button>

        <div className="absolute left-1/2 -top-6 -translate-x-1/2 flex flex-col items-center group touch-manipulation">
          <button 
            onClick={() => setActiveTab('tani-ai')}
            className={`flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full border-[1.5px] border-[#00945e] bg-white shadow-sm active:scale-90 transition-all duration-200 ease-out touch-manipulation will-change-transform ${
              activeTab === 'tani-ai' ? 'ring-4 ring-[#00945e]/15 shadow-md' : ''
            }`}
          >
            <Scan 
              className={`h-6 w-6 text-[#00945e] transition-transform duration-300 ease-out will-change-transform ${
                activeTab === 'tani-ai' ? 'scale-110' : 'scale-100'
              }`} 
              strokeWidth={activeTab === 'tani-ai' ? 2.8 : 2.2} 
            />
          </button>
          <span className={`mt-1 text-[11px] font-bold text-[#00945e] transition-opacity duration-300 ${
            activeTab === 'tani-ai' ? 'opacity-100' : 'opacity-75'
          }`}>TaNi Ai</span>
          <div 
            className={`mt-0.5 h-[2.5px] w-6 rounded-full bg-[#00945e] transition-all duration-300 ease-out transform will-change-transform ${
              activeTab === 'tani-ai' ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
            }`} 
          />
        </div>

        <button 
          onClick={() => setActiveTab('certificate')}
          className="flex flex-col items-center gap-1 w-16 group active:scale-90 transition-transform duration-200 ease-out touch-manipulation will-change-transform"
        >
          <BadgeCheck 
            className={`w-[22px] h-[22px] text-[#00945e] transition-all duration-300 ease-out will-change-transform ${
              activeTab === 'certificate' ? 'scale-110' : 'opacity-70 group-hover:opacity-100 scale-100'
            }`} 
            fill="none" 
            strokeWidth={activeTab === 'certificate' ? 2.8 : 2.2} 
          />
          <span className={`text-[11px] font-bold text-[#00945e] transition-opacity duration-300 ${
            activeTab === 'certificate' ? 'opacity-100' : 'opacity-75'
          }`}>Certificate</span>
          <div 
            className={`mt-0.5 h-[2.5px] w-6 rounded-full bg-[#00945e] transition-all duration-300 ease-out transform will-change-transform ${
              activeTab === 'certificate' ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
            }`} 
          />
        </button>
        
      </div>
    </div>
  );
}

function HeroFarm({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`w-full rounded-[1.75rem] bg-white pb-3 ${
        compact ? 'mx-auto max-w-sm' : 'max-w-lg'
      }`}
    >
      <div className="overflow-hidden rounded-[1.5rem]">
        <img 
          src="/homecomponen.png" 
          alt="Home Component Illustration" 
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-[#00945e] border border-emerald-200 shadow-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00945e]"></div>
          AI VALIDATED
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-bold text-gray-600 border border-gray-200 shadow-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-500"></div>
          OFFLINE READY
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-emerald-100 bg-[#F0FDF4] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#00945e]">
      {children}
    </span>
  );
}

function HomePanel({ setActiveTab }: { setActiveTab: (tab: ActiveTab) => void }) {
  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-[#00945e]">
          Platform Validasi Agtech
        </p>
        <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight text-[#064e3b]">
          Tinggikan Nilai Hasil Tanammu
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-emerald-950/70">
          Validasi otomatis foto sayuran, kondisi lahan, dan data cuaca menjadi sertifikat hijau
          yang siap dibagikan.
        </p>
      </div>

      <StepsList />
      <PrimaryCta onClick={() => setActiveTab('tani-ai')} />
    </div>
  );
}

function MobileHomeCopy() {
  return (
    <section className="space-y-6 text-center mt-2">
      <div>
        <h1 className="mx-auto max-w-xs text-[22px] font-black leading-tight text-[#064e3b]">
          Tinggikan Nilai<br />Hasil Tanammu
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-emerald-950/70">
          Validasi otomatis foto sayuran dan kualitas lingkungan lahanmu dengan AI untuk langsung
          terhubung ke Supermarket Kota.
        </p>
      </div>

      <h2 className="mx-auto max-w-xs text-lg font-black leading-tight text-[#064e3b] pt-4">
        3 Langkah Mudah Lapor Tanam
      </h2>
    </section>
  );
}

function StepsList() {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <article
          key={step.title}
          className="flex items-start gap-4 rounded-xl border border-emerald-300/60 bg-white p-4 shadow-sm"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00945e] text-xs font-bold text-white mt-0.5">
            {index + 1}
          </div>
          <div>
            <h3 className="font-bold text-[#064e3b] text-sm">{step.title}</h3>
            <p className="mt-1 text-xs leading-5 text-emerald-950/65">{step.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function PrimaryCta({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-[#00945e] py-3.5 font-bold text-white shadow-md transition-all hover:bg-emerald-700"
    >
      MULAI SEKARANG
    </button>
  );
}

function TaniAiPanel() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-[#00945e]">
          TaNi AI
        </p>
        <h1 className="text-4xl font-black leading-tight text-[#064e3b] md:text-5xl">
          Audit sayur dari kamera ladang.
        </h1>
        <p className="mt-4 text-base leading-7 text-emerald-950/70 md:text-lg">
          Mode pemindaian membantu petani mengirim foto, lokasi, dan data pupuk bahkan saat koneksi
          belum stabil.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="grid aspect-video place-items-center rounded-2xl border-2 border-dashed border-emerald-200 bg-[#F0FDF4] text-center">
          <div>
            <Scan className="mx-auto text-[#00945e]" size={48} />
            <p className="mt-3 font-black text-[#064e3b]">Siap Validasi Visual</p>
            <p className="mt-1 text-sm text-emerald-950/60">Offline capture queue aktif</p>
          </div>
        </div>
      </div>

      <PrimaryCta />
    </div>
  );
}

// ============================================================
// CERTIFICATE PANEL COMPONENT
// ============================================================
// BACKEND DEV NOTE:
// This component displays two views based on the 'mode' prop:
//   mode='safe'   → Green Certificate (Sertifikat Hijau)
//   mode='unsafe' → Red Audit Report (Hasil Audit Lahan)
//   mode=null     → Default green certificate (fallback)
//
// All data below is MOCK/PLACEHOLDER. Replace with real API data.
// Suggested API endpoints:
//   GET /api/certificate/:id → returns certificate data
//   GET /api/audit/:id       → returns audit/rejection data
// ============================================================

function CertificatePanel({ mode }: { mode: CertResultMode }) {
  // BACKEND DEV NOTE: Replace these mock values with data from your API response.
  const mockCertData = {
    komoditas: 'Selada Mountain',
    lokasiLahan: 'Petak 4B, Lereng Utara',
    suhuValidasi: '17°C',
    eSkorKarbon: 'RENDAH',
    eSkorKarbonHash: '#B1C7',
    blockchainHash: '#2A4F',
    polygonTxHash: '0xFA9C...7F28',
    tanggalValidasi: '28 Juni 2026',
  };

  const mockAuditData = {
    komoditas: 'Selada Mountain',
    statusAi: 'GAGAL VALIDASI',
    errorDiag: 'Kesalahan/Error Diag. 31%',
    blockchainStatus: 'REJECTED',
    blockchainNote: 'TIDAK DIREKAM',
    rekomendasi: [
      'Isolasi tanaman di Petak 4B segera agar tidak menular ke zona hijau.',
      'Berikan pupuk organik cair penangkal jamur alami dosis tinggi.',
      'Lakukan pemindaian ulang sensor multispektoral dalam waktu 3 × 24 jam.',
    ],
  };

  // Copy hash to clipboard
  const handleCopyHash = () => {
    navigator.clipboard?.writeText(mockCertData.polygonTxHash);
  };

  // ── UNSAFE MODE: Red Audit Report ──
  if (mode === 'unsafe') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[28px] font-black leading-tight text-[#064e3b]">
            Hasil Audit Lahan
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Komoditas Terkarantina secara Otonom
          </p>
        </div>

        {/* Alert Banner */}
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-sm font-bold text-red-700">DETEKSI ANCAMAN AI</span>
        </div>

        {/* Komoditas Info */}
        <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Komoditas</p>
            <p className="mt-1 text-lg font-black text-[#064e3b]">{mockAuditData.komoditas}</p>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Status AI</p>
              <p className="mt-1 text-sm font-black text-red-600">{mockAuditData.statusAi}</p>
              <p className="text-[10px] text-red-400 mt-0.5">{mockAuditData.errorDiag}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Blockchain</p>
              <p className="mt-1 text-sm font-black text-red-600">{mockAuditData.blockchainStatus}</p>
              <p className="text-[10px] text-red-400 mt-0.5">{mockAuditData.blockchainNote}</p>
            </div>
          </div>
        </div>

        {/* Rekomendasi Multi-Agent AI */}
        <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h3 className="text-[15px] font-black text-[#064e3b]">Rekomendasi Multi-Agent AI</h3>
          </div>

          <ol className="space-y-3">
            {mockAuditData.rekomendasi.map((item, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-[#00945e]">
                  {idx + 1}.
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Visual Analysis Image */}
        <div className="relative rounded-xl overflow-hidden h-48 bg-gray-200 shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Analisis Visual" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-white" />
            <span className="text-[11px] font-bold text-white">Analisis Visual Terverifikasi</span>
          </div>
        </div>
      </div>
    );
  }

  // ── SAFE MODE (or default): Green Certificate ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-black leading-tight text-[#064e3b]">
          Sertifikat Hijau
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Bukti Transparansi On-Chain
        </p>
      </div>

      {/* QR Code Card */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        <div className="mx-auto w-48 h-48 rounded-2xl bg-emerald-50 border-[6px] border-[#00945e] flex items-center justify-center relative overflow-hidden">
          {/* Simulated QR pattern */}
          <div className="grid grid-cols-7 gap-[3px] p-3">
            {Array.from({ length: 49 }).map((_, i) => (
              <span
                key={i}
                className={`h-[6px] w-[6px] rounded-[1px] ${
                  [0,1,2,5,6,7,12,13,14,20,21,24,28,34,35,36,42,43,44,46,47,48].includes(i)
                    ? 'bg-[#00945e]'
                    : [3,10,17,31,38,45,25,26,32,33].includes(i)
                      ? 'bg-[#00945e]/40'
                      : 'bg-transparent'
                }`}
              />
            ))}
          </div>
          {/* Center logo overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg p-1.5 shadow-sm border border-emerald-200">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Info Card */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        {/* Komoditas */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">#Komoditas</p>
            <p className="mt-1 text-base font-black text-[#064e3b]">{mockCertData.komoditas}</p>
          </div>
          <span className="text-[10px] font-bold text-[#00945e] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Lolos Audit AI
          </span>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Lokasi & Suhu */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Lokasi Lahan</p>
            <p className="mt-1 text-sm font-bold text-[#064e3b]">{mockCertData.lokasiLahan}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Suhu Validasi</p>
            <p className="mt-1 text-sm font-bold text-[#064e3b]">{mockCertData.suhuValidasi}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">AI Weather Node</p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* eSkor Karbon & Blockchain */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">eSkor Karbon</p>
            <p className="mt-1 text-sm font-black text-[#064e3b]">
              {mockCertData.eSkorKarbon} <span className="text-[10px] font-normal text-gray-400">({mockCertData.eSkorKarbonHash})</span>
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-gray-500">Blockchain</p>
            <p className="text-[11px] font-black text-[#00945e]">Verified: YES</p>
            <p className="text-[9px] text-gray-400">({mockCertData.blockchainHash})</p>
          </div>
        </div>
      </div>

      {/* Polygon TX Hash */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Polygon TX Hash</p>
          <p className="text-xs font-mono font-bold text-[#064e3b] mt-0.5">{mockCertData.polygonTxHash}</p>
        </div>
        <button 
          onClick={handleCopyHash}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-100 transition-colors touch-manipulation"
          title="Salin Hash"
        >
          <Copy className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Sertifikat Lainnya Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-[#064e3b]">Sertifikat Lainnya</h3>
        {[
          { name: 'Kubis Dataran Tinggi', date: '25 Mei 2026' },
          { name: 'Wortel Organik', date: '18 Mei 2026' },
        ].map((cert) => (
          <button
            key={cert.name}
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left shadow-sm hover:border-emerald-300 transition-colors touch-manipulation group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                <ShieldCheck className="w-5 h-5 text-[#00945e]" />
              </div>
              <div>
                <span className="block text-sm font-bold text-[#064e3b]">{cert.name}</span>
                <span className="text-[11px] text-gray-400">{cert.date}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#00945e] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-950/35">{label}</p>
      <p className="mt-1 text-sm font-black text-[#064e3b]">{value}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full space-y-3 bg-[#F0FDF4] p-6 text-center pb-32">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-950/45">
        POWERED BY SECURE AGTECH STACK
      </p>

      <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-[11px] font-bold text-[#00945e]">
        <BadgeCheck size={15} />
        <span>100% Data Integrity Guaranteed</span>
      </div>

      <button
        type="button"
        className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-[#a7f3d0] px-6 py-2.5 font-bold text-[#00945e] shadow-sm transition-all"
      >
        <CloudOff size={16} />
        <span className="text-xs">SIMPAN DATA KARANTINA (OFFLINE)</span>
      </button>

      <p className="text-[9px] font-semibold text-emerald-950/40 pt-2">
        © 2026 TaniTinggi Ecosystem. All Rights Reserved.
      </p>
    </footer>
  );
}