import { useState } from 'react';
import { Mail, Lock, User, Sprout, MapPin, ArrowRight, RefreshCw, Leaf } from 'lucide-react';
import {
  login,
  register,
  ApiError,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  type FarmerProfile,
} from '../lib/api';

type Mode = 'login' | 'register';
type Role = 'FARMER' | 'BUYER';

const inputClass =
  'w-full pl-10 pr-3 py-2.5 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white';

export default function AuthScreen({ onSuccess }: { onSuccess: (profile: FarmerProfile) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('FARMER');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  function validate(): string | null {
    if (!email.trim()) return 'Email wajib diisi.';
    if (!password) return 'Kata sandi wajib diisi.';
    if (isRegister) {
      if (password.length < 8) return 'Kata sandi minimal 8 karakter.';
      if (!/[A-Z]/.test(password)) return 'Kata sandi harus memuat 1 huruf besar.';
      if (!/[0-9]/.test(password)) return 'Kata sandi harus memuat 1 angka.';
      if (role === 'FARMER') {
        if (!fullName.trim()) return 'Nama lengkap wajib diisi.';
        if (!farmName.trim()) return 'Nama kebun wajib diisi.';
        if (!farmLocation.trim()) return 'Lokasi kebun wajib diisi.';
      }
    }
    return null;
  }

  async function handleSubmit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const profile = isRegister
        ? await register({
            email: email.trim(),
            password,
            role,
            fullName: fullName.trim() || undefined,
            farmName: farmName.trim() || undefined,
            farmLocation: farmLocation.trim() || undefined,
          })
        : await login(email.trim(), password);
      onSuccess(profile);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memproses. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  function prefillDemo() {
    setMode('login');
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-7">
          <img src="/logo.png" alt="Tani Tinggi" className="h-14 w-auto object-contain mb-3" />
          <h1 className="text-2xl font-black text-[#064e3b]">Tani Tinggi</h1>
          <p className="text-[12px] italic text-[#2bb27b] mt-1">Validasi Pintar, Transparansi Akar.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-emerald-50 rounded-xl p-1 mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
                className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                  mode === m ? 'bg-[#00945e] text-white shadow-sm' : 'text-[#00945e]'
                }`}
              >
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Role selector (register only) */}
            {isRegister && (
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Daftar sebagai</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'FARMER', label: 'Petani', icon: Sprout },
                      { value: 'BUYER', label: 'Pembeli', icon: User },
                    ] as { value: Role; label: string; icon: typeof Sprout }[]
                  ).map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                          role === r.value
                            ? 'bg-emerald-50 border-[#00945e] text-[#00945e]'
                            : 'bg-white border-gray-200 text-gray-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Min. 8 karakter, 1 huruf besar, 1 angka' : '••••••••'}
                  className={inputClass}
                  onKeyDown={(e) => e.key === 'Enter' && !isRegister && handleSubmit()}
                />
              </div>
            </div>

            {/* Farmer detail (register + FARMER) */}
            {isRegister && role === 'FARMER' && (
              <>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Misal: Budi Santoso"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Nama Kebun</label>
                  <div className="relative">
                    <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="Misal: Kebun Sayur Dieng"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Lokasi Kebun</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      placeholder="Misal: Dieng, Wonosobo, Jawa Tengah"
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#00945e] hover:bg-emerald-700 disabled:opacity-70 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {isRegister ? 'Daftar & Masuk' : 'Masuk'} <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Demo helper */}
        <button
          type="button"
          onClick={prefillDemo}
          className="mt-4 w-full text-center text-[11px] font-semibold text-emerald-700 hover:underline"
        >
          Gunakan akun petani demo (seed)
        </button>
      </div>
    </div>
  );
}
