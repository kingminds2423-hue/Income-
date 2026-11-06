import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { getDatabase, saveDatabase } from './src/server/storage.ts';

function hisabKhataApiPlugin(): Plugin {
  return {
    name: 'hisab-khata-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const parseBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const sendJson = (data: any, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const pathname = url.pathname;
          const method = req.method;

          // 1. GET Full State
          if (pathname === '/api/state' && method === 'GET') {
            const db = getDatabase();
            return sendJson({
              company: db.company,
              adminPin: db.adminAuth.pin,
              adminPhone: db.adminAuth.phone,
              staffs: db.staffs,
              transactions: db.transactions,
              customerDues: db.customerDues
            });
          }

          // 2. Auth Login
          if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await parseBody();
            const { phone, pin } = body;
            const db = getDatabase();

            // Admin check
            if (
              (phone === 'admin' || phone === db.adminAuth.phone || phone === '01700000000') &&
              String(pin) === String(db.adminAuth.pin)
            ) {
              return sendJson({
                success: true,
                role: 'admin',
                user: {
                  name: db.company.ownerName ? `${db.company.ownerName} (পরিচালক)` : 'জাহিদুল ইসলাম (পরিচালক)',
                  role: 'admin',
                  phone: db.adminAuth.phone
                }
              });
            }

            // Staff check
            const staff = db.staffs.find(
              (s) =>
                (s.phone === phone || s.email === phone) &&
                String(s.pin) === String(pin) &&
                s.status !== 'inactive'
            );

            if (staff) {
              return sendJson({
                success: true,
                role: 'staff',
                user: staff
              });
            }

            return sendJson({ success: false, message: 'মোবাইল নম্বর বা ৪ ডিজিট পিন সঠিক নয়!' }, 401);
          }

          // 3. Admin PIN Change
          if (pathname === '/api/auth/change-admin-pin' && method === 'POST') {
            const body = await parseBody();
            const { oldPin, newPin } = body;
            const db = getDatabase();

            if (String(db.adminAuth.pin) !== String(oldPin)) {
              return sendJson({ success: false, message: 'বর্তমান এডমিন পিন সঠিক নয়!' }, 400);
            }

            if (!newPin || String(newPin).length < 4) {
              return sendJson({ success: false, message: 'নতুন পিন কমপক্ষে ৪ ডিজিটের হতে হবে!' }, 400);
            }

            db.adminAuth.pin = String(newPin);
            saveDatabase(db);
            return sendJson({ success: true, message: 'এডমিন পিন সফলভাবে পরিবর্তন করা হয়েছে!' });
          }

          // 4. Update Company Settings
          if (pathname === '/api/settings/company' && method === 'POST') {
            const body = await parseBody();
            const db = getDatabase();
            db.company = { ...db.company, ...body };
            saveDatabase(db);
            return sendJson({ success: true, company: db.company });
          }

          // 4.1 Partners API
          if (pathname === '/api/partners' && method === 'GET') {
            const db = getDatabase();
            return sendJson({ success: true, partners: db.company.partners || [] });
          }

          if (pathname === '/api/partners' && method === 'POST') {
            const body = await parseBody();
            const db = getDatabase();
            db.company.partners = Array.isArray(body.partners) ? body.partners : db.company.partners;
            saveDatabase(db);
            return sendJson({ success: true, partners: db.company.partners });
          }

          // 5. Add New Staff
          if (pathname === '/api/staffs' && method === 'POST') {
            const body = await parseBody();
            const db = getDatabase();

            if (!body.name || !body.phone || !body.pin) {
              return sendJson({ success: false, message: 'নাম, মোবাইল নম্বর ও পিন আবশ্যক!' }, 400);
            }

            const existing = db.staffs.find((s) => s.phone === body.phone);
            if (existing) {
              return sendJson({ success: false, message: 'এই মোবাইল নম্বরে ইতিমধ্যে একজন স্টাফ নিবন্ধিত আছে!' }, 400);
            }

            const newStaff = {
              id: 'staff-' + Date.now(),
              name: body.name,
              fatherName: body.fatherName || '',
              motherName: body.motherName || '',
              phone: body.phone,
              email: body.email || '',
              nid: body.nid || '',
              address: body.address || '',
              designation: body.designation || 'স্টাফ',
              salary: Number(body.salary) || 0,
              joinedAt: body.joinedAt || new Date().toISOString().substring(0, 10),
              photoUrl:
                body.photoUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(body.name)}`,
              pin: String(body.pin),
              role: body.role || 'cashier',
              education: body.education || '',
              emergencyContact: body.emergencyContact || '',
              bloodGroup: body.bloodGroup || '',
              status: 'active' as const
            };

            db.staffs.unshift(newStaff);
            saveDatabase(db);
            return sendJson({ success: true, staff: newStaff });
          }

          // 6. Update Staff
          if (pathname.startsWith('/api/staffs/') && method === 'PUT') {
            const staffId = pathname.replace('/api/staffs/', '');
            const body = await parseBody();
            const db = getDatabase();

            const idx = db.staffs.findIndex((s) => s.id === staffId);
            if (idx === -1) {
              return sendJson({ success: false, message: 'স্টাফ পাওয়া যায়নি' }, 404);
            }

            db.staffs[idx] = { ...db.staffs[idx], ...body };
            saveDatabase(db);
            return sendJson({ success: true, staff: db.staffs[idx] });
          }

          // 7. Delete Staff
          if (pathname.startsWith('/api/staffs/') && method === 'DELETE') {
            const staffId = pathname.replace('/api/staffs/', '');
            const db = getDatabase();
            db.staffs = db.staffs.filter((s) => s.id !== staffId);
            saveDatabase(db);
            return sendJson({ success: true, message: 'স্টাফ মুছে ফেলা হয়েছে' });
          }

          // 8. Add Transaction (Income or Expense)
          if (pathname === '/api/transactions' && method === 'POST') {
            const body = await parseBody();
            const db = getDatabase();

            if (!body.title || !body.amount || Number(body.amount) <= 0) {
              return sendJson({ success: false, message: 'বিবরণ এবং সঠিক টাকার পরিমাণ প্রদান করুন!' }, 400);
            }

            const newTx = {
              id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              type: body.type === 'expense' ? ('expense' as const) : ('income' as const),
              date: body.date || new Date().toISOString().substring(0, 10),
              title: body.title,
              category: body.category || (body.type === 'expense' ? 'অন্যান্য ব্যয়' : 'পণ্য বিক্রয়'),
              amount: Number(body.amount),
              paymentMethod: body.paymentMethod || 'cash',
              addedBy: body.addedBy || 'অজানা ইউজার',
              addedById: body.addedById || '',
              note: body.note || '',
              createdAt: new Date().toISOString()
            };

            db.transactions.unshift(newTx);
            saveDatabase(db);
            return sendJson({ success: true, transaction: newTx });
          }

          // 9. Delete Transaction
          if (pathname.startsWith('/api/transactions/') && method === 'DELETE') {
            const txId = pathname.replace('/api/transactions/', '');
            const db = getDatabase();
            db.transactions = db.transactions.filter((t) => t.id !== txId);
            saveDatabase(db);
            return sendJson({ success: true, message: 'লেনদেন মুছে ফেলা হয়েছে' });
          }

          // 10. Add / Update Customer Due
          if (pathname === '/api/dues' && method === 'POST') {
            const body = await parseBody();
            const db = getDatabase();

            if (body.action === 'new_customer') {
              const newDue = {
                id: 'due-' + Date.now(),
                customerName: body.customerName,
                phone: body.phone,
                address: body.address || '',
                totalDue: Number(body.initialDue) || 0,
                paidAmount: 0,
                remainingDue: Number(body.initialDue) || 0,
                lastUpdated: new Date().toISOString().substring(0, 10),
                notes: body.notes || '',
                history: [
                  {
                    date: new Date().toISOString().substring(0, 10),
                    amount: Number(body.initialDue) || 0,
                    type: 'due' as const,
                    note: 'প্রারম্ভিক বাকি খাতা শুরু'
                  }
                ]
              };
              db.customerDues.unshift(newDue);
              saveDatabase(db);
              return sendJson({ success: true, due: newDue });
            }

            if (body.action === 'add_entry') {
              const { dueId, amount, type, note } = body;
              const due = db.customerDues.find((d) => d.id === dueId);
              if (!due) return sendJson({ success: false, message: 'কাস্টমার পাওয়া যায়নি' }, 404);

              const numAmount = Number(amount) || 0;
              if (type === 'due') {
                due.totalDue += numAmount;
                due.remainingDue += numAmount;
              } else {
                due.paidAmount += numAmount;
                due.remainingDue = Math.max(0, due.remainingDue - numAmount);
              }
              due.lastUpdated = new Date().toISOString().substring(0, 10);
              due.history.unshift({
                date: new Date().toISOString().substring(0, 10),
                amount: numAmount,
                type: type === 'due' ? 'due' : 'payment',
                note: note || ''
              });

              saveDatabase(db);
              return sendJson({ success: true, due });
            }

            return sendJson({ success: false, message: 'অকার্যকর অনুরোধ' }, 400);
          }

          // 11. Delete Due Record
          if (pathname.startsWith('/api/dues/') && method === 'DELETE') {
            const dueId = pathname.replace('/api/dues/', '');
            const db = getDatabase();
            db.customerDues = db.customerDues.filter((d) => d.id !== dueId);
            saveDatabase(db);
            return sendJson({ success: true, message: 'বাকি রেকর্ড মুছে ফেলা হয়েছে' });
          }

          // 12. Backup: Export Entire Database
          if (pathname === '/api/backup/export' && method === 'GET') {
            const db = getDatabase();
            const exportData = {
              version: '1.0',
              exportedAt: new Date().toISOString(),
              company: db.company,
              adminAuth: db.adminAuth,
              staffs: db.staffs,
              transactions: db.transactions,
              customerDues: db.customerDues
            };
            res.setHeader('Content-Disposition', `attachment; filename="hisab_khata_backup_${new Date().toISOString().substring(0, 10)}.json"`);
            return sendJson(exportData);
          }

          // 13. Backup: Import and Restore Database
          if (pathname === '/api/backup/import' && method === 'POST') {
            const body = await parseBody();
            if (!body || typeof body !== 'object') {
              return sendJson({ success: false, message: 'অকার্যকর ব্যাকআপ ফাইল!' }, 400);
            }

            const currentDb = getDatabase();
            const restoredDb = {
              company: body.company ? { ...currentDb.company, ...body.company } : currentDb.company,
              adminAuth: body.adminAuth ? { ...currentDb.adminAuth, ...body.adminAuth } : currentDb.adminAuth,
              staffs: Array.isArray(body.staffs) ? body.staffs : currentDb.staffs,
              transactions: Array.isArray(body.transactions) ? body.transactions : currentDb.transactions,
              customerDues: Array.isArray(body.customerDues) ? body.customerDues : currentDb.customerDues
            };

            const saved = saveDatabase(restoredDb);
            if (!saved) {
              return sendJson({ success: false, message: 'ডাটাবেজে ব্যাকআপ সংরক্ষণ করা সম্ভব হয়নি!' }, 500);
            }

            return sendJson({
              success: true,
              message: 'ডাটাবেজ সফলভাবে রিস্টোর হয়েছে!',
              stats: {
                staffsCount: restoredDb.staffs.length,
                transactionsCount: restoredDb.transactions.length,
                duesCount: restoredDb.customerDues.length
              }
            });
          }

          return next();
        } catch (err: any) {
          console.error('API Error:', err);
          return sendJson({ success: false, error: err.message }, 500);
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), hisabKhataApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
