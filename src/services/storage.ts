import { CompanyInfo, Staff, Transaction, CustomerDue } from '../types';

const STORAGE_KEYS = {
  COMPANY: 'hk_company_info_v2',
  ADMIN_PIN: 'hk_admin_pin_v2',
  STAFFS: 'hk_staff_list_v2',
  TRANSACTIONS: 'hk_transactions_v2',
  DUES: 'hk_customer_dues_v2',
};

const initialCompany: CompanyInfo = {
  name: 'মেসার্স সততা এন্টারপ্রাইজ',
  subTitle: 'দৈনিক আয়-ব্যয়, ক্যাশ ও কর্মী হিসাব খাতা',
  ownerName: 'মোঃ জাহিদুল ইসলাম',
  phone: '০১৭০০-১২৩৪৫৬',
  email: 'satata.enterprise@gmail.com',
  address: 'দোকান নং- ১২, নিউ মার্কেট রোড, ঢাকা-১২০৫',
  logoUrl: '',
  currencySymbol: '৳'
};

const initialAdminPin = '1234';

const today = new Date().toISOString().substring(0, 10);
const currentYearMonth = today.substring(0, 7);

const initialStaffs: Staff[] = [
  {
    id: 'staff-1',
    name: 'মো: রফিকুল ইসলাম',
    fatherName: 'মরহুম আব্দুল মালেক',
    motherName: 'রাবেয়া খাতুন',
    phone: '01711223344',
    email: 'rafiqul@gmail.com',
    nid: '19922695420000123',
    address: 'বাড়ি নং- ৪৫, রোড- ০৩, মিরপুর-১০, ঢাকা',
    designation: 'হিসাবরক্ষক ও ম্যানেজার',
    salary: 28000,
    joinedAt: '2023-01-15',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    pin: '1122',
    role: 'staff',
    education: 'বি.বি.এস (অ্যাকাউন্টিং), ঢাকা বিশ্ববিদ্যালয়',
    experience: '৫ বছরের খুচরা ও পাইকারি হিসাবরক্ষণের অভিজ্ঞতা',
    emergencyContact: '01811998877 (ভাই)',
    bloodGroup: 'B+',
    status: 'active'
  },
  {
    id: 'staff-2',
    name: 'তানভীর আহমেদ',
    fatherName: 'মো: জহিরুল হক',
    motherName: 'রেহানা পারভীন',
    phone: '01855667788',
    email: 'tanvir.sales@gmail.com',
    nid: '19982612345000456',
    address: 'ব্লক- বি, বনশ্রী, রামপুরা, ঢাকা',
    designation: 'সেলস অফিসার',
    salary: 18000,
    joinedAt: '2023-08-01',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    pin: '3344',
    role: 'staff',
    education: 'এইচ.এস.সি (ব্যবসায় শিক্ষা), ঢাকা কলেজ',
    experience: '২ বছরের শোরুম বিক্রয় ও কাস্টমার সার্ভিস',
    emergencyContact: '01922334455 (পিতা)',
    bloodGroup: 'O+',
    status: 'active'
  }
];

const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    date: today,
    title: 'দৈনিক কাউন্টার ক্যাশ বিক্রয়',
    category: 'পণ্য বিক্রয়',
    amount: 38500,
    paymentMethod: 'cash',
    addedBy: 'তানভীর আহমেদ',
    addedById: 'staff-2',
    note: 'সকাল ও বিকালের মোট ক্যাশ বিক্রয়',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-2',
    type: 'income',
    date: today,
    title: 'বিকাশ অনলাইন পেমেন্ট প্রাপ্তি',
    category: 'পণ্য বিক্রয়',
    amount: 14200,
    paymentMethod: 'bkash',
    addedBy: 'মো: রফিকুল ইসলাম',
    addedById: 'staff-1',
    note: 'অর্ডার নং #৪৫২ ও #৪৫৩ এর পেমেন্ট',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-3',
    type: 'expense',
    date: today,
    title: 'নতুন মালামাল পরিবহন ও রিকশা ভাড়া',
    category: 'যাতায়াত ও ডেলিভারি খরচ',
    amount: 1850,
    paymentMethod: 'cash',
    addedBy: 'মো: রফিকুল ইসলাম',
    addedById: 'staff-1',
    note: 'সদরঘাট থেকে মালামাল আনার খরচ',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-4',
    type: 'expense',
    date: today,
    title: 'স্টাফ দুপুরের খাবার ও বিকেলের চা-নাস্তা',
    category: 'আপ্যায়ন ও নাস্তা খরচ',
    amount: 720,
    paymentMethod: 'cash',
    addedBy: 'তানভীর আহমেদ',
    addedById: 'staff-2',
    note: 'কর্মচারী ও কাস্টমার আপ্যায়ন',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-5',
    type: 'income',
    date: `${currentYearMonth}-01`,
    title: 'মাসিক মূলধন বিনিয়োগ / প্রারম্ভিক ক্যাশ',
    category: 'ক্যাশ ডিপোজিট / বিনিয়োগ',
    amount: 50000,
    paymentMethod: 'bank',
    addedBy: 'প্রধান এডমিন',
    note: 'চলতি মাসের প্রাথমিক ফান্ডিং',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tx-6',
    type: 'expense',
    date: `${currentYearMonth}-02`,
    title: 'দোকান ভাড়া পরিশোধ (চলতি মাস)',
    category: 'দোকান / অফিস ভাড়া',
    amount: 25000,
    paymentMethod: 'bank',
    addedBy: 'প্রধান এডমিন',
    note: 'বাড়িওয়ালা মোহাম্মদ করিমকে ব্যাংক চেক প্রদান',
    createdAt: new Date().toISOString()
  }
];

