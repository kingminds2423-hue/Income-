import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive এক্সেস টোকেন পাওয়া যায়নি');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    console.error('Google Drive sign in error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogleDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Upload JSON database backup to Google Drive
export const uploadBackupToGoogleDrive = async (fileName: string, backupData: any): Promise<any> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  const metadata = {
    name: fileName,
    mimeType: 'application/json'
  };

  const fileContent = JSON.stringify(backupData, null, 2);
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`গুগল ড্রাইভে আপলোড ব্যর্থ হয়েছে: ${errText}`);
  }

  return res.json();
};

// List backup files from Google Drive
export const listDriveBackups = async (): Promise<any[]> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  const query = encodeURIComponent("name contains 'hisab_khata' and trashed = false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=10`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('গুগল ড্রাইভ ফাইল তালিকা লোড করতে ব্যর্থ হয়েছে');
  }

  const data = await res.json();
  return data.files || [];
};

// Download backup file content from Google Drive
export const downloadDriveBackupFile = async (fileId: string): Promise<any> => {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('গুগল ড্রাইভে সাইন ইন করা নেই');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error('গুগল ড্রাইভ ফাইল ডাউনলোড করতে ব্যর্থ হয়েছে');
  }

  return res.json();
};
