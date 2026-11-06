import React, { useRef, useState } from 'react';
import { Transaction, CompanyInfo } from '../types.ts';
import { 
  formatBnNumber, 
  formatBnCurrency, 
  formatBnDate, 
  formatBnMonthYear,
  getPaymentMethodLabel 
} from '../utils/bengali.ts';
import { X, Printer, Download, Building2, Phone, MapPin, Calendar, CheckCircle2, Loader2, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintReportModalProps {
  transactions: Transaction[];
  company: CompanyInfo;
  selectedMonth: string;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  transactions,
  company,
  selectedMonth,
  onClose
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const filtered = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));

  const totalIncome = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netBalance = totalIncome - totalExpense;

  // Direct PDF Download Generation
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setDownloadingPdf(true);

    try {
      // Capture element as high-res image
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeMonth = selectedMonth || 'monthly';
      pdf.save(`${company.name || 'Hisab_Khata'}_${safeMonth}_Report.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to print
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Send summary via mailto browser link
  const handleSendEmail = () => {
    const subject = `${company.name || 'Hisab Khata'} - মাসিক হিসাব বিবরণী (${formatBnMonthYear(selectedMonth)})`;
    const summaryLines = [
      `প্রতিষ্ঠান: ${company.name || 'DIP BHOLA NETWORK'}`,
      `পরিচালক: ${company.ownerName || 'N/A'}`,
      `মাস: ${formatBnMonthYear(selectedMonth)}`,
      `----------------------------------------`,
      `মোট আয় (Deposit): ৳${totalIncome.toLocaleString('en-IN')}`,
      `মোট ব্যয় (Expense): ৳${totalExpense.toLocaleString('en-IN')}`,
      `নিট ক্যাশ উদ্বৃত্ত: ৳${netBalance.toLocaleString('en-IN')}`,
      `মোট লেনদেন সংখ্যা: ${filtered.length} টি`,
      `----------------------------------------`,
      `সফটওয়্যারের মাধ্যমে স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত রিপোর্ট।`
    ];

    const bodyText = summaryLines.join('\n');
    window.location.href = `mailto:${company.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Controls Bar - Hidden when printing */}
        <div className="bg-emerald-800 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-300" />
            <div>
              <span className="font-bold text-base block">মাসিক হিসাব নিকাশ ও ব্যালেন্স শিট</span>
              <span className="text-xs text-emerald-200">মাস: {formatBnMonthYear(selectedMonth)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Send via Email Button */}
            <button
              onClick={handleSendEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition"
              title="ইমেইলে রিপোর্ট পাঠান"
            >
              <Mail className="w-4 h-4" />
              <span>ইমেইলে পাঠান</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow transition disabled:opacity-60"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>পিডিএফ তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>পিডিএফ (PDF)</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-emerald-200 hover:text-white p-1.5 rounded-full hover:bg-emerald-700 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Downloadable Official Statement Container */}
        <div ref={reportRef} className="p-8 sm:p-12 space-y-6 text-slate-800 bg-white">
          
          {/* Company Letterhead */}
          <div className="text-center border-b-2 border-emerald-800 pb-6 relative">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-16 h-16 object-contain mx-auto mb-2 border border-slate-200 p-1 rounded-xl shadow-xs"
              />
            ) : null}

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wide">
              {company.name || 'হিসাব খাতা এন্টারপ্রাইজ'}
            </h1>
            {company.subTitle && (
              <p className="text-xs sm:text-sm text-emerald-800 font-medium mt-0.5">{company.subTitle}</p>
            )}

            <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              {company.ownerName && (
                <span>মালিক / পরিচালক: <strong className="text-slate-800">{company.ownerName}</strong></span>
              )}
              {company.phone && (
                <span>মোবাইল: <strong className="text-slate-800">{company.phone}</strong></span>
              )}
              {company.email && (
                <span>ইমেইল: <strong className="text-slate-800">{company.email}</strong></span>
              )}
              {company.address && (
                <span>ঠিকানা: <strong className="text-slate-800">{company.address}</strong></span>
              )}
            </div>

            <div className="mt-4 inline-block bg-emerald-50 border border-emerald-300 px-6 py-1.5 rounded-full text-xs sm:text-sm font-bold text-emerald-950 shadow-2xs">
              মাসিক পূর্ণাঙ্গ আয়-ব্যয় হিসাব বিবরণী: {formatBnMonthYear(selectedMonth)}
            </div>
          </div>

          {/* KPI Summary Block */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border border-emerald-200 bg-emerald-50/60 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">মোট আয় (Cash In)</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-700">{formatBnCurrency(totalIncome)}</span>
            </div>

            <div className="border border-red-200 bg-red-50/60 p-3.5 rounded-xl">
              <span className="text-[11px] font-bold text-red-800 uppercase block mb-1">মোট ব্যয় (Cash Out)</span>
              <span className="text-lg sm:text-xl font-extrabold text-red-700">{formatBnCurrency(totalExpense)}</span>
            </div>

            <div className={`border p-3.5 rounded-xl ${
              netBalance >= 0 ? 'border-teal-300 bg-teal-50/60' : 'border-amber-300 bg-amber-50/60'
            }`}>
              <span className="text-[11px] font-bold text-slate-800 uppercase block mb-1">
                {netBalance >= 0 ? 'নগদ উদ্বৃত্ত / ক্যাশ স্থিতি' : 'ঘাটতি / লোকসান'}
              </span>
              <span className={`text-lg sm:text-xl font-extrabold ${netBalance >= 0 ? 'text-teal-700' : 'text-amber-700'}`}>
                {formatBnCurrency(Math.abs(netBalance))}
              </span>
            </div>
          </div>

          {/* Transactions Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                লেনদেনের পূর্ণাঙ্গ বিবরণী ({formatBnNumber(filtered.length)} টি এন্ট্রি):
              </h3>
              <span className="text-[11px] text-slate-500">মুদ্রা: বাংলাদেশি টাকা (৳)</span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">ক্রম</th>
                    <th className="py-2.5 px-3">তারিখ</th>
                    <th className="py-2.5 px-3">বিবরণ / খাত</th>
                    <th className="py-2.5 px-3">ক্যাটাগরি</th>
                    <th className="py-2.5 px-3">মাধ্যম</th>
                    <th className="py-2.5 px-3">এন্ট্রি দাতা</th>
                    <th className="py-2.5 px-3 text-right">আয় (টাকা ৳)</th>
                    <th className="py-2.5 px-3 text-right">ব্যয় (টাকা ৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        এই মাসে কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filtered.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-500 font-medium">{formatBnNumber(idx + 1)}</td>
                        <td className="py-2 px-3 text-slate-700 font-medium whitespace-nowrap">{formatBnDate(tx.date)}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {tx.title}
                          {tx.note && <span className="block text-[10px] text-slate-500 font-normal">{tx.note}</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{tx.category}</td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{getPaymentMethodLabel(tx.paymentMethod)}</td>
                        <td className="py-2 px-3 text-slate-800 font-medium whitespace-nowrap">{tx.addedBy}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800 whitespace-nowrap">
                          {tx.type === 'income' ? formatBnNumber(tx.amount.toLocaleString('en-IN')) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-red-700 whitespace-nowrap">
                          {tx.type === 'expense' ? formatBnNumber(tx.amount.toLocaleString('en-IN')) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-2.5 px-3 text-right">সর্বমোট হিসাব:</td>
                    <td className="py-2.5 px-3 text-right text-emerald-800">{formatBnCurrency(totalIncome)}</td>
                    <td className="py-2.5 px-3 text-right text-red-800">{formatBnCurrency(totalExpense)}</td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="py-2 px-3 text-right text-slate-600">
                      মাসিক প্রকৃত ক্যাশ উদ্বৃত্ত (Cash Balance):
                    </td>
                    <td colSpan={2} className="py-2 px-3 text-right text-sm font-extrabold text-teal-800">
                      {formatBnCurrency(netBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official Signatures */}
          <div className="pt-16 pb-4 grid grid-cols-2 gap-8 text-center text-xs text-slate-700">
            <div>
              <div className="border-t border-slate-400 w-44 mx-auto pt-1 font-semibold">
                হিসাব প্রস্তুতকারীর স্বাক্ষর
              </div>
              <span className="text-[10px] text-slate-400">তারিখ: ____________</span>
            </div>
            <div>
              <div className="border-t border-slate-400 w-44 mx-auto pt-1 font-semibold text-emerald-900">
                মালিক / পরিচালকের স্বাক্ষর ও সীল
              </div>
              <span className="text-[10px] text-slate-400">তারিখ: ____________</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
