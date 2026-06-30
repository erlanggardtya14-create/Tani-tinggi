# 📋 INSTRUKSI FRONTEND — Tani Tinggi Web App

> **Terakhir diperbarui:** 29 Juni 2026  
> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons  
> **Target:** Mobile-First Web App (responsive)

---

## 📁 Struktur Direktori

```
frontend/
├── public/                          # Aset statis (langsung diakses via URL)
│   ├── favicon.svg                  # Ikon tab browser
│   ├── homecomponen.png             # Gambar hero di halaman Home
│   ├── icons.svg                    # Sprite ikon SVG kustom
│   └── logo.png                     # Logo Tani Tinggi (dipakai di header & QR)
│
├── src/
│   ├── main.tsx                     # Entry point React (mount ke #root)
│   ├── App.tsx                      # Root component, render <TaniTinggiApp />
│   ├── App.css                      # Style bawaan Vite (bisa diabaikan)
│   ├── index.css                    # Global CSS: Tailwind import + animasi kustom
│   │
│   ├── component/
│   │   ├── TaniTinggiApp.tsx        # ⭐ KOMPONEN UTAMA (layout, navigasi, halaman)
│   │   └── TaniAi.tsx              # ⭐ Halaman Scan AI (kamera, upload, hasil scan)
│   │
│   └── assets/                      # Aset yang di-import langsung di kode
│
├── index.html                       # HTML template utama
├── package.json                     # Dependencies & scripts
├── vite.config.ts                   # Konfigurasi Vite bundler
├── tsconfig.json                    # TypeScript config root
├── tsconfig.app.json                # TypeScript config untuk source app
├── tsconfig.node.json               # TypeScript config untuk tooling (Vite, dll)
├── eslint.config.js                 # Konfigurasi linter
└── INSTRUKSI.md                     # 📄 File ini
```

---

## 🧩 Deskripsi File Utama

### `src/main.tsx`
Entry point aplikasi. Mount `<App />` ke elemen `#root` di `index.html`.

### `src/App.tsx`
Root component. Hanya merender `<TaniTinggiApp />` dari folder `component/`.

### `src/index.css`
- Import Tailwind CSS v4 (`@import "tailwindcss"`)
- Animasi kustom: `pageTransition` (transisi antar tab) dan `fade-in`
- Class `.animate-page-tab` untuk transisi halus saat berpindah halaman

---

## ⭐ Komponen Inti

### `src/component/TaniTinggiApp.tsx`
**File utama yang mengatur seluruh aplikasi.** Berisi:

| Komponen Internal     | Deskripsi |
|-----------------------|-----------|
| `TaniTinggiApp`       | Root app: state management (`activeTab`, `certMode`) |
| `MobileLayout`        | Layout mobile: header, main content, bottom nav |
| `HeroFarm`            | Banner hero dengan gambar `homecomponen.png` |
| `MobileHomeCopy`      | Copy teks marketing di halaman Home |
| `StepsList`           | 3 langkah cara kerja aplikasi |
| `PrimaryCta`          | Tombol CTA "Mulai Validasi" |
| `CertificatePanel`    | ⭐ Halaman Sertifikat (2 mode: safe & unsafe) |
| `BottomNav`           | Navigasi bawah (Home / TaNi AI / Certificate) |
| `Footer`              | Footer dengan branding |

#### State Penting:
```typescript
// Tab aktif (home | tani-ai | certificate)
const [activeTab, setActiveTab] = useState<ActiveTab>('home');

// Hasil scan terakhir — mengontrol tampilan CertificatePanel
// 'safe' = Sertifikat Hijau, 'unsafe' = Hasil Audit Merah, null = default
const [certMode, setCertMode] = useState<CertResultMode>(null);
```

#### Exported Type:
```typescript
export type CertResultMode = 'safe' | 'unsafe' | null;
```

---

### `src/component/TaniAi.tsx`
**Halaman pemindaian AI.** Berisi:

| Fitur                        | Deskripsi |
|------------------------------|-----------|
| Kamera / Upload Foto         | User ambil foto atau drag-and-drop gambar tanaman |
| Form Input Data              | Input komoditas, lokasi, pupuk, jalur distribusi, ketinggian |
| Status Info Cards            | AI Weather Node, AI Detection Active |
| Tombol "MULAI PINDAI DATA"  | Trigger proses scan (loading → hasil) |
| Modal Overlay Hasil          | Pop-up "Tanaman Aman" (hijau) atau "Tidak Aman" (merah) |
| Tombol Navigasi Hasil        | "Lihat Sertifikasi" → certificate/safe, "Lihat kenapa" → certificate/unsafe |
| Mock Toggle                  | Switch untuk simulasi hasil (HAPUS saat backend siap) |

#### State Penting:
```typescript
type ScanStatus = 'idle' | 'scanning' | 'safe' | 'unsafe';

const [plantImage, setPlantImage] = useState<string | null>(null);  // Foto tanaman
const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');    // Status proses scan
const [mockResultType, setMockResultType] = useState<'safe' | 'unsafe'>('safe'); // Mock toggle
```

