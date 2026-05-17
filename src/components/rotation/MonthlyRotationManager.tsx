import React, { useEffect, useState, useMemo } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    isToday,
    parseISO,
} from 'date-fns';
import { ms } from 'date-fns/locale';
import {
    Calendar,
    Clock,
    User,
    Trash2,
    AlertCircle,
    Info,
    CalendarDays,
    LayoutGrid,
    ChevronLeft,
    ChevronRight,
    Filter,
    Users,
    BarChart3,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
    subscribeImams,
    subscribeMonthlyRotations,
    addMonthlyRotation,
    deleteMonthlyRotation
} from '../../services/db';
import { Imam, PrayerType } from '../../types';
import { Button, Card } from '../ui/Common';

interface MonthlyRotation {
    id: string;
    month: string;
    imamId: string;
    imamName: string;
    prayerType: string;
    days: string[];
    createdAt: any;
}

const PrayerRow = ({ color, imamName }: { color: string; imamName: string }) => (
    <div className="flex items-center gap-2 py-0.5 px-0.5 overflow-hidden">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
        <span className={`text-[10px] font-medium truncate ${imamName === '-' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'}`}>
            {imamName}
        </span>
    </div>
);

const WEEKDAYS = [
    'Isnin',
    'Selasa',
    'Rabu',
    'Khamis',
    'Jumaat',
    'Sabtu',
    'Ahad'
];