const initialDues: CustomerDue[] = [
  {
    id: 'due-1',
    customerName: 'মেসার্স ভাই ভাই স্টোর (কামাল ভাই)',
    phone: '01712334455',
    address: 'চকবাজার, ঢাকা',
    totalDue: 15000,
    paidAmount: 8000,
    remainingDue: 7000,
    lastUpdated: today,
    notes: 'চালান নং ৭৮৬ - পরবর্তী সপ্তাহে পরিশোধ করবে',
    history: [
      { date: `${currentYearMonth}-01`, amount: 15000, type: 'due', note: 'নতুন বাকিতে পণ্য ক্রয়' },
      { date: today, amount: 8000, type: 'payment', note: 'নগদ জমা দেওয়া হয়েছে' }
    ]
  },
  {
    id: 'due-2',
    customerName: 'আল-মদিনা লাইব্রেরি ও স্টেশনারি',
    phone: '01899112233',
    address: 'নীলক্ষেত, ঢাকা',
    totalDue: 9500,
    paidAmount: 3000,
    remainingDue: 6500,
    lastUpdated: today,
    notes: 'বকেয়া বিল',
    history: [
      { date: `${currentYearMonth}-03`, amount: 9500, type: 'due', note: 'বাকি ক্রয় চালান' },
      { date: today, amount: 3000, type: 'payment', note: 'বিকাশ মাধ্যমে পরিশোধ' }
    ]
  }
];

// Helper to safely read from localStorage
function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

// Helper to safely write to localStorage
function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to write to localStorage for key: ${key}`, err);
  }
}

export const StorageService = {
  getCompanyInfo(): CompanyInfo {
    return readStorage<CompanyInfo>(STORAGE_KEYS.COMPANY, initialCompany);
  },
  saveCompanyInfo(info: CompanyInfo): void {
    writeStorage(STORAGE_KEYS.COMPANY, info);
  },

  getAdminPin(): string {
    return readStorage<string>(STORAGE_KEYS.ADMIN_PIN, initialAdminPin);
  },
  saveAdminPin(pin: string): void {
    writeStorage(STORAGE_KEYS.ADMIN_PIN, pin);
  },

  getStaffs(): Staff[] {
    return readStorage<Staff[]>(STORAGE_KEYS.STAFFS, initialStaffs);
  },
  saveStaffs(staffs: Staff[]): void {
    writeStorage(STORAGE_KEYS.STAFFS, staffs);
  },

  getTransactions(): Transaction[] {
    return readStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
  },
  saveTransactions(transactions: Transaction[]): void {
    writeStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  getDues(): CustomerDue[] {
    return readStorage<CustomerDue[]>(STORAGE_KEYS.DUES, initialDues);
  },
  saveDues(dues: CustomerDue[]): void {
    writeStorage(STORAGE_KEYS.DUES, dues);
  },

  exportFullBackup(): string {
    const backup = {
      company: this.getCompanyInfo(),
      staffs: this.getStaffs(),
      transactions: this.getTransactions(),
      dues: this.getDues(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.company) this.saveCompanyInfo(data.company);
      if (data.staffs && Array.isArray(data.staffs)) this.saveStaffs(data.staffs);
      if (data.transactions && Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
      if (data.dues && Array.isArray(data.dues)) this.saveDues(data.dues);
      return true;
    } catch (e) {
      console.error('Backup restore error:', e);
      return false;
    }
  },

  resetToDefault(): void {
    writeStorage(STORAGE_KEYS.COMPANY, initialCompany);
    writeStorage(STORAGE_KEYS.ADMIN_PIN, initialAdminPin);
    writeStorage(STORAGE_KEYS.STAFFS, initialStaffs);
    writeStorage(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
    writeStorage(STORAGE_KEYS.DUES, initialDues);
  }
};
