import { useState, useEffect } from 'react';
import { CloudOff, Home, Scan, BadgeCheck, ShieldCheck, AlertTriangle, Copy, ChevronRight, Image as ImageIcon, RefreshCw, LogOut } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import TaniAi from './TaniAi';
import AuthScreen from './AuthScreen';
import {
  getRecord,
  getProfile,
  listCertified,
  logout,
  isAuthenticated,
  setUnauthorizedHandler,
  ApiError,
  type FarmRecord,
  type FarmerProfile,
} from '../lib/api';

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


export default function TaniTinggiApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // certMode = hasil scan terakhir; certRecordId = id record backend untuk fetch detail.
  const [certMode, setCertMode] = useState<CertResultMode>(null);
  const [certRecordId, setCertRecordId] = useState<string | null>(null);

  // Auth: profil petani aktif (null = belum login). authChecked = sesi awal sudah dicek.
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Cek sesi tersimpan saat load + pasang handler 401 (token kedaluwarsa → logout).
  useEffect(() => {
    setUnauthorizedHandler(() => setProfile(null));
    if (isAuthenticated()) {
      getProfile()
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
    return () => setUnauthorizedHandler(null);
  }, []);

  const handleNavigateWithResult = (tab: string, mode?: 'safe' | 'unsafe', recordId?: string) => {
    if (mode) setCertMode(mode);
    if (recordId !== undefined) setCertRecordId(recordId);
    setActiveTab(tab as ActiveTab);
  };

  const handleLogout = async () => {
    await logout();
    setProfile(null);
    setActiveTab('home');
    setCertMode(null);
    setCertRecordId(null);
  };

  const shell = 'min-h-screen bg-slate-50 text-[#064e3b] antialiased';
  const shellStyle = { fontFamily: 'Montserrat, ui-sans-serif, system-ui, sans-serif' };

  // Tunggu pengecekan sesi awal selesai agar tidak "berkedip" ke layar login.
  if (!authChecked) {
    return (
      <div className={`${shell} flex items-center justify-center`} style={shellStyle}>
        <RefreshCw className="w-7 h-7 text-[#00945e] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={shell} style={shellStyle}>
        <AuthScreen onSuccess={setProfile} />
      </div>
    );
  }

  return (
    <div className={shell} style={shellStyle}>
      <MobileLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        certMode={certMode}
        certRecordId={certRecordId}
        profile={profile}
        onLogout={handleLogout}
        onNavigateWithResult={handleNavigateWithResult}
      />
    </div>
  );
}

