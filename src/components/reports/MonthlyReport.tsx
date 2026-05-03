import { format, startOfMonth, endOfMonth, eachDayOfInterval, getYear, getMonth } from 'date-fns';
import { ms } from 'date-fns/locale';
import { Download, FileText, TrendingUp, Wallet, LayoutGrid } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { subscribeAttendanceByMonth, subscribeImams } from '../../services/db';
import { AttendanceRecord, Imam, PrayerType } from '../../types';
import { Button, Card } from '../ui/Common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import logo from '../../assets/images/mosque_logo_1777792398407.png';

export default function MonthlyReport() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [imams, setImams] = useState<Imam[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const monthStr = format(selectedMonth, 'yyyy-MM');

  useEffect(() => {
    const unsubImams = subscribeImams(setImams);
    const unsubAttendance = subscribeAttendanceByMonth(monthStr, setAttendance);
    return () => {
      unsubImams();
      unsubAttendance();
    };
  }, [monthStr]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    const title = `Laporan Elaun Imam - ${format(selectedMonth, 'MMMM yyyy', { locale: ms })}`;
    const header = [['Tarikh', ...imams.map(i => i.name)]];
    
    const body = daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const row: any[] = [format(day, 'dd/MM')];
      
      imams.forEach(imam => {
        const count = attendance.filter(a => a.date === dateStr && a.imamId === imam.id).length;
        row.push(count > 0 ? count : '-');
      });
      return row;
    });

    const summaryData = imams.map(imam => {
      const count = attendance.filter(a => a.imamId === imam.id).length;
      return [imam.name, count, `RM ${(count * 5).toFixed(2)}`];
    });

    // Add Logo to the left
    doc.addImage(logo, 'PNG', 14, 10, 22, 22);

    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // Emerald color
    doc.text('SURAU SERI DAHLIA', 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Bandar Seri Putra, 43000 Kajang, Selangor', 105, 24, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(title, 105, 34, { align: 'center' });

    autoTable(doc, {
      head: [header[0]],
      body: body,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 8 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    doc.text('Ringkasan Elaun Bulanan', 14, finalY + 15);
    autoTable(doc, {
      head: [['Nama Imam', 'Jumlah Waktu', 'Jumlah Elaun']],
      body: summaryData,
      startY: finalY + 20,
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] }
    });

    const finalSummaryY = (doc as any).lastAutoTable.finalY || finalY + 40;

    doc.setFontSize(10);
    doc.text('Bayaran dibuat oleh : ________________________________', 14, finalSummaryY + 15);
    doc.text('Tarikh : ________________________________', 14, finalSummaryY + 25);
    doc.text(`Dicetak pada: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, finalSummaryY + 35);

    doc.save(`Elaun_Imam_${monthStr}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-500">Laporan & Statistik</h1>
          <p className="text-slate-600 dark:text-slate-400">Semak ringkasan bulanan dan eksport rekod kehadiran.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
           <LayoutGrid className="w-4 h-4 text-emerald-600 ml-2" />
           <input 
            type="month" 
            className="border-none bg-transparent outline-none font-bold text-emerald-800 dark:text-emerald-400 p-1"
            value={monthStr}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
           />
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-emerald-600 text-white border-none shadow-lg shadow-emerald-200 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Jumlah Elaun</p>
              <h2 className="text-3xl font-black">MYR {(attendance.length * 5).toFixed(2)}</h2>
            </div>
            <Wallet className="w-10 h-10 opacity-20" />
          </div>
        </Card>
        <Card className="p-6 bg-teal-600 dark:bg-teal-700 text-white border-none shadow-lg shadow-teal-100 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-xs font-bold uppercase tracking-wider mb-1">Bilangan Solat</p>
              <h2 className="text-3xl font-black">{attendance.length}</h2>
            </div>
            <TrendingUp className="w-10 h-10 opacity-20" />
          </div>
        </Card>
        
        <Card className="p-6 bg-slate-900 dark:bg-emerald-900 text-white border-none sm:col-span-2 shadow-xl">
            <div className="flex items-center space-x-4 h-full">
                 <div className="p-4 bg-white/10 rounded-2xl">
                    <FileText className="w-8 h-8 text-emerald-400" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-lg">Jana Laporan PDF</h3>
                    <p className="text-emerald-200/60 text-xs text-pretty">Muat turun salinan penuh kehadiran bulanan imam.</p>
                 </div>
                 <Button className="bg-emerald-500 hover:bg-emerald-400 text-white border-none" onClick={generatePDF}>
                    <Download className="w-4 h-4 mr-2" /> Eksport
                 </Button>
            </div>
        </Card>
      </div>

      {/* Summary Table */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
            <div className="w-2 h-6 bg-emerald-600 rounded-full" />
            <h3 className="font-bold text-slate-800 dark:text-emerald-500 uppercase tracking-widest text-[10px]">Jadual Ringkasan Elaun</h3>
        </div>
        <Card className="overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-5">Nama Imam</th>
                    <th className="px-6 py-5 text-center">Subuh</th>
                    <th className="px-6 py-5 text-center">Maghrib</th>
                    <th className="px-6 py-5 text-center">Isyak</th>
                    <th className="px-6 py-5 text-center">Jumlah Waktu</th>
                    <th className="px-6 py-5 text-right">Elaun</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {imams.map((imam) => {
                    const subuh = attendance.filter(a => a.imamId === imam.id && a.prayerType === PrayerType.SUBUH).length;
                    const maghrib = attendance.filter(a => a.imamId === imam.id && a.prayerType === PrayerType.MAGHRIB).length;
                    const isyak = attendance.filter(a => a.imamId === imam.id && a.prayerType === PrayerType.ISYAK).length;
                    const total = subuh + maghrib + isyak;

                    return (
                        <tr key={imam.id} className="hover:bg-slate-50 transition-colors group dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{imam.name}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-center">{subuh}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-center">{maghrib}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-center">{isyak}</td>
                        <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-600 dark:text-slate-300">
                                {total}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-500 text-lg">
                            RM {(total * 5).toFixed(2)}
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
}
