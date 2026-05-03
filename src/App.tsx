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
import { Button } from './components/ui/Common';
import logo from './assets/images/mosque_logo_1777792398407.png';

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
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-slate-950 transition-colors">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
          <p className="text-emerald-900 dark:text-emerald-500 font-bold tracking-widest uppercase text-xs">Memuatkan Sistem...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full space-y-8 text-center">
            <div className="inline-block p-2 bg-white rounded-full shadow-2xl shadow-emerald-200/50 mb-4 overflow-hidden w-28 h-28 border-4 border-white">
                <img src={logo} alt="Surau Seri Dahlia Logo" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-emerald-950 dark:text-emerald-500 tracking-tight">Kehadiran Imam</h1>
                <p className="text-emerald-800/70 dark:text-emerald-400/60 font-bold whitespace-pre-line uppercase tracking-widest text-xs">Surau Seri Dahlia{"\n"}Bandar Seri Putra</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-200/50 dark:shadow-none space-y-6 border border-white dark:border-slate-800 transition-colors">
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Sila log masuk dengan akaun pentadbir untuk mengurus senarai imam dan merekod kehadiran solat berjemaah.</p>
                <Button size="lg" className="w-full shadow-xl shadow-emerald-200 dark:shadow-none" onClick={loginWithGoogle}>
                    <LogIn className="w-5 h-5 mr-3" />
                    Log Masuk dengan Google
                </Button>
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase font-black tracking-widest">Sistem Pengurusan Surau v1.0</p>
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
