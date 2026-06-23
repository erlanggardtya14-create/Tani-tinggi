import { useState, type ReactNode } from 'react';
import { Award, CloudOff, Home, Leaf, Scan } from 'lucide-react';
import TaniAi from './TaniAi';

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
      'Begitu mendapat sinyal internet, laporannya otomatis terenkripsi dan masuk ke jaringan Web3 menjadi Sertifikat Hijau.',
  },
];

const navItems: Array<{
  id: ActiveTab;
  label: string;
  icon: typeof Home;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tani-ai', label: 'TaNi AI', icon: Scan },
  { id: 'certificate', label: 'Certificate', icon: Award },
];

export default function TaniTinggiApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  if (activeTab === 'tani-ai') {
    return <TaniAi onNavigate={(tab) => setActiveTab(tab as ActiveTab)} />;
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-[#064e3b] antialiased"
      style={{ fontFamily: 'Montserrat, ui-sans-serif, system-ui, sans-serif' }}
    >
      <DesktopLayout activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileLayout activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function DesktopLayout({
  activeTab,
  setActiveTab,
}: {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}) {
  return (
    <div className="hidden min-h-screen flex-col md:flex">
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/95 px-8 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 text-left"
            aria-label="TaniTinggi home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-100 bg-[#F0FDF4] text-[#00945e]">
              <Leaf size={22} />
            </span>
            <span className="text-2xl font-black tracking-tight text-[#064e3b]">TaniTinggi</span>
          </button>

          <nav className="flex items-center rounded-full border border-emerald-100 bg-[#F0FDF4] p-1">
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </nav>

          <p className="max-w-[14rem] text-right text-sm font-bold leading-tight text-[#00945e]">
            Validasi Pintar, Transparansi Akar.
          </p>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-8 py-12">
          <section className="flex min-h-[620px] items-center justify-center rounded-[2rem] bg-[#F0FDF4] p-8">
            <HeroFarm />
          </section>

          <section className="flex min-h-[620px] flex-col justify-center">
            {activeTab === 'home' && <HomePanel setActiveTab={setActiveTab} />}
            {activeTab === 'certificate' && <CertificatePanel />}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MobileLayout({
  activeTab,
  setActiveTab,
}: {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}) {
  return (
    <div className="block min-h-screen bg-slate-50 pb-24 md:hidden">
      <header className="bg-white px-5 py-4 text-center shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="mx-auto mb-1 flex items-center justify-center gap-2 text-[#00945e]"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-emerald-100 bg-[#F0FDF4]">
            <Leaf size={16} />
          </span>
          <span className="text-lg font-black text-[#064e3b]">TaniTinggi</span>
        </button>
        <p className="text-sm font-bold leading-tight text-[#00945e]">
          Validasi Pintar,
          <br />
          Transparansi Akar.
        </p>
      </header>

      <main className="px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          {activeTab === 'home' && (
            <>
              <HeroFarm compact />
              <MobileHomeCopy />
              <StepsList />
              <PrimaryCta onClick={() => setActiveTab('tani-ai')} />
            </>
          )}

          {activeTab === 'certificate' && <CertificatePanel />}
        </div>
      </main>

      <Footer />
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
      className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-emerald-100 bg-white px-5 shadow-[0_-8px_24px_rgba(6,78,59,0.08)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isCenter = item.id === 'tani-ai';

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={
              isCenter
                ? `relative -top-5 flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 border-white bg-[#00945e] text-white shadow-lg transition-transform ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`
                : `flex min-w-[4rem] flex-col items-center gap-1 text-[11px] font-bold transition-colors ${
                    isActive ? 'text-[#00945e]' : 'text-emerald-900/55'
                  }`
            }
            aria-label={item.label}
          >
            <Icon size={isCenter ? 24 : 20} strokeWidth={isActive ? 2.8 : 2.2} />
            {!isCenter && <span>{item.label}</span>}
            {isCenter && <span className="mt-1 text-[9px] font-black leading-none">TaNi AI</span>}
          </button>
        );
      })}
    </nav>
  );
}

