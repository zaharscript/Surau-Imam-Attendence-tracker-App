import { User } from 'firebase/auth';
import { LogIn, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginWithGoogle, logout } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

import logo from '../../assets/images/logo.jpg';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const navItems = [
    { name: 'Utama', path: '/' },
    { name: 'Jadual Bulanan', path: '/rotation' },
    { name: 'Senarai Imam', path: '/imams' },
    { name: 'Laporan', path: '/reports' },
  ];

  return (
    <nav className="bg-emerald-800 dark:bg-emerald-950 text-white shadow-lg sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white overflow-hidden rounded-full w-10 h-10 flex items-center justify-center border-2 border-emerald-600">
              <img src={logo} alt="Surau Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg tracking-tight hidden sm:inline">Surau Seri Dahlia</span>
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest hidden sm:inline">Sistem Kehadiran</span>
              <span className="font-bold text-lg sm:hidden">Surau Dahlia</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 mr-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${location.pathname === item.path
                    ? 'bg-emerald-900 dark:bg-emerald-900 text-white'
                    : 'hover:bg-emerald-700'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-emerald-700 rounded-full transition-colors mr-2 text-emerald-100"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-emerald-700">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-xs font-bold leading-none">{user.displayName}</span>
                  <span className="text-[10px] opacity-60">Admin</span>
                </div>
                <img
                  src={user.photoURL || ''}
                  alt={user.displayName || ''}
                  className="w-8 h-8 rounded-full border-2 border-emerald-600 shadow-sm"
                />
                <button
                  onClick={logout}
                  className="p-2 hover:bg-rose-600/20 text-rose-300 hover:text-rose-100 rounded-full transition-colors"
                  title="Log Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center space-x-2 bg-white text-emerald-800 px-4 py-2 rounded-lg font-bold hover:bg-emerald-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Log Masuk</span>
              </button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-1">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-emerald-700 rounded-lg text-emerald-100"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!user && (
              <button
                onClick={loginWithGoogle}
                className="bg-white text-emerald-800 p-2 rounded-lg"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-emerald-800 dark:bg-emerald-950 border-t border-emerald-700 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-bold ${location.pathname === item.path
                    ? 'bg-emerald-900 shadow-inner'
                    : 'hover:bg-emerald-700'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <div className="pt-4 mt-4 border-t border-emerald-700">
                  <div className="flex items-center space-x-3 px-4 mb-4">
                    <img
                      src={user.photoURL || ''}
                      alt={user.displayName || ''}
                      className="w-10 h-10 rounded-full border-2 border-emerald-600"
                    />
                    <div>
                      <div className="text-sm font-bold">{user.displayName}</div>
                      <div className="text-xs opacity-70">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-rose-500/10 text-rose-300 p-4 rounded-xl font-bold border border-rose-500/20"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
