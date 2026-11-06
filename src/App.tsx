import React, { useState, useEffect, useCallback } from 'react';
import { CompanyInfo, Staff, Transaction, CustomerDue } from './types.ts';
import { api, AppStateResponse } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { StaffListView } from './components/StaffListView.tsx';
import { AddStaffView } from './components/AddStaffView.tsx';
import { StaffCvModal } from './components/StaffCvModal.tsx';
import { DueKhataView } from './components/DueKhataView.tsx';
import { CompanyModal } from './components/CompanyModal.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { PrintReportModal } from './components/PrintReportModal.tsx';
import { BackupModal } from './components/BackupModal.tsx';
import { PartnersInvestmentView } from './components/PartnersInvestmentView.tsx';
import { Loader2 } from 'lucide-react';

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: 'admin' | 'manager' | 'cashier' | 'viewer' | 'staff';
    id?: string;
    phone?: string;
  } | null>(null);

  // Business Data States
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'DIP BHOLA NETWORK',
    subTitle: 'দৈনিক আয়-ব্যয় ও কেন্দ্রীয় স্টাফ মনিটরিং সিস্টেম',
    ownerName: 'জাহিদুল ইসলাম',
    phone: '01712-345678',
    email: 'zahidulislam53330@gmail.com',
    address: 'ভোলা, বাংলাদেশ',
    logoUrl: '/dip-bhola-logo.svg',
    currencySymbol: '৳'
  });

  const [adminPin, setAdminPin] = useState<string>('1234');
  const [adminPhone, setAdminPhone] = useState<string>('01700000000');
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customerDues, setCustomerDues] = useState<CustomerDue[]>([]);

  // Navigation & Modal States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'add-staff' | 'dues' | 'partners'>('dashboard');
  const [selectedStaffCv, setSelectedStaffCv] = useState<Staff | null>(null);
  const [isEditingCompany, setIsEditingCompany] = useState<boolean>(false);
  const [isChangingAdminPin, setIsChangingAdminPin] = useState<boolean>(false);
  const [isOpenPrintReport, setIsOpenPrintReport] = useState<boolean>(false);
  const [isOpenBackupModal, setIsOpenBackupModal] = useState<boolean>(false);

  // Month Filter (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Load App State from Server API
  const refreshState = useCallback(async () => {
    try {
      const data: AppStateResponse = await api.getState();
      if (data) {
        setCompanyInfo(data.company);
        setAdminPin(data.adminPin);
        setAdminPhone(data.adminPhone);
        setStaffs(data.staffs);
        setTransactions(data.transactions);
        setCustomerDues(data.customerDues || []);
      }
    } catch (err) {
      console.error('Failed to sync app state:', err);
    }
  }, []);

  // Initial Load & Real-Time Polling for Remote Sync (Every 3.5 seconds)
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await refreshState();
      if (mounted) setInitialLoading(false);
    };
    init();

    // Background live polling so owner sitting far away sees staff entries in real time!
    const interval = setInterval(() => {
      refreshState();
    }, 3500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshState]);

  // Handle Login
  const handleLoginSuccess = (user: { name: string; role: 'admin' | 'staff'; id?: string; phone?: string }) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Handle Staff PIN update (Admin)
  const handleUpdateStaffPin = async (staffId: string, newPin: string) => {
    try {
      await api.updateStaff(staffId, { pin: newPin });
      await refreshState();
    } catch (err: any) {
      alert(err.message || 'পিন আপডেট করা যায়নি');
    }
  };

  // Handle Staff Delete (Admin)
  const handleDeleteStaff = async (staffId: string) => {
    try {
      await api.deleteStaff(staffId);
      await refreshState();
    } catch (err: any) {
      alert(err.message || 'মুছে ফেলা যায়নি');
    }
  };

  // Handle Save Company Info
  const handleSaveCompany = async (updated: CompanyInfo) => {
    await api.updateCompany(updated);
    setCompanyInfo(updated);
  };

  // Handle Save Admin PIN
  const handleSaveAdminPin = async (oldPin: string, newPin: string) => {
    const res = await api.changeAdminPin(oldPin, newPin);
    if (res.success) {
      setAdminPin(newPin);
    }
    return res;
  };

  // Initial loading indicator
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-3" />
        <h2 className="text-lg font-bold">হিসাব খাতা সফটওয়্যার লোড হচ্ছে...</h2>
        <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন</p>
      </div>
    );
  }

  // If Not Logged In, Show Login View
  if (!currentUser) {
    return (
      <LoginView
        company={companyInfo}
        adminPhone={adminPhone}
        adminPin={adminPin}
        staffs={staffs}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const isAdmin = currentUser.role === 'admin';
  const isManager = isAdmin || currentUser.role === 'manager';
  const isCashier = isManager || currentUser.role === 'cashier';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        company={companyInfo}
        currentUser={currentUser}
        isAdmin={isAdmin}
        isManager={isManager}
        isCashier={isCashier}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenCompanySetup={() => isAdmin && setIsEditingCompany(true)}
        onOpenChangeAdminPin={() => isAdmin && setIsChangingAdminPin(true)}
        onOpenPrintReport={() => isManager && setIsOpenPrintReport(true)}
        onOpenBackupModal={() => isAdmin && setIsOpenBackupModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Daily Accounts & Remote Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            staffs={staffs}
            company={companyInfo}
            currentUser={currentUser}
            isAdmin={isAdmin}
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
            onRefresh={refreshState}
            onOpenPrintReport={() => isManager && setIsOpenPrintReport(true)}
          />
        )}

        {/* Tab 2: Staffs & CV Viewer (Manager & Admin) */}
        {isManager && activeTab === 'staff' && (
          <StaffListView
            staffs={staffs}
            company={companyInfo}
            isAdmin={isAdmin}
            onOpenCv={(staff) => setSelectedStaffCv(staff)}
            onAddNewStaff={() => setActiveTab('add-staff')}
            onUpdateStaffPin={handleUpdateStaffPin}
            onDeleteStaff={handleDeleteStaff}
          />
        )}

        {/* Tab 3: Recruit New Staff (Admin Only) */}
        {isAdmin && activeTab === 'add-staff' && (
          <AddStaffView
            onSuccess={() => {
              refreshState();
              setActiveTab('staff');
            }}
            onCancel={() => setActiveTab('staff')}
          />
        )}

        {/* Tab 4: Customer Dues & Payment Ledger (Cashier, Manager, Admin) */}
        {isCashier && activeTab === 'dues' && (
          <DueKhataView
            customerDues={customerDues}
            isAdmin={isAdmin}
            onRefresh={refreshState}
          />
        )}

        {/* Tab 5: Partners & Investment Dashboard (Manager & Admin) */}
        {isManager && activeTab === 'partners' && (
          <PartnersInvestmentView
            company={companyInfo}
            onRefresh={refreshState}
            isAdmin={isAdmin}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 no-print">
        <p>
          © 2026 {companyInfo.name || 'DIP BHOLA NETWORK'} | {companyInfo.ownerName ? `ব্যবসা পরিচালক: ${companyInfo.ownerName} | ` : ''} 
          স্বত্বাধিকার সংরক্ষিত।
        </p>
      </footer>

      {/* MODAL 1: Full Staff CV & Bio-data Print (Director Only) */}
      {isAdmin && selectedStaffCv && (
        <StaffCvModal
          staff={selectedStaffCv}
          company={companyInfo}
          onClose={() => setSelectedStaffCv(null)}
        />
      )}

      {/* MODAL 2: Company Setup & Logo Upload (Director Only) */}
      {isAdmin && isEditingCompany && (
        <CompanyModal
          company={companyInfo}
          onSave={handleSaveCompany}
          onClose={() => setIsEditingCompany(false)}
        />
      )}

      {/* MODAL 3: Admin PIN Change (Director Only) */}
      {isAdmin && isChangingAdminPin && (
        <AdminPinModal
          onSavePin={handleSaveAdminPin}
          onClose={() => setIsChangingAdminPin(false)}
        />
      )}

      {/* MODAL 4: Monthly Statement Print & Direct PDF Download (Director Only) */}
      {isAdmin && isOpenPrintReport && (
        <PrintReportModal
          transactions={transactions}
          company={companyInfo}
          selectedMonth={selectedMonth}
          onClose={() => setIsOpenPrintReport(false)}
        />
      )}

      {/* MODAL 5: Database Backup & Restore (Director Only) */}
      {isAdmin && isOpenBackupModal && (
        <BackupModal
          onRefresh={refreshState}
          onClose={() => setIsOpenBackupModal(false)}
        />
      )}

    </div>
  );
}
