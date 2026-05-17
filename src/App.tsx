import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { auth, loginWithGoogle } from './lib/firebase';
import { testFirestoreConnection } from './lib/testConnection';
import Navbar from './components/layout/Navbar';
import AttendanceTracker from './components/attendance/AttendanceTracker';
import ImamManager from './components/management/ImamManager';
import MonthlyReport from './components/reports/MonthlyReport';
import MonthlyRotationManager from './components/rotation/MonthlyRotationManager';
import { Button } from './components/ui/Common';
import logo from './assets/images/logo.jpg';
import loginBg from './assets/images/login-bg.png';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirestoreConnection();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-950 transition-colors relative overflow-hidden">
        {/* Subtle background glow for loading */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,78,59,0.4),rgba(2,15,12,1))]" />

        <div className="text-center space-y-6 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-emerald-500/20 rounded-full animate-pulse" />
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto relative z-10" />
          </div>
          <p className="text-emerald-500/80 font-serif tracking-[0.3em] uppercase text-xs animate-pulse">Memuatkan Sistem</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden selection:bg-gold-muted/30">
        {/* Cinematic Background Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] scale-110"
          style={{ backgroundImage: `url(${loginBg})` }}
        />

        {/* Atmospheric Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-950/70 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

        {/* Grain/Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-muted/5 blur-[120px] rounded-full animate-pulse duration-[5s]" />

        <div className="max-w-md w-full relative z-10">
          {/* Logo Section */}
          <div className="mb-12 text-center transform transition-all duration-1000 translate-y-0 opacity-100">
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-gold-bright/20 blur-2xl rounded-full scale-125 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative w-32 h-32 p-1 rounded-full bg-gradient-to-br from-gold-muted via-gold-bright/50 to-gold-muted shadow-2xl overflow-hidden backdrop-blur-sm">
                <div className="w-full h-full rounded-full border-2 border-ivory/20 overflow-hidden bg-emerald-950">
                  <img src={logo} alt="Surau Seri Dahlia Logo" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-10 space-y-3">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-gold-muted/50" />
              <span className="text-gold-bright/70 font-serif uppercase tracking-[0.4em] text-[10px] gold-glow">Sistem Pengurusan</span>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-gold-muted/50" />
            </div>
            <h1 className="text-5xl font-serif font-bold text-ivory tracking-tight drop-shadow-2xl">
              Kehadiran <span className="text-emerald-400 italic">Imam</span>
            </h1>
            <p className="text-ivory/60 font-serif text-sm tracking-wide">
              Surau Seri Dahlia, Bandar Seri Putra
            </p>
          </div>

          {/* Glass Card */}
          <div className="glass-panel rounded-[2rem] p-10 cinematic-shadow border-white/10 group">
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <p className="text-ivory/80 text-[15px] leading-relaxed font-light">
                  Selamat datang ke portal pentadbiran. Sila log masuk untuk mengurus rekod kehadiran imam.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={loginWithGoogle}
                  className="w-full relative group/btn overflow-hidden rounded-xl py-4 bg-gradient-to-r from-emerald-800 to-emerald-900 border border-emerald-500/30 shadow-lg transition-all duration-300 hover:shadow-emerald-500/20 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/10 to-emerald-400/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                  <div className="flex items-center justify-center space-x-3 relative z-10">
                    <LogIn className="w-5 h-5 text-emerald-200" />
                    <span className="text-white font-medium tracking-wide">Log Masuk dengan Google</span>
                  </div>
                </button>
              </div>

              <div className="pt-8 border-t border-white/5 flex flex-col items-center space-y-2">
                <p className="text-[10px] text-ivory/30 uppercase font-bold tracking-[0.3em]">
                  “Jadikan dirimu bagai pohon yang rendang di mana insan dapat berteduh.”
                </p>
                <div className="h-1 w-1 rounded-full bg-gold-muted/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-20 sm:pb-0 transition-colors">
        <Navbar user={user} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<AttendanceTracker />} />
            <Route path="/rotation" element={<MonthlyRotationManager />} />
            <Route path="/imams" element={<ImamManager />} />
            <Route path="/reports" element={<MonthlyReport />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Floating Mobile Nav for very quick access could go here */}
      </div>
    </BrowserRouter>
  );
}


