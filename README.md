# 🌿 Tani Tinggi

Platform sertifikasi sayuran dataran tinggi berbasis **AI + Blockchain** — Canggih tapi Membumi.

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
