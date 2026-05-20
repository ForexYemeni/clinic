/**
 * Seed Script - إنشاء بيانات أولية للتطبيق
 * 
 * الاستخدام:
 *   node scripts/seed.js
 * 
 * يقوم بإنشاء:
 *   1. حساب مدير النظام (super_admin)
 *   2. عيادة افتراضية
 *   3. حساب مدير العيادة (admin)
 *   4. 14 خدمة افتراضية للعيادة
 *   5. حساب ممرض تجريبي
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clinic';

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'nurse'], default: 'nurse' },
  active: { type: Boolean, default: true },
  clinicId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Clinic Schema
const ClinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  city: { type: String, default: '' },
  adminPhone: { type: String, default: '' },
  adminId: { type: String, default: '' },
  active: { type: Boolean, default: true },
  setupComplete: { type: Boolean, default: false },
  subscription: {
    type: {
      plan: { type: String, default: 'free' },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      status: { type: String, default: 'active' },
    },
    default: () => ({ plan: 'free', startDate: null, endDate: null, status: 'active' }),
  },
  createdAt: { type: Date, default: Date.now },
});

// Service Schema
const ServiceSchema = new mongoose.Schema({
  nameAr: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  clinicId: { type: String, required: true },
  active: { type: Boolean, default: true },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

const DEFAULT_SERVICES = [
  { nameAr: 'قياس الضغط', price: 500, duration: 10, category: 'قياسات', description: 'قياس ضغط الدم' },
  { nameAr: 'قياس السكر', price: 500, duration: 10, category: 'قياسات', description: 'قياس مستوى السكر في الدم' },
  { nameAr: 'قياس الحرارة', price: 300, duration: 5, category: 'قياسات', description: 'قياس درجة حرارة الجسم' },
  { nameAr: 'قياس الأكسجين', price: 500, duration: 10, category: 'قياسات', description: 'قياس مستوى الأكسجين في الدم' },
  { nameAr: 'تضميد الجروح', price: 1500, duration: 20, category: 'إسعافات', description: 'تنظيف وتضميد الجروح' },
  { nameAr: 'الحروق', price: 2000, duration: 25, category: 'إسعافات', description: 'علاج الحروق البسيطة والمتوسطة' },
  { nameAr: 'الكسور البسيطة', price: 3000, duration: 30, category: 'إسعافات', description: 'تثبيت وعلاج الكسور البسيطة' },
  { nameAr: 'الأكسجين العلاجي', price: 1500, duration: 30, category: 'علاج', description: 'إعطاء الأكسجين العلاجي' },
  { nameAr: 'الحقن', price: 800, duration: 15, category: 'علاج', description: 'إعطاء الحقن العضلية والوريدية' },
  { nameAr: 'المحاليل', price: 1500, duration: 45, category: 'علاج', description: 'إعطاء المحاليل الوريدية' },
  { nameAr: 'الأدوية', price: 500, duration: 10, category: 'علاج', description: 'صرف وتقديم الأدوية' },
  { nameAr: 'الرذاذ الاستنشاقي', price: 800, duration: 15, category: 'علاج', description: 'علاج بالرذاذ والاستنشاق' },
  { nameAr: 'تغيير الضمادات', price: 1000, duration: 15, category: 'رعاية', description: 'تغيير وتجديد الضمادات' },
  { nameAr: 'الإسعافات الأولية العامة', price: 3000, duration: 30, category: 'إسعافات', description: 'إسعافات أولية شاملة' },
];

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  console.log(`   URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', ClinicSchema);
  const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

  // Check if data already exists
  const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
  if (existingSuperAdmin) {
    console.log('\n⚠️  يوجد بيانات بالفعل في قاعدة البيانات!');
    console.log('   إذا كنت تريد إعادة إنشاء البيانات، احذفها أولاً.');
    console.log('\n📋 الحسابات الموجودة:');
    const users = await User.find();
    for (const u of users) {
      console.log(`   - ${u.name} | ${u.phone} | ${u.role} | نشط: ${u.active}`);
    }
    const clinics = await Clinic.find();
    console.log('\n🏥 العيادات الموجودة:');
    for (const c of clinics) {
      console.log(`   - ${c.name} | نشطة: ${c.active}`);
    }
    await mongoose.disconnect();
    return;
  }

  // 1. Create super_admin
  const superAdmin = await User.create({
    name: 'مدير النظام',
    phone: '771234567',
    password: '1234',
    role: 'super_admin',
    active: true,
    clinicId: '',
  });
  console.log(`\n✅ تم إنشاء مدير النظام: ${superAdmin.name} (${superAdmin.phone})`);

  // 2. Create clinic
  const clinic = await Clinic.create({
    name: 'عيادة الإسعافات الأولية',
    address: 'صنعاء - شارع الزبيري',
    phone: '777000111',
    city: 'صنعاء',
    adminPhone: '777000222',
    adminId: '',
    active: true,
    setupComplete: true,
    subscription: {
      plan: 'free',
      startDate: new Date(),
      endDate: null,
      status: 'active',
    },
  });
  const clinicId = clinic._id.toString();
  console.log(`✅ تم إنشاء العيادة: ${clinic.name}`);

  // 3. Create clinic admin
  const adminUser = await User.create({
    name: 'مدير العيادة',
    phone: '777000222',
    password: '1234',
    role: 'admin',
    active: true,
    clinicId,
  });
  await Clinic.findByIdAndUpdate(clinicId, { adminId: adminUser._id.toString() });
  console.log(`✅ تم إنشاء مدير العيادة: ${adminUser.name} (${adminUser.phone})`);

  // 4. Create default services
  const servicesToInsert = DEFAULT_SERVICES.map((service) => ({
    ...service,
    clinicId,
    active: true,
    status: 'active',
  }));
  await Service.insertMany(servicesToInsert);
  console.log(`✅ تم إنشاء ${DEFAULT_SERVICES.length} خدمة افتراضية`);

  // 5. Create sample nurse
  const nurse = await User.create({
    name: 'أحمد الممرض',
    phone: '777000333',
    password: '1234',
    role: 'nurse',
    active: true,
    clinicId,
  });
  console.log(`✅ تم إنشاء ممرض تجريبي: ${nurse.name} (${nurse.phone})`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 ملخص الحسابات المُنشأة:');
  console.log('='.repeat(50));
  console.log(`🔐 مدير النظام (super_admin):`);
  console.log(`   الهاتف: 771234567 | كلمة المرور: 1234`);
  console.log('');
  console.log(`🏥 مدير العيادة (admin):`);
  console.log(`   الهاتف: 777000222 | كلمة المرور: 1234`);
  console.log('');
  console.log(`👨‍⚕️ ممرض (nurse):`);
  console.log(`   الهاتف: 777000333 | كلمة المرور: 1234`);
  console.log('='.repeat(50));

  await mongoose.disconnect();
  console.log('\n✅ تم بنجاح! يمكنك الآن تسجيل الدخول بأي من الحسابات أعلاه.');
}

seed().catch((err) => {
  console.error('❌ خطأ:', err.message);
  process.exit(1);
});
