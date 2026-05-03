import { User } from 'firebase/auth';
import { Plus, Trash2, UserCheck, UserMinus, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { addImam, deleteImam, subscribeImams, toggleImamStatus } from '../../services/db';
import { Imam } from '../../types';
import { Button, Card } from '../ui/Common';
import { motion, AnimatePresence } from 'motion/react';

export default function ImamManager() {
  const [imams, setImams] = useState<Imam[]>([]);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return subscribeImams(setImams);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsLoading(true);
    await addImam(newName.trim());
    setNewName('');
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-500">Urus Senarai Imam</h1>
        <p className="text-slate-600 dark:text-slate-400">Daftar dan urus imam surau yang menyediakan khidmat solat berjemaah.</p>
      </header>

      <Card className="p-6 dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Users className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
                type="text"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="Masukkan nama penuh imam..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <Button type="submit" isLoading={isLoading} className="sm:w-auto shadow-lg shadow-emerald-200 dark:shadow-none">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Imam
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {imams.map((imam) => (
            <motion.div
              layout
              key={imam.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-4 flex items-center justify-between group hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl border transition-colors ${imam.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold transition-all ${!imam.isActive ? 'text-slate-400 line-through dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'}`}>{imam.name}</h3>
                    <span className={`text-[10px] uppercase tracking-widest font-black ${imam.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {imam.isActive ? 'Ahli Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                    onClick={() => toggleImamStatus(imam.id, !imam.isActive)}
                    title={imam.isActive ? 'Nyahaktif' : 'Aktifkan'}
                  >
                    {imam.isActive ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-rose-500 dark:hover:bg-rose-900/20"
                    onClick={() => {
                        if(confirm(`Adakah anda pasti ingin memadam nama ${imam.name}? Segala rekod tetap akan tersimpan.`)) {
                            deleteImam(imam.id);
                        }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {imams.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
          <div className="bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-700" />
          </div>
          <p className="text-slate-400 italic dark:text-slate-600">Tiada imam didaftarkan lagi. Tambah imam di atas untuk bermula.</p>
        </div>
      )}
    </div>
  );
}
