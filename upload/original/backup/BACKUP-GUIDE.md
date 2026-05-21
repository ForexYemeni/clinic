# 🏥 Clinic SaaS - Complete Backup Guide

## 📦 محتويات النسخة الاحتياطية

```
clinic-backup/
├── src/                          ← كود التطبيق الكامل
├── public/                       ← الملفات العامة
├── backup/
│   └── firestore-data/           ← بيانات قاعدة البيانات الكاملة
│       ├── _export-summary.json  ← ملخص التصدير
│       ├── users.json            ← المستخدمين (3)
│       ├── clinics.json          ← العيادات (1)
│       ├── patients.json         ← المرضى (5)
│       ├── visits.json           ← الزيارات (8)
│       ├── invoices.json         ← الفواتير (8)
│       ├── services.json         ← الخدمات (146)
│       ├── notifications.json    ← الإشعارات (4)
│       ├── audit_logs.json       ← سجل العمليات (71)
│       ├── salaryWithdrawals.json← سحوبات الرواتب (5)
│       └── ...                   ← باقي المجموعات
├── scripts/
│   ├── export-firestore.js       ← سكربت تصدير البيانات
│   └── import-firestore.js       ← سكربت استيراد البيانات
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.example                  ← متغيرات البيئة المطلوبة
```

## 🚀 كيفية النشر على Vercel (بم متغير واحد فقط)

### الخطوة 1: رفع الكود إلى GitHub
```bash
git init
git add -A
git commit -m "Clinic SaaS Backup"
git remote add origin https://github.com/YOUR_USERNAME/clinic.git
git push -u origin main
```

### الخطوة 2: ربط Vercel
1. اذهب إلى vercel.com
2. اضغط "New Project"
3. اختر المستودع من GitHub
4. أضف متغير البيئة:
   - Name: `FIREBASE_CONFIG`
   - Value: (JSON يحتوي على بيانات Firebase)

### الخطوة 3: استيراد البيانات
```bash
# تثبيت التبعيات
npm install

# استيراد البيانات إلى Firebase جديد
node scripts/import-firestore.js ./backup/firestore-data
```

## 📊 ملخص البيانات المُصدّرة

| المجموعة | عدد المستندات |
|----------|--------------|
| users | 3 |
| clinics | 1 |
| patients | 5 |
| visits | 8 |
| invoices | 8 |
| services | 146 |
| notifications | 4 |
| audit_logs | 71 |
| salaryWithdrawals | 5 |
| platform | 1 |
| clinic | 1 |
| dataResetRequests | 1 |
| **الإجمالي** | **254** |

## 📅 تاريخ النسخة الاحتياطية
2026-05-20
