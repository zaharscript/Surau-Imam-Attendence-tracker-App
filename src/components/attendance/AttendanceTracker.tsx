import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ms } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { subscribeAttendanceByMonth, subscribeImams, toggleAttendance } from '../../services/db';
import { AttendanceRecord, Imam, PrayerType } from '../../types';
import { Button, Card } from '../ui/Common';
import { motion } from 'motion/react';

export default function AttendanceTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [imams, setImams] = useState<Imam[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const currentMonthStr = format(selectedDate, 'yyyy-MM');

  useEffect(() => {
    const unsubImams = subscribeImams(setImams);
    const unsubAttendance = subscribeAttendanceByMonth(currentMonthStr, setAttendance);
    return () => {
      unsubImams();
      unsubAttendance();
    };
  }, [currentMonthStr]);

  const activeImams = imams.filter(i => i.isActive);
  const prayerTypes = [PrayerType.SUBUH, PrayerType.MAGHRIB, PrayerType.ISYAK];

  const getDayAttendance = (date: Date, imamId: string, prayer: PrayerType) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendance.find(a => a.date === dateStr && a.imamId === imamId && a.prayerType === prayer);
  };

  const isPrayerTakenByOther = (prayer: PrayerType, currentImamId: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return attendance.some(a => a.date === dateStr && a.prayerType === prayer && a.imamId !== currentImamId);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-500">Kehadiran</h1>
          <p className="text-slate-600 dark:text-slate-400">Rekod kehadiran solat imams.</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span className="font-bold text-emerald-900 dark:text-emerald-400">
            {format(selectedDate, 'dd MMM yyyy', { locale: ms })}
          </span>
        </div>
      </header>

      {/* Date Nav */}
      <div className="flex items-center space-x-3">
        <Button variant="outline" size="sm" onClick={() => changeDate(-1)} className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
          <ChevronLeft className="w-4 h-4 mr-1" /> Sblm
        </Button>
        <div className="flex-1 flex justify-center">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">HARI INI</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => changeDate(1)} className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
          Seterusnya <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeImams.map((imam) => (
          <Card key={imam.id} className="p-5 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-emerald-900 dark:text-emerald-400">{imam.name}</h3>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-black">
                RM {(attendance.filter(a => a.imamId === imam.id && a.date === format(selectedDate, 'yyyy-MM-dd')).length * 5).toFixed(2)}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {prayerTypes.map((prayer) => {
                const record = getDayAttendance(selectedDate, imam.id, prayer);
                const isSelected = !!record;
                const isTaken = isPrayerTakenByOther(prayer, imam.id);

                return (
                  <motion.button
                    key={prayer}
                    disabled={isTaken}
                    whileTap={!isTaken ? { scale: 0.95 } : {}}
                    onClick={() => toggleAttendance(format(selectedDate, 'yyyy-MM-dd'), imam.id, prayer, record?.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none'
                        : isTaken
                        ? 'bg-slate-50 dark:bg-slate-800 border-slate-50 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-400 hover:border-emerald-100'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-widest font-black mb-1 opacity-70">
                      {prayer === PrayerType.SUBUH ? 'Subuh' : prayer === PrayerType.MAGHRIB ? 'Maghrib' : 'Isyak'}
                    </span>
                    {isSelected ? (
                      <Check className="w-6 h-6 stroke-[3px]" />
                    ) : isTaken ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </Card>
        ))}

        {activeImams.length === 0 && (
          <Card className="p-16 text-center dark:bg-slate-900 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-400 italic mb-6 dark:text-slate-500">Tiada imam aktif dijumpai dalam sistem.</p>
            <Button variant="outline" onClick={() => window.location.href = '/imams'} className="dark:bg-slate-800 dark:border-slate-700">
                Urus Senarai Imam
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