function MobileLayout({
  activeTab,
  setActiveTab,
  certMode,
  certRecordId,
  profile,
  onLogout,
  onNavigateWithResult,
}: {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  certMode: CertResultMode;
  certRecordId: string | null;
  profile: FarmerProfile;
  onLogout: () => void;
  onNavigateWithResult: (tab: string, mode?: 'safe' | 'unsafe', recordId?: string) => void;
}) {
  const displayName = profile.farmer?.fullName ?? profile.email;

  return (
    <div className="block min-h-screen bg-slate-50 relative">
      <header className="flex items-center gap-3 bg-white px-5 py-3 border-b border-gray-200 sticky top-0 z-30">
        <img src="/logo.png" alt="Tani Tinggi Logo" className="h-10 w-auto object-contain shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-[13px] italic font-semibold text-[#2bb27b] leading-tight truncate">
            Validasi Pintar, Transparansi Akar.
          </h2>
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
            Halo, <span className="font-semibold text-[#064e3b]">{displayName}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Keluar"
          className="shrink-0 flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar
        </button>
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
            <TaniAi onNavigate={(tab, mode, recordId) => onNavigateWithResult(tab, mode, recordId)} />
          )}

          {activeTab === 'certificate' && <CertificatePanel mode={certMode} recordId={certRecordId} />}
        </div>
      </main>

      {(activeTab === 'home' || activeTab === 'tani-ai') && <Footer />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
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

// ============================================================
// CERTIFICATE PANEL — data nyata dari backend
// ============================================================
// mode='safe'   → record CERTIFIED  → Sertifikat Hijau
// mode='unsafe' → record AI_REJECTED/FAILED → Hasil Audit Lahan
// recordId null → tampilkan sertifikat terbaru petani (fallback)
// ============================================================

function shortHash(v?: string | null): string {
  if (!v) return '—';
  return v.length > 16 ? `${v.slice(0, 8)}...${v.slice(-6)}` : v;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
}

function CertificatePanel({ mode, recordId }: { mode: CertResultMode; recordId: string | null }) {
  const [record, setRecord] = useState<FarmRecord | null>(null);
  const [others, setOthers] = useState<FarmRecord[]>([]);
  const [farmLocation, setFarmLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');

    (async () => {
      try {
        getProfile()
          .then((p) => alive && setFarmLocation(p.farmer?.farmLocation ?? ''))
          .catch(() => {});

        let current: FarmRecord | null = recordId ? await getRecord(recordId) : null;
        const list = await listCertified(10);
        if (!alive) return;

        // Fallback bila belum scan: pakai sertifikat terbaru.
        if (!current) current = list.data[0] ?? null;

        setRecord(current);
        setOthers(list.data.filter((r) => r.id !== current?.id));
      } catch (err) {
        if (alive) setError(err instanceof ApiError ? err.message : 'Gagal memuat data sertifikat.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [recordId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <RefreshCw className="w-7 h-7 text-[#00945e] animate-spin" />
        <p className="mt-3 text-sm text-gray-500">Memuat data sertifikat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
        <AlertTriangle className="w-7 h-7 text-red-500 mx-auto" />
        <p className="mt-2 text-sm font-bold text-red-700">{error}</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center">
        <BadgeCheck className="w-8 h-8 text-gray-300 mx-auto" />
        <p className="mt-3 text-sm font-bold text-[#064e3b]">Belum ada sertifikat</p>
        <p className="mt-1 text-xs text-gray-500">
          Pindai tanamanmu di menu TaNi AI untuk menerbitkan sertifikat hijau.
        </p>
      </div>
    );
  }

  // Tampilkan audit bila diminta unsafe ATAU record belum CERTIFIED.
  const isUnsafe = mode === 'unsafe' || record.status !== 'CERTIFIED';

  return isUnsafe ? (
    <AuditView record={record} />
  ) : (
    <GreenCertificateView record={record} others={others} farmLocation={farmLocation} />
  );
}

function AuditView({ record }: { record: FarmRecord }) {
  const ai = record.aiValidation;
  const statusAi = record.status === 'AI_REJECTED' ? 'GAGAL VALIDASI AI' : 'GAGAL PROSES';
  const errorDiag = ai
    ? `Keyakinan AI ${(ai.confidence * 100).toFixed(0)}% — terdeteksi: ${ai.detectedClass ?? 'tidak dikenali'}`
    : record.certificate?.errorMessage ?? 'Tidak memenuhi kriteria sertifikasi.';

  const rekomendasi: string[] = [];
  if (record.pesticidesUsed)
    rekomendasi.push('Kurangi atau hentikan pestisida kimia, ganti dengan pengendalian hama alami.');
  if (record.fertilizerType.startsWith('CHEMICAL'))
    rekomendasi.push('Beralih ke pupuk organik (kompos/kandang) untuk menurunkan jejak karbon.');
  if (record.carbonScore && record.carbonScore.ecoGrade >= 'D')
    rekomendasi.push('Pilih moda transport lebih efisien atau pasar tujuan lebih dekat untuk menekan emisi.');
  rekomendasi.push('Ambil ulang foto tanaman dengan pencahayaan jelas, lalu pindai kembali.');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-black leading-tight text-[#064e3b]">Hasil Audit Lahan</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">Komoditas Belum Tersertifikasi</p>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <span className="text-sm font-bold text-red-700">VALIDASI TIDAK LOLOS</span>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Komoditas</p>
          <p className="mt-1 text-lg font-black text-[#064e3b]">{record.vegetableType}</p>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Status AI</p>
            <p className="mt-1 text-sm font-black text-red-600">{statusAi}</p>
            <p className="text-[10px] text-red-400 mt-0.5">{errorDiag}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Eco-Score</p>
            <p className="mt-1 text-sm font-black text-red-600">
              {record.carbonScore ? `Grade ${record.carbonScore.ecoGrade}` : 'TIDAK DIHITUNG'}
            </p>
            <p className="text-[10px] text-red-400 mt-0.5">
              {record.carbonScore ? `${record.carbonScore.ecoScore}/100` : 'Blockchain: TIDAK DIREKAM'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <h3 className="text-[15px] font-black text-[#064e3b]">Rekomendasi AI</h3>
        </div>
        <ol className="space-y-3">
          {rekomendasi.map((item, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-[#00945e]">
                {idx + 1}.
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative rounded-xl overflow-hidden h-48 bg-gray-200 shadow-sm">
        <img
          src={
            record.imageUrl ||
            'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
          }
          alt="Analisis Visual"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-white" />
          <span className="text-[11px] font-bold text-white">Foto yang Dianalisis AI</span>
        </div>
      </div>
    </div>
  );
}

function GreenCertificateView({
  record,
  others,
  farmLocation,
}: {
  record: FarmRecord;
  others: FarmRecord[];
  farmLocation: string;
}) {
  const cert = record.certificate;
  const carbon = record.carbonScore;
  const qrValue = cert?.qrCodeData || cert?.txHash || record.id;
  const txHash = cert?.txHash ?? '';

  const handleCopyHash = () => {
    if (txHash) navigator.clipboard?.writeText(txHash);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-black leading-tight text-[#064e3b]">Sertifikat Hijau</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">Bukti Transparansi On-Chain</p>
      </div>

      {/* QR Code */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
        <div className="mx-auto w-52 h-52 rounded-2xl bg-emerald-50 border-[6px] border-[#00945e] flex items-center justify-center relative overflow-hidden p-3">
          <QRCodeSVG value={qrValue} size={160} bgColor="transparent" fgColor="#00945e" level="M" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg p-1.5 shadow-sm border border-emerald-200">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
          </div>
        </div>
        {cert?.qrCodeUrl && (
          <p className="mt-3 text-center text-[10px] text-gray-400">QR tersimpan di penyimpanan cloud</p>
        )}
      </div>

      {/* Data */}
      <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">#Komoditas</p>
            <p className="mt-1 text-base font-black text-[#064e3b]">
              {record.vegetableType}{' '}
              <span className="text-xs font-normal text-gray-400">({record.vegetableWeight} kg)</span>
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#00945e] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Lolos Audit AI
          </span>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Lokasi Lahan</p>
            <p className="mt-1 text-sm font-bold text-[#064e3b]">{farmLocation || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Tujuan Kirim</p>
            <p className="mt-1 text-sm font-bold text-[#064e3b]">
              {record.deliveryInfo?.destinationCity ?? '—'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {record.deliveryInfo ? `${record.deliveryInfo.distanceKm} km` : ''}
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">eSkor Karbon</p>
            <p className="mt-1 text-sm font-black text-[#064e3b]">
              {carbon ? `Grade ${carbon.ecoGrade} · ${carbon.ecoScore}/100` : '—'}{' '}
              {carbon && (
                <span className="text-[10px] font-normal text-gray-400">
                  ({carbon.totalCarbonKg.toFixed(2)} kg CO₂e)
                </span>
              )}
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center">
            <p className="text-[9px] font-bold text-gray-500">Blockchain</p>
            <p className="text-[11px] font-black text-[#00945e]">
              {cert?.status === 'MINTED' ? 'Verified: YES' : cert?.status ?? '—'}
            </p>
            <p className="text-[9px] text-gray-400">Token #{cert?.tokenId ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* TX Hash */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Polygon TX Hash</p>
          <p className="text-xs font-mono font-bold text-[#064e3b] mt-0.5 truncate">{shortHash(txHash)}</p>
        </div>
        <button
          onClick={handleCopyHash}
          disabled={!txHash}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-100 disabled:opacity-40 transition-colors touch-manipulation"
          title="Salin Hash"
        >
          <Copy className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Sertifikat Lainnya */}
      {others.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-black text-[#064e3b]">Sertifikat Lainnya</h3>
          {others.map((c) => (
            <div
              key={c.id}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                  <ShieldCheck className="w-5 h-5 text-[#00945e]" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-[#064e3b]">{c.vegetableType}</span>
                  <span className="text-[11px] text-gray-400">
                    {formatDate(c.certificate?.issuedAt ?? c.createdAt)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          ))}
        </div>
      )}
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