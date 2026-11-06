import { CompanyInfo, Staff, Transaction, CustomerDue } from '../types.ts';

export interface AppStateResponse {
  company: CompanyInfo;
  adminPin: string;
  adminPhone: string;
  staffs: Staff[];
  transactions: Transaction[];
  customerDues: CustomerDue[];
}

export const api = {
  async getState(): Promise<AppStateResponse> {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('ডাটা লোড করতে ব্যর্থ হয়েছে');
    return res.json();
  },

  async login(phone: string, pin: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'লগইন ব্যর্থ হয়েছে');
    return data;
  },

  async changeAdminPin(oldPin: string, newPin: string) {
    const res = await fetch('/api/auth/change-admin-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPin, newPin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'পিন পরিবর্তন করতে সমস্যা হয়েছে');
    return data;
  },

  async updateCompany(companyData: Partial<CompanyInfo>) {
    const res = await fetch('/api/settings/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'কোম্পানি তথ্য আপডেট করা যায়নি');
    return data;
  },

  async addStaff(staffData: Partial<Staff>) {
    const res = await fetch('/api/staffs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'স্টাফ নিয়োগে সমস্যা হয়েছে');
    return data;
  },

  async updateStaff(id: string, staffData: Partial<Staff>) {
    const res = await fetch(`/api/staffs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'স্টাফ তথ্য আপডেট করা যায়নি');
    return data;
  },

  async deleteStaff(id: string) {
    const res = await fetch(`/api/staffs/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'স্টাফ মুছে ফেলা যায়নি');
    return data;
  },

  async addTransaction(txData: {
    type: 'income' | 'expense';
    date: string;
    title: string;
    category: string;
    amount: number;
    paymentMethod: string;
    addedBy: string;
    addedById?: string;
    note?: string;
  }) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'লেনদেন যোগ করা যায়নি');
    return data;
  },

  async deleteTransaction(id: string) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'লেনদেন মুছে ফেলা যায়নি');
    return data;
  },

  async addCustomerDue(customerName: string, phone: string, address: string, initialDue: number, notes: string) {
    const res = await fetch('/api/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'new_customer',
        customerName,
        phone,
        address,
        initialDue,
        notes
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'বাকি হিসাব যোগ করা যায়নি');
    return data;
  },

  async addDuePayment(dueId: string, amount: number, type: 'due' | 'payment', note: string) {
    const res = await fetch('/api/dues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_entry',
        dueId,
        amount,
        type,
        note
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'বাকি আপডেট করা যায়নি');
    return data;
  },

  async deleteCustomerDue(id: string) {
    const res = await fetch(`/api/dues/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'বাকি রেকর্ড মুছে ফেলা যায়নি');
    return data;
  },

  async exportDatabase() {
    const res = await fetch('/api/backup/export');
    if (!res.ok) throw new Error('ডাটাবেজ এক্সপোর্ট করতে ব্যর্থ হয়েছে');
    return res.json();
  },

  async importDatabase(backupData: any) {
    const res = await fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'ডাটাবেজ রিস্টোর করা যায়নি');
    return data;
  },

  async getPartners() {
    const res = await fetch('/api/partners');
    if (!res.ok) throw new Error('অংশীদারদের তথ্য লোড করতে ব্যর্থ হয়েছে');
    return res.json();
  },

  async savePartners(partners: any[]) {
    const res = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partners })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'অংশীদারদের তথ্য সংরক্ষণ করা যায়নি');
    return data;
  }
};