#### Props:
```typescript
// onNavigate(tab, mode?) — navigasi ke tab lain dengan mode opsional
{ onNavigate?: (tab: string, mode?: 'safe' | 'unsafe') => void }
```

---

## 🔄 Alur Navigasi & Data

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│   Home      │ ──► │   TaNi AI    │ ──► │   Certificate       │
│   (home)    │     │   (tani-ai)  │     │   (certificate)     │
└─────────────┘     └──────────────┘     └─────────────────────┘
                          │                        │
                          │ scan aman              │ mode='safe'
                          │ ──────────────────────►│ → Sertifikat Hijau
                          │                        │   (QR Code + data)
                          │ scan tidak aman        │
                          │ ──────────────────────►│ mode='unsafe'
                          │                        │ → Hasil Audit Lahan
                          │                        │   (alert merah + rekomendasi)
```

---

## 🔌 Panduan Integrasi Backend

### 1. Scan AI (`TaniAi.tsx`)

**Ganti mock setTimeout dengan API call:**

```typescript
// ❌ SEBELUM (mock)
setTimeout(() => {
  setScanStatus(mockResultType);
}, 2000);

// ✅ SESUDAH (backend)
const formData = new FormData();
formData.append('image', plantImageFile);
formData.append('komoditas', komoditasValue);
formData.append('lokasi', lokasiValue);
// ... field lainnya

const response = await fetch('/api/scan', {
  method: 'POST',
  body: formData,
});
const result = await response.json();

// result.status harus berupa 'safe' atau 'unsafe'
setScanStatus(result.status);
```

**Hapus komponen Mock Toggle** (baris 251–278 di `TaniAi.tsx`) setelah backend siap.

---

### 2. Sertifikat Hijau (`CertificatePanel` mode='safe')

**Ganti `mockCertData` dengan data API:**

```typescript
// ❌ SEBELUM (mock)
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

// ✅ SESUDAH (backend)
// GET /api/certificate/:scanId
const certData = await fetch(`/api/certificate/${scanId}`).then(r => r.json());
```

**QR Code:** Menggunakan library `qrcode.react`. Backend cukup kirim string (hash/URL), frontend otomatis generate QR code asli.

```tsx
<QRCodeSVG
  value={certData.polygonTxHash}   // ← String dari backend
  size={160}
  fgColor="#00945e"
  level="M"
/>
```

---

### 3. Hasil Audit Lahan (`CertificatePanel` mode='unsafe')

**Ganti `mockAuditData` dengan data API:**

```typescript
// ❌ SEBELUM (mock)
const mockAuditData = {
  komoditas: 'Selada Mountain',
  statusAi: 'GAGAL VALIDASI',
  errorDiag: 'Kesalahan/Error Diag. 31%',
  blockchainStatus: 'REJECTED',
  blockchainNote: 'TIDAK DIREKAM',
  rekomendasi: [
    'Isolasi tanaman di Petak 4B...',
    'Berikan pupuk organik cair...',
    'Lakukan pemindaian ulang...',
  ],
};

// ✅ SESUDAH (backend)
// GET /api/audit/:scanId
const auditData = await fetch(`/api/audit/${scanId}`).then(r => r.json());
```

---

## 📦 Dependencies

| Package            | Versi     | Fungsi |
|--------------------|-----------|--------|
| `react`            | ^19.2.6   | UI library |
| `react-dom`        | ^19.2.6   | DOM renderer |
| `tailwindcss`      | ^4.3.1    | Utility CSS framework |
| `@tailwindcss/vite` | ^4.3.1   | Plugin Vite untuk Tailwind |
| `lucide-react`     | ^1.20.0   | Icon library |
| `qrcode.react`     | latest    | Generate QR code dari string |

### Dev Dependencies
| Package                     | Fungsi |
|-----------------------------|--------|
| `vite`                      | Bundler & dev server |
| `typescript`                | Type checking |
| `@vitejs/plugin-react`      | React plugin untuk Vite |
| `eslint` + plugins          | Code linting |

---

## 🚀 Cara Menjalankan

```bash
# Install dependencies
npm install

# Jalankan dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

---

## ⚠️ Catatan Penting

1. **Mobile-First:** Desain utama untuk tampilan mobile. Tidak ada layout desktop terpisah saat ini.
2. **Animasi:** Transisi antar halaman menggunakan CSS animation `animate-page-tab` (GPU-accelerated).
3. **QR Code:** Menggunakan `qrcode.react` (library `QRCodeSVG`). Backend hanya perlu mengirim string, frontend auto-render.
4. **Logo:** File `public/logo.png` — ganti sesuai kebutuhan. Dipakai di header dan tengah QR code.
5. **Mock Toggle:** Ada switcher di halaman Scan untuk simulasi hasil AI. **HAPUS setelah backend terintegrasi.**
6. **State Management:** Tidak menggunakan state manager eksternal (Redux/Zustand). Semua state di-lift ke `TaniTinggiApp`.