export default function MonthlyRotationManager() {
    // State
    const [imams, setImams] = useState<Imam[]>([]);
    const [rotations, setRotations] = useState<MonthlyRotation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [selectedImamId, setSelectedImamId] = useState('');
    const [selectedPrayer, setSelectedPrayer] = useState<PrayerType>(PrayerType.SUBUH);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    // Enhancement States
    const [selectedDayDetail, setSelectedDayDetail] = useState<Date | null>(null);

    // Subscriptions
    useEffect(() => {
        const unsubImams = subscribeImams(setImams);
        const unsubRotations = subscribeMonthlyRotations(selectedMonth, (data: MonthlyRotation[]) => {
            setRotations(data);
        });

        return () => {
            unsubImams();
            unsubRotations();
        };
    }, [selectedMonth]);

    const activeImams = imams.filter(i => i.isActive);

    // Calendar Logic
    const calendarData = useMemo(() => {
        const start = startOfMonth(parseISO(`${selectedMonth}-01`));
        const end = endOfMonth(start);
        const days = eachDayOfInterval({ start, end });

        // Map assignments to dates
        return days.map(date => {
            const dayIdx = (getDay(date) + 6) % 7;
            const dayName = WEEKDAYS[dayIdx];
            const dayAssignments = rotations.filter(r => r.days.includes(dayName));

            const subuh = dayAssignments.find(r => r.prayerType === PrayerType.SUBUH);
            const maghrib = dayAssignments.find(r => r.prayerType === PrayerType.MAGHRIB);
            const isyak = dayAssignments.find(r => r.prayerType === PrayerType.ISYAK);

            return {
                date,
                dayName,
                assignments: {
                    [PrayerType.SUBUH]: subuh,
                    [PrayerType.MAGHRIB]: maghrib,
                    [PrayerType.ISYAK]: isyak
                },
                count: [subuh, maghrib, isyak].filter(Boolean).length
            };
        });
    }, [selectedMonth, rotations]);

    const firstDayIdx = (getDay(startOfMonth(parseISO(`${selectedMonth}-01`))) + 6) % 7;

    const toggleDay = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedImamId || !selectedMonth || !selectedPrayer || selectedDays.length === 0) {
            setError('Sila lengkapkan semua maklumat dan pilih sekurang-kurangnya satu hari.');
            return;
        }

        const imam = imams.find(i => i.id === selectedImamId);
        if (!imam) return;

        setLoading(true);
        setError(null);
        try {
            await addMonthlyRotation({
                month: selectedMonth,
                imamId: selectedImamId,
                imamName: imam.name,
                prayerType: selectedPrayer,
                days: selectedDays
            });
            setSelectedDays([]);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan jadual.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Adakah anda pasti ingin memadam giliran ini?')) {
            await deleteMonthlyRotation(id);
        }
    };

    // Stats Logic
    const stats = useMemo(() => {
        const imamCounts: Record<string, number> = {};
        rotations.forEach(r => {
            imamCounts[r.imamName] = (imamCounts[r.imamName] || 0) + r.days.length;
        });

        const busyImam = Object.entries(imamCounts).sort((a, b) => b[1] - a[1])[0];
        const totalSlots = calendarData.length * 3;
        const assignedSlots = calendarData.reduce((acc, curr) => acc + curr.count, 0);
        const coverage = Math.round((assignedSlots / totalSlots) * 100);

        return {
            busyImam: busyImam ? { name: busyImam[0], count: busyImam[1] } : null,
            coverage,
            totalAssigned: assignedSlots
        };
    }, [rotations, calendarData]);

    // Grouped Summary Logic
    const groupedByImam = rotations.reduce((acc, curr) => {
        if (!acc[curr.imamId]) {
            acc[curr.imamId] = {
                name: curr.imamName,
                assignments: []
            };
        }
        acc[curr.imamId].assignments.push(curr);
        return acc;
    }, {} as Record<string, { name: string; assignments: MonthlyRotation[] }>);

    // Weekly Preview Logic
    const weeklyPreview = WEEKDAYS.map(day => {
        return {
            day,
            prayers: {
                [PrayerType.SUBUH]: rotations.find(r => r.days.includes(day) && r.prayerType === PrayerType.SUBUH),
                [PrayerType.MAGHRIB]: rotations.find(r => r.days.includes(day) && r.prayerType === PrayerType.MAGHRIB),
                [PrayerType.ISYAK]: rotations.find(r => r.days.includes(day) && r.prayerType === PrayerType.ISYAK),
            }
        };
    });

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-2 bg-emerald-600 rounded-full" />
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Pengurusan Giliran Imam</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium ml-5">Sistem penjadualan imam automatik .</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-3xl shadow-sm border border-slate-50 dark:border-slate-800">
                    <button
                        onClick={() => {
                            const date = parseISO(`${selectedMonth}-01`);
                            const prev = format(new Date(date.setMonth(date.getMonth() - 1)), 'yyyy-MM');
                            setSelectedMonth(prev);
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-emerald-600"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-6 text-lg font-black text-emerald-900 dark:text-emerald-500 min-w-[140px] text-center">
                        {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ms })}
                    </div>
                    <button
                        onClick={() => {
                            const date = parseISO(`${selectedMonth}-01`);
                            const next = format(new Date(date.setMonth(date.getMonth() + 1)), 'yyyy-MM');
                            setSelectedMonth(next);
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-emerald-600"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Rotation Form Area */}
            <Card className="p-8 md:p-10 dark:bg-slate-900/50 dark:border-slate-800 relative overflow-hidden group border-none shadow-[25px_25px_60px_#e2e8f0,_-25px_-25px_60px_#ffffff] dark:shadow-none bg-white rounded-[3rem]">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] dark:opacity-[0.05]">
                    <Users className="w-48 h-48" />
                </div>

                <div className="flex items-center space-x-4 mb-8 relative z-10">
                    <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none">
                        <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Konfigurasi Giliran Baru</h2>
                        <p className="text-xs font-bold text-slate-400">Pilih imam dan hari bertugas untuk bulan {format(parseISO(`${selectedMonth}-01`), 'MMMM', { locale: ms })}.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nama Imam</label>
                            <div className="relative">
                                <User className="absolute left-4 top-4 w-5 h-5 text-emerald-600/50" />
                                <select
                                    value={selectedImamId}
                                    onChange={(e) => setSelectedImamId(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none shadow-sm font-bold"
                                >
                                    <option value="">Pilih Imam...</option>
                                    {activeImams.map((imam: Imam) => (
                                        <option key={imam.id} value={imam.id}>{imam.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Waktu Solat</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-4 w-5 h-5 text-emerald-600/50" />
                                <select
                                    value={selectedPrayer}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPrayer(e.target.value as PrayerType)}
                                    className="w-full pl-12 pr-4 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none shadow-sm font-bold"
                                >
                                    <option value={PrayerType.SUBUH}>Subuh</option>
                                    <option value={PrayerType.MAGHRIB}>Maghrib</option>
                                    <option value={PrayerType.ISYAK}>Isyak</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Hari Bertugas</label>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAYS.map((day) => {
                                    const isSelected = selectedDays.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`
                                            px-4 py-3 rounded-2xl text-[10px] font-black transition-all border uppercase tracking-tighter
                                            ${isSelected
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-transparent'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-emerald-200 border-slate-100 dark:border-slate-800'}
                                            `}
                                        >
                                            {day.substring(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-50 dark:border-slate-800/50 mt-8">
                        <div className="flex-1">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center space-x-2 text-rose-500 font-bold text-sm"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </div>
                        <Button type="submit" isLoading={loading} className="w-full md:w-auto px-12 py-5 shadow-2xl shadow-emerald-200 dark:shadow-none bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black transition-all hover:-translate-y-1">
                            Simpan Perubahan Giliran
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Monthly Allocation Preview Dashboard */}
            <Card className="p-6 md:p-10 border-none shadow-xl bg-white dark:bg-slate-900 rounded-[2rem] relative overflow-hidden h-full border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Preview Giliran</h2>
                        </div>
                        <p className="text-sm font-medium text-slate-400">
                            Paparan jadual giliran imam untuk {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: ms })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <button
                            onClick={() => {
                                const date = parseISO(`${selectedMonth}-01`);
                                const prev = format(new Date(date.setMonth(date.getMonth() - 1)), 'yyyy-MM');
                                setSelectedMonth(prev);
                            }}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-indigo-600 shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="relative group/picker">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="px-4 py-2 bg-white dark:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[140px] text-center uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm border border-slate-100 dark:border-slate-600 group-hover/picker:border-indigo-300 transition-colors">
                                <CalendarDays className="w-4 h-4 text-indigo-500" />
                                {format(parseISO(`${selectedMonth}-01`), 'MMM yyyy', { locale: ms })}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const date = parseISO(`${selectedMonth}-01`);
                                const next = format(new Date(date.setMonth(date.getMonth() + 1)), 'yyyy-MM');
                                setSelectedMonth(next);
                            }}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-indigo-600 shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto pb-4 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
                    <div className="min-w-[800px] md:min-w-full lg:min-w-full">
                        <div className="grid grid-cols-7 gap-0 border-b border-r border-slate-100 dark:border-slate-800 rounded-t-xl overflow-hidden">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="py-4 text-center border-l border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{day}</span>
                                </div>
                            ))}

                            {Array.from({ length: firstDayIdx }).map((_, i) => (
                                <div key={`pad-${i}`} className="min-h-[140px] border-l border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/5" />
                            ))}

                            {calendarData.map((item, idx) => {
                                const isCurrentDay = isToday(item.date);

                                return (
                                    <motion.div
                                        key={idx}
                                        onClick={() => setSelectedDayDetail(item.date)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        whileHover={{ zIndex: 10 }}
                                        className={`
                                    relative min-h-[140px] p-4 flex flex-col gap-3 group transition-all duration-300 border-l border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900
                                    hover:shadow-2xl hover:scale-[1.02] hover:rounded-xl hover:border-transparent
                                    ${isCurrentDay ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}
                                `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-black ${isCurrentDay ? 'text-indigo-600 w-7 h-7 flex items-center justify-center bg-indigo-100 rounded-full' : 'text-slate-400'}`}>
                                                {format(item.date, 'd')}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <PrayerRow
                                                color="bg-emerald-500"
                                                imamName={item.assignments[PrayerType.SUBUH]?.imamName || '-'}
                                            />
                                            <PrayerRow
                                                color="bg-orange-500"
                                                imamName={item.assignments[PrayerType.MAGHRIB]?.imamName || '-'}
                                            />
                                            <PrayerRow
                                                color="bg-blue-500"
                                                imamName={item.assignments[PrayerType.ISYAK]?.imamName || '-'}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-8 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">SUBUH</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm shadow-orange-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MAGHRIB</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ISYAK</span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Monthly Summary (WhatsApp style) */}
                <div className="space-y-6">
                    <div className="flex items-center space-x-3 ml-2">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200">
                            <Info className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Ringkasan Bulanan</h2>
                    </div>

                    <Card className="p-10 dark:bg-slate-900 dark:border-slate-800 min-h-[400px] border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white rounded-[2.5rem]">
                        {Object.keys(groupedByImam).length > 0 ? (
                            <div className="space-y-12">
                                {Object.values(groupedByImam).map((imam: { name: string; assignments: MonthlyRotation[] }, idx: number) => (
                                    <div key={idx} className="space-y-6">
                                        <div className="flex items-center space-x-4">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-sm font-black">
                                                {idx + 1}
                                            </span>
                                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest text-lg">
                                                {imam.name}
                                            </h3>
                                        </div>
                                        <div className="pl-12 space-y-4">
                                            {imam.assignments.map((asgn: MonthlyRotation) => (
                                                <div key={asgn.id} className="flex items-center justify-between group py-2 border-b border-slate-50 dark:border-slate-800 last:border-none">
                                                    <div className="flex items-center space-x-4 text-sm">
                                                        <div className={`w-3 h-3 rounded-full ${asgn.prayerType === PrayerType.SUBUH ? 'bg-emerald-500' : asgn.prayerType === PrayerType.MAGHRIB ? 'bg-orange-500' : 'bg-indigo-500'}`} />
                                                        <span className="font-black text-slate-800 dark:text-slate-200 w-24">{asgn.prayerType}</span>
                                                        <span className="text-slate-200">|</span>
                                                        <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">{asgn.days.join(' + ')}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(asgn.id)}
                                                        className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-24 text-center">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-full mb-6">
                                    <LayoutGrid className="w-16 h-16 text-slate-200 dark:text-slate-700" />
                                </div>
                                <p className="italic text-sm text-slate-400 font-medium">Tiada data rotation untuk bulan ini.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Weekly Preview */}
                <div className="space-y-6">
                    <div className="flex items-center space-x-3 ml-2">
                        <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-200">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Previu Mingguan</h2>
                    </div>

                    <div className="space-y-5">
                        {weeklyPreview.map((item) => (
                            <div key={item.day}>
                                <Card className="p-8 dark:bg-slate-900 dark:border-slate-800 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none border-l-8 border-l-emerald-600 bg-white rounded-[2.5rem]">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-10">
                                        <div className="w-32 flex-shrink-0">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-2 block">Hari</span>
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase text-xl tracking-widest">{item.day}</h4>
                                        </div>

                                        <div className="flex-1 grid grid-cols-3 gap-4">
                                            {[PrayerType.SUBUH, PrayerType.MAGHRIB, PrayerType.ISYAK].map(pType => {
                                                const asgn = item.prayers[pType];
                                                return (
                                                    <div key={pType} className="space-y-2 text-center sm:text-left">
                                                        <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 opacity-60 block">{pType}</span>
                                                        <div className={`px-4 py-3 rounded-2xl text-[11px] font-black truncate text-center ${asgn ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-700'}`}>
                                                            {asgn ? asgn.imamName : '-'}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Day Detail Modal */}
            <AnimatePresence>
                {selectedDayDetail && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDayDetail(null)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-white/20 dark:border-slate-800"
                        >
                            <button
                                onClick={() => setSelectedDayDetail(null)}
                                className="absolute top-8 right-8 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>

                            <div className="space-y-8">
                                <div className="space-y-1">
                                    <span className="text-xs font-black uppercase tracking-[0.5em] text-emerald-600 block mb-2">Maklumat Harian</span>
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase transition-all">
                                        {format(selectedDayDetail, 'd MMMM yyyy', { locale: ms })}
                                    </h2>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest">{WEEKDAYS[(getDay(selectedDayDetail) + 6) % 7]}</p>
                                </div>

                                <div className="space-y-4">
                                    {[PrayerType.SUBUH, PrayerType.MAGHRIB, PrayerType.ISYAK].map(pType => {
                                        const dayIdx = (getDay(selectedDayDetail) + 6) % 7;
                                        const dayName = WEEKDAYS[dayIdx];
                                        const asgn = rotations.find((r: MonthlyRotation) => r.days.includes(dayName) && r.prayerType === pType);

                                        return (
                                            <div key={pType} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <div className="flex items-center space-x-5">
                                                    <div className={`p-4 rounded-3xl ${pType === PrayerType.SUBUH ? 'bg-emerald-100 text-emerald-600' :
                                                        pType === PrayerType.MAGHRIB ? 'bg-orange-100 text-orange-600' :
                                                            'bg-indigo-100 text-indigo-600'
                                                        }`}>
                                                        <Clock className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">{pType}</span>
                                                        <div className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                                            {asgn ? asgn.imamName : 'Tiada Imam'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
