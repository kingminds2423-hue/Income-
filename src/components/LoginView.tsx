import React, { useState } from 'react';
import { CompanyInfo, Staff } from '../types.ts';
import { api } from '../services/api.ts';
import { 
  Building2, 
  Wallet, 
  Lock, 
  User, 
  Phone, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Briefcase
} from 'lucide-react';

interface LoginViewProps {
  company: CompanyInfo;
  adminPhone: string;
  adminPin: string;
  staffs: Staff[];
  onLoginSuccess: (user: { name: string; role: 'admin' | 'staff'; id?: string; phone?: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  company,
  adminPhone,
  adminPin,
  staffs,
  onLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>('admin');
  const [phone, setPhone] = useState('admin');
  const [pin, setPin] = useState(adminPin || '1234');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.login(phone.trim(), pin.trim());
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'মোবাইল নম্বর বা ৪ ডিজিট পিন সঠিক নয়!');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (type: 'admin' | 'staff1' | 'staff2') => {
    if (type === 'admin') {
      setActiveTab('admin');
      setPhone('admin');
      setPin(adminPin || '1234');
    } else if (type === 'staff1' && staffs[0]) {
      setActiveTab('staff');
      setPhone(staffs[0].phone);
      setPin(staffs[0].pin);
    } else if (type === 'staff2' && staffs[1]) {
      setActiveTab('staff');
      setPhone(staffs[1].phone);
      setPin(staffs[1].pin);
    }
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-700/50">
        
        {/* Header with Company Logo & Name */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-7 text-white text-center relative">
          
          {company.logoUrl ? (
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-emerald-400 p-1">
              <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-4 border-emerald-400">
              <Wallet className="w-10 h-10 text-emerald-700" />
            </div>
          )}

          <h1 className="text-2xl font-black tracking-tight">{company.name || 'হিসাব খাতা'}</h1>
          <p className="text-emerald-100 text-xs mt-1">{company.subTitle || 'দৈনিক আয়-ব্যয় ও কেন্দ্রীয় স্টাফ মনিটরিং'}</p>
          
          {company.ownerName && (
            <div className="inline-flex items-center gap-1 bg-emerald-950/60 text-emerald-300 text-[11px] font-semibold px-3 py-1 rounded-full mt-2 border border-emerald-700/60">
              <Briefcase className="w-3 h-3 text-emerald-400" />
              <span>ব্যবসা পরিচালক: {company.ownerName}</span>
            </div>
          )}
        </div>

        {/* Tab Switcher: Admin vs Staff */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setPhone('admin');
              setPin(adminPin || '1234');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>এডমিন (মালিক) লগইন</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              if (staffs[0]) {
                setPhone(staffs[0].phone);
                setPin(staffs[0].pin);
              } else {
                setPhone('');
                setPin('');
              }
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'staff'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-emerald-700" />
            <span>স্টাফ লগইন</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {activeTab === 'admin' ? 'এডমিন আইডি বা মোবাইল নম্বর' : 'নিয়োগকৃত স্টাফের মোবাইল নম্বর *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'admin' ? 'admin অথবা মোবাইল' : '017XXXXXXXX'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              {activeTab === 'staff' && (
                <span className="text-[11px] text-slate-500 mt-1 block">
                  মালিক আপনাকে যে মোবাইল নম্বরে নিয়োগ দিয়েছেন সেটি লিখুন।
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ৪ ডিজিটের সিকিউরিটি পিন (PIN) *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  maxLength={8}
                  placeholder="৪ ডিজিট গোপন পিন"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 tracking-widest"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              <span>{loading ? 'লগইন হচ্ছে...' : 'সফটওয়্যারে প্রবেশ করুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-2 uppercase tracking-wider text-center">
              এক ক্লিকে ডেমো পরীক্ষা করুন:
            </span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleSelectDemo('admin')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 p-2 rounded-lg font-bold text-center transition"
              >
                এডমিন (মালিক)
                <span className="block text-[10px] text-emerald-700 font-normal">পিন: 1234</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('staff1')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 p-2 rounded-lg font-bold text-center transition truncate"
              >
                স্টাফ ১ (তানভীর)
                <span className="block text-[10px] text-slate-600 font-normal">পিন: 1122</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemo('staff2')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 p-2 rounded-lg font-bold text-center transition truncate"
              >
                স্টাফ ২ (শাকিল)
                <span className="block text-[10px] text-slate-600 font-normal">পিন: 2233</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
