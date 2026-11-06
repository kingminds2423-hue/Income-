import React, { useState } from 'react';
import { Partner, CompanyInfo, PartnerInvestmentEntry } from '../types.ts';
import { api } from '../services/api.ts';
import { formatBnCurrency, formatBnNumber, formatBnDate } from '../utils/bengali.ts';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  PieChart, 
  ShieldCheck, 
  Phone, 
  Calendar, 
  Building2, 
  Check, 
  X,
  AlertCircle,
  FileText,
  Clock,
  TrendingUp,
  User
} from 'lucide-react';

interface PartnersInvestmentViewProps {
  company: CompanyInfo;
  onRefresh: () => Promise<void>;
  isAdmin: boolean;
}

export const PartnersInvestmentView: React.FC<PartnersInvestmentViewProps> = ({ company, onRefresh, isAdmin }) => {
  const partners = company.partners || [];

  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  
  const [selectedPartnerForInvestment, setSelectedPartnerForInvestment] = useState<Partner | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Partner basic info form
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    phone: '',
    sharePercentage: '',
    role: 'অংশীদার'
  });

  // Timed investment entry form
  const [investmentForm, setInvestmentForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    amount: '',
    note: 'অতিরিক্ত মূলধন বিনিয়োগ'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Total calculations
  const totalInvestment = partners.reduce((sum, p) => {
    const pTotal = p.investmentHistory && p.investmentHistory.length > 0
      ? p.investmentHistory.reduce((s, e) => s + (Number(e.amount) || 0), 0)
      : (Number(p.investment) || 0);
    return sum + pTotal;
  }, 0);

  const totalShare = partners.reduce((sum, p) => sum + (Number(p.sharePercentage) || 0), 0);

  // Partner Modal Handlers
  const handleOpenAddPartner = () => {
    setEditingPartner(null);
    setPartnerForm({ name: '', phone: '', sharePercentage: '', role: 'অংশীদার' });
    setErrorMsg('');
    setIsPartnerModalOpen(true);
  };

  const handleOpenEditPartner = (p: Partner) => {
    setEditingPartner(p);
    setPartnerForm({
      name: p.name,
      phone: p.phone || '',
      sharePercentage: String(p.sharePercentage || 0),
      role: p.role || 'অংশীদার'
    });
    setErrorMsg('');
    setIsPartnerModalOpen(true);
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!partnerForm.name.trim()) {
      setErrorMsg('অংশীদারের নাম আবশ্যক!');
      return;
    }

    setLoading(true);
    try {
      let updatedPartners = [...partners];
      const shareNum = Number(partnerForm.sharePercentage) || 0;

      if (editingPartner) {
        updatedPartners = updatedPartners.map(p => 
          p.id === editingPartner.id 
            ? { ...p, name: partnerForm.name, phone: partnerForm.phone, sharePercentage: shareNum, role: partnerForm.role }
            : p
        );
      } else {
        const newPartner: Partner = {
          id: 'p-' + Date.now(),
          name: partnerForm.name,
          phone: partnerForm.phone,
          investment: 0,
          sharePercentage: shareNum,
          role: partnerForm.role,
          investmentHistory: []
        };
        updatedPartners.push(newPartner);
      }

      await api.updateCompany({ ...company, partners: updatedPartners });
      await onRefresh();
      setSuccessMsg(editingPartner ? 'অংশীদারের তথ্য সফলভাবে আপডেট হয়েছে!' : 'নতুন অংশীদার যুক্ত হয়েছে!');
      setIsPartnerModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'সেভ করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  // Open Timed Investment Modal for a Partner
  const handleOpenAddInvestment = (partner: Partner) => {
    setSelectedPartnerForInvestment(partner);
    setInvestmentForm({
      date: new Date().toISOString().substring(0, 10),
      amount: '',
      note: 'মূলধন বৃদ্ধি / নতুন বিনিয়োগ'
    });
    setErrorMsg('');
    setIsInvestmentModalOpen(true);
  };

  // Submit Date-wise Investment Entry
  const handleInvestmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerForInvestment) return;
    setErrorMsg('');

    const amountNum = Number(investmentForm.amount) || 0;
    if (amountNum <= 0) {
      setErrorMsg('সঠিক টাকার পরিমাণ প্রদান করুন!');
      return;
    }

    setLoading(true);
    try {
      const newEntry: PartnerInvestmentEntry = {
        id: 'inv-' + Date.now(),
        date: investmentForm.date,
        amount: amountNum,
        note: investmentForm.note || 'মূলধন বিনিয়োগ'
      };

      const updatedPartners = partners.map(p => {
        if (p.id === selectedPartnerForInvestment.id) {
          const history = p.investmentHistory || [];
          const newHistory = [newEntry, ...history];
          const newTotal = newHistory.reduce((sum, item) => sum + Number(item.amount), 0);
          return {
            ...p,
            investment: newTotal,
            investmentHistory: newHistory
          };
        }
        return p;
      });

      await api.updateCompany({ ...company, partners: updatedPartners });
      await onRefresh();
      setSuccessMsg(`'${selectedPartnerForInvestment.name}' এর জন্য ${formatBnCurrency(amountNum)} নতুন বিনিয়োগ সফলভাবে রেকর্ড হয়েছে!`);
      setIsInvestmentModalOpen(false);
      setSelectedPartnerForInvestment(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'বিনিয়োগ এন্ট্রি যুক্ত করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  // Delete Investment Entry
  const handleDeleteInvestmentEntry = async (partnerId: string, entryId: string) => {
    if (!window.confirm('আপনি কি এই বিনিয়োগ এন্ট্রিটি মুছে ফেলতে চান?')) return;
    try {
      const updatedPartners = partners.map(p => {
        if (p.id === partnerId) {
          const history = (p.investmentHistory || []).filter(e => e.id !== entryId);
          const newTotal = history.reduce((sum, item) => sum + Number(item.amount), 0);
          return {
            ...p,
            investment: newTotal,
            investmentHistory: history
          };
        }
        return p;
      });

      await api.updateCompany({ ...company, partners: updatedPartners });
      await onRefresh();
      setSuccessMsg('বিনিয়োগ এন্ট্রি মুছে ফেলা হয়েছে।');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলা যায়নি');
    }
  };

  // Delete Partner
  const handleDeletePartner = async (partnerId: string, name: string) => {
    if (!window.confirm(`আপনি কি '${name}' অংশীদারকে তালিকা থেকে বাদ দিতে চান?`)) return;
    try {
      const updatedPartners = partners.filter(p => p.id !== partnerId);
      await api.updateCompany({ ...company, partners: updatedPartners });
      await onRefresh();
      setSuccessMsg(`'${name}' অংশীদার মুছে ফেলা হয়েছে।`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলা সম্ভব হয়নি');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xs border border-white/20 shrink-0">
            <PieChart className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">তারিখ অনুযায়ী অংশীদারদের বিনিয়োগ ও মালিকানা ড্যাশবোর্ড</h1>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1">
              অংশীদারদের শেয়ার স্টেক, তারিখভিত্তিক নতুন বিনিয়োগ ইতিহাস (Investment History) এবং মোট মূলধন ট্র্যাকিং।
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddPartner}
            className="bg-white text-emerald-950 hover:bg-emerald-50 font-extrabold px-5 py-3 rounded-xl text-sm shadow-md transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন অংশীদার যুক্ত করুন</span>
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">মোট অংশীদার সংখ্যা</span>
            <h3 className="text-xl font-extrabold text-slate-900">{formatBnNumber(partners.length)} জন</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">সর্বমোট যৌথ মূলধন (Total Capital)</span>
            <h3 className="text-xl font-extrabold text-teal-950">{formatBnCurrency(totalInvestment)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">মোট লভ্যাংশ শেয়ার</span>
            <h3 className={`text-xl font-extrabold ${totalShare === 100 ? 'text-indigo-950' : 'text-amber-600'}`}>
              {formatBnNumber(totalShare)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Partners Separate Dashboards List */}
      {partners.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 text-base">কোনো অংশীদারের তথ্য নেই</h4>
          <p className="text-xs text-slate-400 mt-1">প্রথমে নতুন অংশীদার যুক্ত করুন।</p>
        </div>
      ) : (
        <div className="space-y-6">
          {partners.map((partner) => {
            const history = partner.investmentHistory || [];
            const partnerTotalInv = history.length > 0
              ? history.reduce((sum, h) => sum + Number(h.amount), 0)
              : (Number(partner.investment) || 0);

            const shareRatio = totalInvestment > 0 ? ((partnerTotalInv / totalInvestment) * 100).toFixed(1) : '0';

            return (
              <div 
                key={partner.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Partner Header Bar */}
                <div className="bg-slate-50 p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                      {partner.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-lg">{partner.name}</h3>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {partner.role || 'অংশীদার'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {partner.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            {partner.phone}
                          </span>
                        )}
                        <span>•</span>
                        <span>লভ্যাংশ শেয়ার: <strong className="text-emerald-700">{formatBnNumber(partner.sharePercentage)}%</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">মোট বিনিয়োগ</span>
                      <strong className="text-base sm:text-lg font-extrabold text-emerald-800">{formatBnCurrency(partnerTotalInv)}</strong>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenAddInvestment(partner)}
                          className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>তারিখ অনুযায়ী বিনিয়োগ যোগ</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditPartner(partner)}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition"
                          title="অংশীদার সম্পাদনা"
                        >
                          <Edit3 className="w-4 h-4 text-emerald-700" />
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner.id, partner.name)}
                          className="p-2 bg-white hover:bg-red-50 text-red-600 rounded-xl border border-slate-300 transition"
                          title="অংশীদার মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Partner Investment History Timeline Table */}
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>তারিখভিত্তিক বিনিয়োগ ইতিহাস ও রেকর্ড (Investment History Timeline)</span>
                  </h4>

                  {history.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                      এই অংশীদারের জন্য কোনো তারিখভিত্তিক আলাদা বিনিয়োগ এন্ট্রি নেই। (প্রাথমিক বিনিয়োগ: {formatBnCurrency(partner.investment || 0)})
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider">
                            <th className="p-3 rounded-l-lg">তারিখ</th>
                            <th className="p-3">বিবরণ / নোট</th>
                            <th className="p-3 text-right">বিনিয়োগের পরিমাণ</th>
                            {isAdmin && <th className="p-3 text-center rounded-r-lg">অ্যাকশন</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {history.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/80">
                              <td className="p-3 text-slate-800 font-semibold flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                {formatBnDate(inv.date)}
                              </td>
                              <td className="p-3 text-slate-600">{inv.note || 'মূলধন বিনিয়োগ'}</td>
                              <td className="p-3 text-right font-bold text-emerald-800">{formatBnCurrency(inv.amount)}</td>
                              {isAdmin && (
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteInvestmentEntry(partner.id, inv.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="এন্ট্রি মুছুন"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add/Edit Partner Basic Info */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingPartner ? 'অংশীদারের তথ্য সম্পাদন করুন' : 'নতুন অংশীদার যুক্ত করুন'}
              </h3>
              <button onClick={() => setIsPartnerModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePartnerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">অংশীদারের পুরো নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ জাহিদুল ইসলাম"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={partnerForm.phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পদবী বা ব্যবসায়িক ভূমিকা</label>
                <input
                  type="text"
                  placeholder="যেমন: প্রধান পরিচালক"
                  value={partnerForm.role}
                  onChange={(e) => setPartnerForm({ ...partnerForm, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">লভ্যাংশ শেয়ার পার্সেন্টেজ (%)</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: 50"
                  value={partnerForm.sharePercentage}
                  onChange={(e) => setPartnerForm({ ...partnerForm, sharePercentage: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-bold"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Date-wise Investment for a Partner */}
      {isInvestmentModalOpen && selectedPartnerForInvestment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">তারিখ অনুযায়ী নতুন বিনিয়োগ যোগ করুন</h3>
                <p className="text-xs text-emerald-200">অংশীদার: {selectedPartnerForInvestment.name}</p>
              </div>
              <button onClick={() => setIsInvestmentModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvestmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">তারিখ (Date) *</label>
                <input
                  type="date"
                  required
                  value={investmentForm.date}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">বিনিয়োগকৃত টাকার পরিমাণ (টাকা ৳) *</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: 50000"
                  value={investmentForm.amount}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-emerald-500 rounded-xl text-sm font-bold text-emerald-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মন্তব্য বা নোট (Investment Note)</label>
                <input
                  type="text"
                  placeholder="যেমন: ২য় কিস্তি মূলধন জমা"
                  value={investmentForm.note}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, note: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvestmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'জমা হচ্ছে...' : 'বিনিয়োগ নিশ্চিত করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