function HeroFarm({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`w-full rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm ${
        compact ? 'mx-auto max-w-sm' : 'max-w-lg'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-[#F0FDF4] to-emerald-50">
        <div className="absolute left-1/2 top-[50%] h-40 w-56 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-2xl border border-emerald-100 bg-white shadow-xl" />
        <div className="absolute left-[25%] top-[49%] h-20 w-28 rotate-45 rounded-lg bg-emerald-100" />
        <div className="absolute left-[47%] top-[42%] h-24 w-32 rotate-45 rounded-lg bg-teal-100" />
        <div className="absolute left-[35%] top-[60%] h-16 w-36 rotate-45 rounded-lg bg-lime-100" />
        <div className="absolute left-[32%] top-[23%] h-16 w-10 skew-x-[-18deg] bg-slate-200" />
        <div className="absolute left-[42%] top-[17%] h-24 w-12 skew-x-[-18deg] bg-slate-300" />
        <div className="absolute left-[51%] top-[27%] h-16 w-10 skew-x-[-18deg] bg-slate-200" />
        <div className="absolute left-[30%] top-[59%] h-16 w-px rotate-45 bg-emerald-200" />
        <div className="absolute left-[45%] top-[64%] h-20 w-px rotate-45 bg-emerald-200" />
        <div className="absolute left-[58%] top-[55%] grid h-12 w-12 place-items-center rounded-full border border-[#00945e]/20 bg-white/80 text-[#00945e] shadow-sm">
          <Leaf size={22} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <StatusBadge>AI VALIDATED</StatusBadge>
        <StatusBadge>OFFLINE READY</StatusBadge>
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
    <section className="space-y-5 text-center">
      <div>
        <h1 className="mx-auto max-w-xs text-2xl font-black leading-tight text-[#064e3b]">
          Tinggikan Nilai Hasil Tanammu
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-emerald-950/70">
          Validasi otomatis foto sayuran dan kualitas lingkungan lahannya dengan AI untuk langsung
          terhubung ke Supermarket Kota.
        </p>
      </div>

      <h2 className="mx-auto max-w-xs text-xl font-black leading-tight text-[#064e3b]">
        3 Langkah Mudah Lapor Tanam
      </h2>
    </section>
  );
}

function StepsList() {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <article
          key={step.title}
          className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00945e] text-sm font-black text-white">
            {index + 1}
          </div>
          <div>
            <h3 className="font-black text-[#064e3b]">{step.title}</h3>
            <p className="mt-1 text-sm leading-6 text-emerald-950/65">{step.description}</p>
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
      className="w-full rounded-xl bg-[#00945e] py-3.5 font-bold uppercase text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
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

function CertificatePanel() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black leading-tight text-[#064e3b] md:text-5xl">
          Sertifikat Hijau
        </h1>
        <p className="mt-2 text-base font-semibold text-emerald-950/60">
          Bukti Transparansi On-Chain
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="mx-auto grid aspect-square max-w-xs place-items-center rounded-2xl border-[12px] border-[#00945e] bg-slate-50">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }).map((_, index) => (
              <span
                key={index}
                className={`h-7 w-7 ${[1, 2, 4, 5, 8, 11, 12, 14, 15].includes(index) ? 'bg-black' : 'bg-transparent'}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 rounded-xl border border-emerald-100 bg-[#F0FDF4] p-4 sm:grid-cols-2">
          <DataPoint label="Komoditas" value="Selada Mountain" />
          <DataPoint label="Lokasi Lahan" value="Petak 4B, Lereng Utara" />
          <DataPoint label="Suhu Validasi" value="17C" />
          <DataPoint label="GeoAI Karbon" value="Rendah" />
        </div>
      </div>

      <div className="space-y-3">
        {['Kubis Dataran Tinggi', 'Wortel Organik'].map((name, index) => (
          <button
            key={name}
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-emerald-100 bg-white p-4 text-left shadow-sm"
          >
            <span>
              <span className="block font-black text-[#064e3b]">{name}</span>
              <span className="text-sm text-emerald-950/55">{index === 0 ? '25 Mei 2026' : '18 Mei 2026'}</span>
            </span>
            <Award className="text-[#00945e]" size={22} />
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
    <footer className="w-full space-y-3 bg-[#F0FDF4] p-6 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-950/45">
        POWERED BY SECURE AGTECH STACK
      </p>

      <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-[#00945e]">
        <Leaf size={15} />
        <span>100% Data Integrity Guaranteed</span>
      </div>

      <button
        type="button"
        className="mx-auto flex items-center justify-center gap-2 rounded-full bg-[#00945e] px-6 py-2 font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
      >
        <CloudOff size={17} />
        <span>SIMPAN DATA KARANTINA (OFFLINE)</span>
      </button>

      <p className="text-[10px] font-semibold text-emerald-950/40">
        Â© 2026 TaniTinggi Ecosystem. All Rights Reserved.
      </p>
    </footer>
  );
}