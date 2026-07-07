# Tani Tinggi

TaniTinggi adalah platform sertifikasi sayuran dataran tinggi berbasis AI (Kecerdasan Buatan) + Web3 (Blockchain). Aplikasi ini dirancang khusus untuk membantu petani hortikultura di daerah terpencil (yang rentan blank spot sinyal internet) melakukan audit keaslian produk secara lokal, merekam jejak emisi karbon logistik pengiriman secara otomatis, dan menerbitkan sertifikat QR-Code anti-tamper (anti-pemalsuan) yang diamankan ke Polygon Blockchain untuk divalidasi secara langsung oleh konsumen ritel modern di kota besar.

## Struktur Repo

```
Tani-tinggi/
├── frontend/   # React + Vite (Web App untuk Petani & Konsumen)
└── backend/    # Fastify + TypeScript + Prisma + BullMQ (REST API)
```

## Cara Menjalankan

### Backend
```bash
cd backend
npm install
cp .env.example .env   # isi kredensial
npx prisma migrate dev
setup-infra.bat # Buka di filemanager
run-all.bat # buka di file manager
npm run dev
```
```
untuk stopnya:
stop-all.bat
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Backend**: Fastify, TypeScript, Prisma, PostgreSQL, Redis, BullMQ
- **AI**: TensorFlow.js (MobileNetV2)
- **Blockchain**: Ethers.js, Polygon Amoy
- **Storage**: Cloudinary
