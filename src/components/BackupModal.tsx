import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { formatBnNumber } from '../utils/bengali.ts';
import { 
  Database, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  Loader2,
  ShieldAlert,
  HardDriveDownload,
  RotateCcw,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut
} from 'lucide-react';
import { 
  initDriveAuth, 
  signInWithGoogleDrive, 
  uploadBackupToGoogleDrive, 
  listDriveBackups, 
  downloadDriveBackupFile, 
  logoutGoogleDrive 
} from '../services/googleDrive.ts';
import { User } from 'firebase/auth';

interface BackupModalProps {
  onRefresh: () => Promise<void>;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onRefresh, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google Drive States
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [isDriveAuthed, setIsDriveAuthed] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user) => {
        setDriveUser(user);
        setIsDriveAuthed(true);
        loadDriveFilesList();
      },
      () => {
        setDriveUser(null);
        setIsDriveAuthed(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDriveLogin = async () => {
    setDriveLoading(true);
    setFeedback(null);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setDriveUser(res.user);
        setIsDriveAuthed(true);
        setFeedback({ type: 'success', text: 'গুগল ড্রাইভে সফলভাবে সংযোগ স্থাপন হয়েছে!' });
        loadDriveFilesList();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'গুগল ড্রাইভে লগইন ব্যর্থ হয়েছে।' });
    } finally {
      setDriveLoading(false);
    }
  };

  const loadDriveFilesList = async () => {
    try {
      const files = await listDriveBackups();
      setDriveFiles(files);
    } catch (err) {
      console.error('Failed to load drive backups:', err);
    }
  };

  const handleDriveUpload = async () => {
    setDriveLoading(true);
    setFeedback(null);
    try {
      const dbData = await api.exportDatabase();
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `hisab_khata_backup_${dateStr}.json`;
      await uploadBackupToGoogleDrive(fileName, dbData);
      setFeedback({ type: 'success', text: 'সফলভাবে গুগল ড্রাইভে ব্যাকআপ ফাইল আপলোড করা হয়েছে!' });
      loadDriveFilesList();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'গুগল ড্রাইভে আপলোড ব্যর্থ হয়েছে।' });
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveRestore = async (fileId: string, fileName: string) => {
    if (!window.confirm(`আপনি কি "${fileName}" ফাইলটি থেকে ডাটাবেজ রিস্টোর করতে চান?`)) return;
    setDriveLoading(true);
    setFeedback(null);
    try {
      const backupJson = await downloadDriveBackupFile(fileId);
      const res = await api.importDatabase(backupJson);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `গুগল ড্রাইভ থেকে সফলভাবে রিস্টোর হয়েছে! (${formatBnNumber(res.stats?.transactionsCount || 0)} টি লেনদেন)`
        });
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'গুগল ড্রাইভ থেকে রিস্টোর ব্যর্থ হয়েছে।' });
    } finally {
      setDriveLoading(false);
    }
  };

  // 1. Export Entire Database to Local JSON File
  const handleExport = async () => {
    setDownloading(true);
    setFeedback(null);
    try {
      const data = await api.exportDatabase();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().substring(0, 10);
      a.href = url;
      a.download = `hisab_khata_full_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', text: 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'ব্যাকআপ এক্সপোর্ট করতে সমস্যা হয়েছে।' });
    } finally {
      setDownloading(false);
    }
  };

  // 2. Handle File Selection for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFeedback(null);
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setFeedback({ type: 'error', text: 'দয়া করে একটি সঠিক .json ব্যাকআপ ফাইল নির্বাচন করুন।' });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.staffs && !json.transactions && !json.company) {
          throw new Error('অকার্যকর ফাইল ফরম্যাট!');
        }
        setParsedData(json);
      } catch (err) {
        setFeedback({ type: 'error', text: 'ফাইলের ভেতরের তথ্য সঠিক JSON ফরম্যাটে নেই।' });
        setSelectedFile(null);
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  // 3. Confirm Local Import & Restore
  const handleConfirmImport = async () => {
    if (!parsedData) return;
    setImporting(true);
    setFeedback(null);

    try {
      const res = await api.importDatabase(parsedData);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `ডাটাবেজ সফলভাবে রিস্টোর হয়েছে! (${formatBnNumber(res.stats?.transactionsCount || 0)} টি লেনদেন, ${formatBnNumber(res.stats?.staffsCount || 0)} জন স্টাফ)`
        });
        setSelectedFile(null);
        setParsedData(null);
        await onRefresh();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'ডাটাবেজ রিস্টোর করা সম্ভব হয়নি।' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="font-bold text-base sm:text-lg">ডাটাবেজ ব্যাকআপ ও রিস্টোর (লোকাল ও গুগল ড্রাইভ)</h2>
              <p className="text-xs text-emerald-200">নিরাপদ হিসাব সংরক্ষণ ও গুগল ড্রাইভ সিঙ্ক</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-full hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'local'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>লোকাল ব্যাকআপ (Device Backup)</span>
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'drive'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-blue-600" />
            <span>গুগল ড্রাইভ সিঙ্ক (Google Drive)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Feedback Message */}
          {feedback && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* TAB 1: LOCAL BACKUP & RESTORE */}
          {activeTab === 'local' && (
            <div className="space-y-6">
              {/* Section 1: Export Database */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <HardDriveDownload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-slate-900">সম্পূর্ণ ডাটাবেজ ব্যাকআপ ডাউনলোড (Export)</h3>
                    <p className="text-xs text-slate-500">
                      সকল আয়-ব্যয় লেনদেন, স্টাফ তালিকা, বাকি খাতা ও প্রতিষ্ঠানের সেটিং একটি নিরাপদ .json ফাইলে ডাউনলোড করুন।
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExport}
                  disabled={downloading}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-60"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ব্যাকআপ ফাইল প্রস্তুত হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>এখনই JSON ব্যাকআপ ডাউনলোড করুন</span>
                    </>
                  )}
                </button>
              </div>

              {/* Section 2: Import & Restore Database */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-slate-900">ব্যাকআপ ফাইল থেকে রিস্টোর (Import)</h3>
                    <p className="text-xs text-slate-500">
                      পূর্বে ডাউনলোড করা ব্যাকআপ .json ফাইল সিলেক্ট করে পূর্বের সকল হিসাব ও স্টাফ পুনরুদ্ধার করুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white p-3 rounded-xl cursor-pointer transition text-center flex flex-col items-center justify-center">
                    <FileJson className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedFile ? selectedFile.name : '.json ব্যাকআপ ফাইল সিলেক্ট করুন'}
                    </span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {parsedData && (
                  <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs text-slate-800 space-y-2">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-700" />
                      <span>নির্বাচিত ফাইলের বিবরণ:</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 font-medium">
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <span className="text-[10px] text-slate-400 block">লেনদেন</span>
                        <strong className="text-slate-900 text-sm">{formatBnNumber(parsedData.transactions?.length || 0)} টি</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <span className="text-[10px] text-slate-400 block">স্টাফ</span>
                        <strong className="text-slate-900 text-sm">{formatBnNumber(parsedData.staffs?.length || 0)} জন</strong>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-amber-100">
                        <span className="text-[10px] text-slate-400 block">বাকি খাতা</span>
                        <strong className="text-slate-900 text-sm">{formatBnNumber(parsedData.customerDues?.length || 0)} টি</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={importing}
                      className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-60"
                    >
                      {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>ডাটাবেজ রিস্টোর নিশ্চিত করুন</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE BACKUP & SYNC */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {!isDriveAuthed ? (
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">গুগল ড্রাইভে কানেক্ট করুন</h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      আপনার গুগল অ্যাকাউন্টের মাধ্যমে গুগল ড্রাইভে সরাসরি হিসাবের ব্যাকআপ ফাইল সংরক্ষণ করুন এবং যেকোনো জায়গা থেকে রিস্টোর করুন।
                    </p>
                  </div>

                  <button
                    onClick={handleDriveLogin}
                    disabled={driveLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 mx-auto disabled:opacity-60"
                  >
                    {driveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>কানেক্ট হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-4 h-4" />
                        <span>Sign in with Google Drive</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User info & Logout */}
                  <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {driveUser?.photoURL ? (
                        <img src={driveUser.photoURL} alt="User" className="w-10 h-10 rounded-full border border-blue-300" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {driveUser?.displayName?.substring(0, 1) || 'U'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{driveUser?.displayName || 'ব্যবহারকারী'}</h4>
                        <p className="text-xs text-blue-700">{driveUser?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await logoutGoogleDrive();
                        setIsDriveAuthed(false);
                      }}
                      className="p-2 bg-white text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold border border-red-200 flex items-center gap-1 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ডিসকানেক্ট</span>
                    </button>
                  </div>

                  {/* Upload Backup to Drive Button */}
                  <button
                    onClick={handleDriveUpload}
                    disabled={driveLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-60"
                  >
                    {driveLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>গুগল ড্রাইভে আপলোড হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-5 h-5" />
                        <span>বর্তমান ডাটাবেজ গুগল ড্রাইভে ব্যাকআপ করুন</span>
                      </>
                    )}
                  </button>

                  {/* List Drive Backups */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">গুগল ড্রাইভে সংরক্ষিত ব্যাকআপ ফাইলসমূহ</h4>
                      <button 
                        onClick={loadDriveFilesList} 
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        রিফ্রেশ
                      </button>
                    </div>

                    {driveFiles.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4 bg-white rounded-lg border border-slate-200">
                        কোনো ব্যাকআপ ফাইল পাওয়া যায়নি। উপরে ব্যাকআপ করুন ক্লিক করুন।
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {driveFiles.map((file) => (
                          <div 
                            key={file.id} 
                            className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-blue-300 transition"
                          >
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(file.createdTime).toLocaleString('bn-BD')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDriveRestore(file.id, file.name)}
                              disabled={driveLoading}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition"
                            >
                              <CloudDownload className="w-3.5 h-3.5" />
                              <span>রিস্টোর</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              বন্ধ করুন
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
