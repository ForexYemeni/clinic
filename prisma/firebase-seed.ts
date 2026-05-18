import { adminDb, adminAuth } from '../src/lib/firebase-admin';

async function main() {
  console.log('🌱 Seeding Firestore database...');

  // Create Auth Users
  try {
    await adminAuth.createUser({ uid: 'admin-001', email: 'admin@clinic.com', password: 'admin123', displayName: 'د. أحمد محمد' });
    console.log('  ✅ Admin user created');
  } catch (e: any) { console.log('  ⚠️ Admin user:', e.message); }

  try {
    await adminAuth.createUser({ uid: 'nurse-001', email: 'noura@clinic.com', password: 'nurse123', displayName: 'نورة العلي' });
    console.log('  ✅ Nurse 1 created');
  } catch (e: any) { console.log('  ⚠️ Nurse 1:', e.message); }

  try {
    await adminAuth.createUser({ uid: 'nurse-002', email: 'saeed@clinic.com', password: 'nurse123', displayName: 'سعيد الحربي' });
    console.log('  ✅ Nurse 2 created');
  } catch (e: any) { console.log('  ⚠️ Nurse 2:', e.message); }

  // Batch write
  const batch = adminDb.batch();

  // Users
  const users = {
    'admin-001': { name: 'د. أحمد محمد', email: 'admin@clinic.com', role: 'admin', phone: '0501234567', active: true, createdAt: new Date().toISOString() },
    'nurse-001': { name: 'نورة العلي', email: 'noura@clinic.com', role: 'nurse', phone: '0509876543', active: true, createdAt: new Date().toISOString() },
    'nurse-002': { name: 'سعيد الحربي', email: 'saeed@clinic.com', role: 'nurse', phone: '0507654321', active: true, createdAt: new Date().toISOString() },
  };
  Object.entries(users).forEach(([id, data]) => batch.set(adminDb.collection('users').doc(id), data));

  // Patients
  const patients: Record<string, any> = {
    'p001': { name: 'خالد عبدالله الشمري', age: 45, gender: 'male', phone: '0551112233', emergencyPhone: '0551112244', address: 'حي النزهة - الرياض', bloodType: 'A+', chronicDiseases: 'ضغط مرتفع', allergies: 'بنسلين', medicalHistory: 'مراجعة دورية لضغط الدم', registeredBy: 'admin-001', createdAt: new Date().toISOString() },
    'p002': { name: 'فاطمة أحمد القحطاني', age: 32, gender: 'female', phone: '0552223344', emergencyPhone: '0552223355', address: 'حي العليا - الرياض', bloodType: 'O-', chronicDiseases: 'سكري نوع 2', allergies: 'لا يوجد', medicalHistory: 'متابعة السكر والضغط', registeredBy: 'nurse-001', createdAt: new Date().toISOString() },
    'p003': { name: 'محمد سعد الدوسري', age: 58, gender: 'male', phone: '0553334455', emergencyPhone: '0553334466', address: 'حي السليمانية - الرياض', bloodType: 'B+', chronicDiseases: 'قلب، ضغط', allergies: 'أسبرين', medicalHistory: 'عملية قلب مفتوح سابقة', registeredBy: 'nurse-001', createdAt: new Date().toISOString() },
    'p004': { name: 'نوف سلطان العتيبي', age: 27, gender: 'female', phone: '0554445566', emergencyPhone: '0554445577', address: 'حي الملقا - الرياض', bloodType: 'AB+', chronicDiseases: 'لا يوجد', allergies: 'لا يوجد', medicalHistory: 'حالة صحية جيدة', registeredBy: 'admin-001', createdAt: new Date().toISOString() },
    'p005': { name: 'عبدالرحمن فيصل المالكي', age: 63, gender: 'male', phone: '0555556677', emergencyPhone: '0555556688', address: 'حي الروضة - الرياض', bloodType: 'O+', chronicDiseases: 'سكري، كوليسترول', allergies: 'يود', medicalHistory: 'متابعة السكر والكوليسترول', registeredBy: 'nurse-002', createdAt: new Date().toISOString() },
    'p006': { name: 'هند ناصر الغامدي', age: 41, gender: 'female', phone: '0556667788', emergencyPhone: '0556667799', address: 'حي الورود - الرياض', bloodType: 'A-', chronicDiseases: 'ربو', allergies: 'غبار، لقاح', medicalHistory: 'نوبات ربو متكررة', registeredBy: 'nurse-001', createdAt: new Date().toISOString() },
    'p007': { name: 'يوسف إبراهيم الحربي', age: 19, gender: 'male', phone: '0557778899', emergencyPhone: '0557778800', address: 'حي النخيل - الرياض', bloodType: 'B-', chronicDiseases: 'لا يوجد', allergies: 'لا يوجد', medicalHistory: 'إصابة رياضية في الركبة', registeredBy: 'nurse-002', createdAt: new Date().toISOString() },
    'p008': { name: 'مريم عبدالعزيز الزهراني', age: 55, gender: 'female', phone: '0558889900', emergencyPhone: '0558889911', address: 'حي السلام - الرياض', bloodType: 'AB-', chronicDiseases: 'ضغط، قلب', allergies: 'سلفا', medicalHistory: 'ذبحة صدرية سابقة', registeredBy: 'admin-001', createdAt: new Date().toISOString() },
    'p009': { name: 'سلطان محمد العنزي', age: 36, gender: 'male', phone: '0559990011', emergencyPhone: '0559990022', address: 'حي الياسمين - الرياض', bloodType: 'O+', chronicDiseases: 'لا يوجد', allergies: 'بنسلين', medicalHistory: 'حرق في اليد اليمنى', registeredBy: 'nurse-001', createdAt: new Date().toISOString() },
    'p010': { name: 'لطيفة حسن الشهري', age: 48, gender: 'female', phone: '0550001122', emergencyPhone: '0550001133', address: 'حي الربوة - الرياض', bloodType: 'A+', chronicDiseases: 'غدة درقية', allergies: 'لا يوجد', medicalHistory: 'متابعة الغدة الدرقية', registeredBy: 'nurse-002', createdAt: new Date().toISOString() },
    'p011': { name: 'عمر خالد المطيري', age: 29, gender: 'male', phone: '0551112233', emergencyPhone: '0551112244', address: 'حي الورود - الرياض', bloodType: 'B+', chronicDiseases: 'لا يوجد', allergies: 'لا يوجد', medicalHistory: 'كسر في المعصم', registeredBy: 'nurse-001', createdAt: new Date().toISOString() },
    'p012': { name: 'سارة عبدالله البلوي', age: 38, gender: 'female', phone: '0552223344', emergencyPhone: '0552223355', address: 'حي الملقا - الرياض', bloodType: 'O-', chronicDiseases: 'صداع نصفي', allergies: 'مسكنات', medicalHistory: 'صداع مزمن', registeredBy: 'admin-001', createdAt: new Date().toISOString() },
    'p013': { name: 'إبراهيم سالم الرشيدي', age: 72, gender: 'male', phone: '0553334455', emergencyPhone: '0553334466', address: 'حي السليمانية - الرياض', bloodType: 'A+', chronicDiseases: 'ضغط، سكري، قلب', allergies: 'يود، أسبرين', medicalHistory: 'قصور كلوي مبكر', registeredBy: 'nurse-002', createdAt: new Date().toISOString() },
    'p014': { name: 'ريم فهد السبيعي', age: 22, gender: 'female', phone: '0554445566', emergencyPhone: '0554445577', address: 'حي النخيل - الرياض', bloodType: 'AB+', chronicDiseases: 'لا يوجد', allergies: 'لا يوجد', medicalHistory: 'جرح قطعي في القدم', registeredBy: 'nurse-001', createdAt: new Date().toISOString() },
    'p015': { name: 'ماجد عادل الجهني', age: 51, gender: 'male', phone: '0555556677', emergencyPhone: '0555556688', address: 'حي العليا - الرياض', bloodType: 'O+', chronicDiseases: 'كوليسترول', allergies: 'لا يوجد', medicalHistory: 'ألم في الصدر متكرر', registeredBy: 'admin-001', createdAt: new Date().toISOString() },
  };
  Object.entries(patients).forEach(([id, data]) => batch.set(adminDb.collection('patients').doc(id), data));

  // Services
  const services: Record<string, any> = {
    's01': { name: 'Blood Pressure', nameAr: 'قياس الضغط', description: 'قياس ضغط الدم باستخدام جهاز متقدم', price: 25, duration: 10, category: 'قياسات', active: true, createdAt: new Date().toISOString() },
    's02': { name: 'Blood Sugar', nameAr: 'قياس السكر', description: 'فحص مستوى السكر في الدم', price: 20, duration: 10, category: 'قياسات', active: true, createdAt: new Date().toISOString() },
    's03': { name: 'Temperature', nameAr: 'قياس الحرارة', description: 'قياس درجة حرارة الجسم', price: 15, duration: 5, category: 'قياسات', active: true, createdAt: new Date().toISOString() },
    's04': { name: 'Pulse Check', nameAr: 'قياس النبض', description: 'فحص معدل النبض وانتظامه', price: 15, duration: 5, category: 'قياسات', active: true, createdAt: new Date().toISOString() },
    's05': { name: 'Oxygen Level', nameAr: 'قياس الأكسجين', description: 'قياس مستوى الأكسجين في الدم', price: 20, duration: 5, category: 'قياسات', active: true, createdAt: new Date().toISOString() },
    's06': { name: 'Injection', nameAr: 'إعطاء الحقن', description: 'إعطاء الحقن العضلية والوريدية وتحت الجلد', price: 50, duration: 15, category: 'علاج', active: true, createdAt: new Date().toISOString() },
    's07': { name: 'IV Drip', nameAr: 'تركيب المحاليل', description: 'تركيب محلول وريدي ومتابعته', price: 80, duration: 45, category: 'علاج', active: true, createdAt: new Date().toISOString() },
    's08': { name: 'Wound Dressing', nameAr: 'تضميد الجروح', description: 'تنظيف وتضميد الجروح المختلفة', price: 40, duration: 20, category: 'جروح', active: true, createdAt: new Date().toISOString() },
    's09': { name: 'Wound Cleaning', nameAr: 'تنظيف الجروح', description: 'تنظيف وتطهير الجروح والخدوش', price: 35, duration: 15, category: 'جروح', active: true, createdAt: new Date().toISOString() },
    's10': { name: 'Burn Treatment', nameAr: 'علاج الحروق', description: 'إسعاف وعلاج الحروق من الدرجة الأولى والثانية', price: 60, duration: 25, category: 'علاج', active: true, createdAt: new Date().toISOString() },
    's11': { name: 'Fracture First Aid', nameAr: 'إسعاف الكسور البسيطة', description: 'تثبيت وإسعاف الكسور البسيطة قبل التحويل', price: 75, duration: 30, category: 'علاج', active: true, createdAt: new Date().toISOString() },
    's12': { name: 'Nebulizer', nameAr: 'جلسات الرذاذ', description: 'جلسة رذاذ للجهاز التنفسي', price: 45, duration: 20, category: 'علاج', active: true, createdAt: new Date().toISOString() },
    's13': { name: 'Resuscitation', nameAr: 'الإنعاش الأولي', description: 'إجراءات الإنعاش الأولي والإنقاذ', price: 100, duration: 30, category: 'طوارئ', active: true, createdAt: new Date().toISOString() },
    's14': { name: 'Oxygen Therapy', nameAr: 'الأكسجين العلاجي', description: 'إعطاء الأكسجين العلاجي للمريض', price: 55, duration: 20, category: 'علاج', active: true, createdAt: new Date().toISOString() },
    's15': { name: 'Medication', nameAr: 'إعطاء الأدوية', description: 'إعطاء الأدوية الموصوفة للمريض', price: 30, duration: 10, category: 'علاج', active: true, createdAt: new Date().toISOString() },
    's16': { name: 'Dressing Change', nameAr: 'تغيير الضمادات', description: 'تغيير الضمادات ومتابعة التئام الجرح', price: 35, duration: 15, category: 'جروح', active: true, createdAt: new Date().toISOString() },
    's17': { name: 'Home Visit', nameAr: 'خدمات منزلية', description: 'زيارة منزلية لرعاية المريض في مقره', price: 150, duration: 60, category: 'خدمات خاصة', active: true, createdAt: new Date().toISOString() },
    's18': { name: 'Follow-up', nameAr: 'متابعة الحالات', description: 'متابعة حالة المريض وتسجيل التحسن', price: 40, duration: 20, category: 'متابعة', active: true, createdAt: new Date().toISOString() },
  };
  Object.entries(services).forEach(([id, data]) => batch.set(adminDb.collection('services').doc(id), data));

  // Emergencies
  const now = new Date().toISOString();
  const emergencies: Record<string, any> = {
    'e001': { patientId: 'p003', nurseId: 'nurse-001', severity: 'critical', arrivalTime: new Date(Date.now() - 3600000).toISOString(), treatmentTime: new Date(Date.now() - 1800000).toISOString(), actions: 'إنعاش قلبي، إعطاء أكسجين، نقل لقسم القلب', status: 'transferred', notes: 'ألم حاد في الصدر مع ضيق تنفس', createdAt: now },
    'e002': { patientId: 'p006', nurseId: 'nurse-002', severity: 'high', arrivalTime: new Date(Date.now() - 7200000).toISOString(), treatmentTime: new Date(Date.now() - 5400000).toISOString(), actions: 'جلسة رذاذ، إعطاء موسع شعب', status: 'treated', notes: 'نوبة ربو حادة', createdAt: now },
    'e003': { patientId: 'p009', nurseId: 'nurse-001', severity: 'moderate', arrivalTime: new Date(Date.now() - 10800000).toISOString(), treatmentTime: new Date(Date.now() - 9000000).toISOString(), actions: 'تنظيف الحرق، وضع مرهم، تضميد', status: 'treated', notes: 'حرق درجة ثانية في اليد', createdAt: now },
    'e004': { patientId: 'p013', nurseId: 'nurse-002', severity: 'high', arrivalTime: new Date(Date.now() - 14400000).toISOString(), status: 'active', actions: 'قياس العلامات الحيوية، تركيب محاليل', notes: 'هبوط حاد في الضغط', createdAt: now },
    'e005': { patientId: 'p011', nurseId: 'nurse-001', severity: 'moderate', arrivalTime: new Date(Date.now() - 18000000).toISOString(), treatmentTime: new Date(Date.now() - 16200000).toISOString(), actions: 'تثبيت الكسر، وضع جبيرة', status: 'treated', notes: 'كسر بسيط في المعصم', createdAt: now },
    'e006': { patientId: 'p014', nurseId: 'nurse-002', severity: 'low', arrivalTime: new Date(Date.now() - 21600000).toISOString(), treatmentTime: new Date(Date.now() - 20500000).toISOString(), actions: 'تنظيف الجرح، تضميد', status: 'treated', notes: 'جرح قطعي في القدم', createdAt: now },
    'e007': { patientId: 'p015', nurseId: 'nurse-001', severity: 'high', arrivalTime: new Date(Date.now() - 25200000).toISOString(), status: 'active', actions: 'تخطيط قلب، إعطاء أكسجين', notes: 'ألم في الصدر مع تعرق', createdAt: now },
    'e008': { patientId: 'p001', nurseId: 'nurse-002', severity: 'low', arrivalTime: new Date(Date.now() - 28800000).toISOString(), treatmentTime: new Date(Date.now() - 27500000).toISOString(), actions: 'قياس الضغط، إعطاء دواء', status: 'archived', notes: 'ارتفاع ضغط الدم', createdAt: now },
  };
  Object.entries(emergencies).forEach(([id, data]) => batch.set(adminDb.collection('emergencies').doc(id), data));

  // Appointments
  const today = new Date();
  const appointments: Record<string, any> = {
    'a001': { patientId: 'p001', nurseId: 'nurse-001', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(), duration: 30, type: 'checkup', status: 'confirmed', notes: 'متابعة ضغط الدم', createdAt: now },
    'a002': { patientId: 'p002', nurseId: 'nurse-002', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(), duration: 30, type: 'follow-up', status: 'scheduled', notes: 'فحص السكر الدوري', createdAt: now },
    'a003': { patientId: 'p004', nurseId: 'nurse-001', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(), duration: 30, type: 'checkup', status: 'scheduled', notes: 'فحص عام', createdAt: now },
    'a004': { patientId: 'p005', nurseId: 'nurse-002', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30).toISOString(), duration: 45, type: 'treatment', status: 'scheduled', notes: 'تركيب محلول وريدي', createdAt: now },
    'a005': { patientId: 'p007', nurseId: 'nurse-001', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(), duration: 30, type: 'follow-up', status: 'scheduled', notes: 'متابعة حالتها', createdAt: now },
    'a006': { patientId: 'p010', nurseId: 'nurse-002', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(), duration: 30, type: 'checkup', status: 'scheduled', notes: 'متابعة الغدة الدرقية', createdAt: now },
    'a007': { patientId: 'p003', nurseId: 'nurse-001', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(), duration: 30, type: 'follow-up', status: 'completed', notes: 'متابعة بعد الطوارئ', createdAt: now },
    'a008': { patientId: 'p008', nurseId: 'nurse-002', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0).toISOString(), duration: 30, type: 'checkup', status: 'scheduled', notes: 'فحص دوري', createdAt: now },
    'a009': { patientId: 'p012', nurseId: 'nurse-001', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0).toISOString(), duration: 30, type: 'follow-up', status: 'scheduled', notes: 'متابعة الصداع النصفي', createdAt: now },
    'a010': { patientId: 'p006', nurseId: 'nurse-002', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0).toISOString(), duration: 30, type: 'treatment', status: 'scheduled', notes: 'جلسة رذاذ', createdAt: now },
  };
  Object.entries(appointments).forEach(([id, data]) => batch.set(adminDb.collection('appointments').doc(id), data));

  // Patient Services
  const patientServices: Record<string, any> = {
    'ps01': { patientId: 'p001', serviceId: 's01', nurseId: 'nurse-001', status: 'completed', notes: 'الضغط 140/90', performedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: now },
    'ps02': { patientId: 'p002', serviceId: 's02', nurseId: 'nurse-002', status: 'completed', notes: 'السكر 180', performedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: now },
    'ps03': { patientId: 'p006', serviceId: 's12', nurseId: 'nurse-001', status: 'completed', notes: 'جلسة رذاذ كاملة', performedAt: new Date(Date.now() - 172800000).toISOString(), createdAt: now },
    'ps04': { patientId: 'p005', serviceId: 's07', nurseId: 'nurse-002', status: 'in-progress', notes: 'محلول وريدي جلوكوز', createdAt: now },
    'ps05': { patientId: 'p009', serviceId: 's10', nurseId: 'nurse-001', status: 'completed', notes: 'علاج حرق درجة ثانية', performedAt: new Date(Date.now() - 259200000).toISOString(), createdAt: now },
    'ps06': { patientId: 'p011', serviceId: 's11', nurseId: 'nurse-002', status: 'completed', notes: 'تثبيت كسر المعصم', performedAt: new Date(Date.now() - 345600000).toISOString(), createdAt: now },
    'ps07': { patientId: 'p014', serviceId: 's08', nurseId: 'nurse-001', status: 'completed', notes: 'تضميد جرح القدم', performedAt: new Date(Date.now() - 172800000).toISOString(), createdAt: now },
    'ps08': { patientId: 'p004', serviceId: 's04', nurseId: 'nurse-002', status: 'completed', notes: 'النبض 72 طبيعي', performedAt: new Date(Date.now() - 432000000).toISOString(), createdAt: now },
    'ps09': { patientId: 'p013', serviceId: 's01', nurseId: 'nurse-001', status: 'completed', notes: 'الضغط 90/60 - هبوط', performedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: now },
    'ps10': { patientId: 'p010', serviceId: 's05', nurseId: 'nurse-002', status: 'pending', notes: 'في الانتظار', createdAt: now },
    'ps11': { patientId: 'p007', serviceId: 's18', nurseId: 'nurse-001', status: 'completed', notes: 'متابعة حالة الربو - تحسن ملحوظ', performedAt: new Date(Date.now() - 259200000).toISOString(), createdAt: now },
    'ps12': { patientId: 'p015', serviceId: 's14', nurseId: 'nurse-002', status: 'in-progress', notes: 'أكسجين علاجي 3 لتر', createdAt: now },
  };
  Object.entries(patientServices).forEach(([id, data]) => batch.set(adminDb.collection('patientServices').doc(id), data));

  // Payments
  const payments: Record<string, any> = {
    'pay01': { patientId: 'p001', amount: 25, method: 'cash', type: 'payment', description: 'قياس الضغط', createdAt: now },
    'pay02': { patientId: 'p002', amount: 20, method: 'card', type: 'payment', description: 'قياس السكر', createdAt: now },
    'pay03': { patientId: 'p006', amount: 45, method: 'cash', type: 'payment', description: 'جلسة رذاذ', createdAt: now },
    'pay04': { patientId: 'p009', amount: 60, method: 'insurance', type: 'payment', description: 'علاج حرق', createdAt: now },
    'pay05': { patientId: 'p011', amount: 75, method: 'cash', type: 'payment', description: 'إسعاف كسر', createdAt: now },
    'pay06': { patientId: 'p014', amount: 40, method: 'cash', type: 'payment', description: 'تضميد جرح', createdAt: now },
    'pay07': { patientId: 'p004', amount: 15, method: 'card', type: 'payment', description: 'قياس النبض', createdAt: now },
    'pay08': { patientId: 'p013', amount: 55, method: 'cash', type: 'payment', description: 'أكسجين علاجي', createdAt: now },
    'pay09': { patientId: 'p015', amount: 100, method: 'insurance', type: 'payment', description: 'إنعاش أولي', createdAt: now },
    'pay10': { patientId: 'p008', amount: 50, method: 'cash', type: 'payment', description: 'إعطاء حقنة', createdAt: now },
  };
  Object.entries(payments).forEach(([id, data]) => batch.set(adminDb.collection('payments').doc(id), data));

  // Invoices
  const invoices: Record<string, any> = {
    'inv01': { patientId: 'p003', items: JSON.stringify([{ service: 'الإنعاش الأولي', price: 100 }, { service: 'الأكسجين العلاجي', price: 55 }]), total: 155, paid: 100, status: 'partial', dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: now },
    'inv02': { patientId: 'p009', items: JSON.stringify([{ service: 'علاج الحروق', price: 60 }, { service: 'تضميد الجروح', price: 40 }]), total: 100, paid: 100, status: 'paid', createdAt: now },
    'inv03': { patientId: 'p011', items: JSON.stringify([{ service: 'إسعاف الكسور', price: 75 }]), total: 75, paid: 75, status: 'paid', createdAt: now },
    'inv04': { patientId: 'p005', items: JSON.stringify([{ service: 'تركيب المحاليل', price: 80 }, { service: 'قياس السكر', price: 20 }]), total: 100, paid: 0, status: 'unpaid', dueDate: new Date(Date.now() + 3 * 86400000).toISOString(), createdAt: now },
    'inv05': { patientId: 'p015', items: JSON.stringify([{ service: 'الأكسجين العلاجي', price: 55 }, { service: 'تخطيط قلب', price: 45 }]), total: 100, paid: 55, status: 'partial', dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), createdAt: now },
  };
  Object.entries(invoices).forEach(([id, data]) => batch.set(adminDb.collection('invoices').doc(id), data));

  // Notifications
  const notifications: Record<string, any> = {
    'n01': { userId: 'admin-001', title: 'حالة طوارئ جديدة', message: 'تم استقبال حالة طوارئ حرجة - ألم في الصدر', type: 'emergency', read: false, createdAt: now },
    'n02': { userId: 'admin-001', title: 'موعد جديد', message: 'تم حجز موعد جديد لخالد عبدالله', type: 'appointment', read: false, createdAt: now },
    'n03': { userId: 'admin-001', title: 'دفعة مستلمة', message: 'تم استلام دفعة بقيمة 100 ريال', type: 'service', read: true, createdAt: now },
    'n04': { userId: 'nurse-001', title: 'موعد خلال 30 دقيقة', message: 'موعد المريض خالد عبدالله بعد 30 دقيقة', type: 'appointment', read: false, createdAt: now },
    'n05': { userId: 'nurse-001', title: 'حالة طوارئ', message: 'حالة حرجة في غرفة الطوارئ - يرجى الحضور فوراً', type: 'emergency', read: false, createdAt: now },
    'n06': { userId: 'nurse-002', title: 'تذكير بموعد', message: 'لديك موعد متابعة مع المريض عبدالرحمن المالكي', type: 'appointment', read: false, createdAt: now },
    'n07': { userId: 'admin-001', title: 'تقرير يومي', message: 'التقرير اليومي جاهز للمراجعة', type: 'system', read: false, createdAt: now },
    'n08': { userId: 'admin-001', title: 'فاتورة متأخرة', message: 'فاتورة المريض إبراهيم الرشيدي متأخرة', type: 'service', read: false, createdAt: now },
    'n09': { userId: 'nurse-001', title: 'إشعار نظام', message: 'تم تحديث بروتوكول الطوارئ', type: 'system', read: false, createdAt: now },
    'n10': { userId: 'nurse-002', title: 'خدمة مكتملة', message: 'تم إكمال خدمة قياس السكر', type: 'service', read: true, createdAt: now },
  };
  Object.entries(notifications).forEach(([id, data]) => batch.set(adminDb.collection('notifications').doc(id), data));

  // Visits
  const visits: Record<string, any> = {
    'v01': { patientId: 'p001', visitDate: new Date(Date.now() - 86400000).toISOString(), reason: 'متابعة ضغط الدم', diagnosis: 'ارتفاع ضغط الدم', notes: 'تعديل الجرعة', vitals: '{"bp":"140/90","pulse":82,"temp":37,"o2":98}', status: 'completed', createdAt: now },
    'v02': { patientId: 'p002', visitDate: new Date(Date.now() - 172800000).toISOString(), reason: 'فحص السكر الدوري', diagnosis: 'سكري نوع 2', notes: 'السكر مرتفع - يحتاج تعديل الأنسولين', vitals: '{"bp":"130/85","pulse":76,"temp":36.8,"o2":99,"sugar":180}', status: 'follow-up', createdAt: now },
    'v03': { patientId: 'p003', visitDate: new Date(Date.now() - 86400000).toISOString(), reason: 'ألم حاد في الصدر', diagnosis: 'ذبحة صدرية', notes: 'تم التحويل لقسم القلب', vitals: '{"bp":"160/100","pulse":110,"temp":37.2,"o2":93}', status: 'completed', createdAt: now },
  };
  Object.entries(visits).forEach(([id, data]) => batch.set(adminDb.collection('visits').doc(id), data));

  // Medications
  const medications: Record<string, any> = {
    'm01': { patientId: 'p001', name: 'أملوديبين', dosage: '5 مجم', frequency: 'مرة يومياً', startDate: new Date(Date.now() - 30 * 86400000).toISOString(), notes: 'لضغط الدم', createdAt: now },
    'm02': { patientId: 'p002', name: 'ميتفورمين', dosage: '500 مجم', frequency: 'مرتين يومياً', startDate: new Date(Date.now() - 60 * 86400000).toISOString(), notes: 'للسكري', createdAt: now },
    'm03': { patientId: 'p006', name: 'سالبوتامول', dosage: '100 ميكروغرام', frequency: 'عند الحاجة', startDate: new Date(Date.now() - 20 * 86400000).toISOString(), notes: 'بخاخ للربو', createdAt: now },
    'm04': { patientId: 'p010', name: 'ليفوثيروكسين', dosage: '50 ميكروغرام', frequency: 'مرة يومياً صباحاً', startDate: new Date(Date.now() - 120 * 86400000).toISOString(), notes: 'للغدة الدرقية', createdAt: now },
  };
  Object.entries(medications).forEach(([id, data]) => batch.set(adminDb.collection('medications').doc(id), data));

  await batch.commit();
  console.log('✅ Firestore seed completed successfully!');
  console.log('   - Users: 3');
  console.log('   - Patients: 15');
  console.log('   - Services: 18');
  console.log('   - Emergencies: 8');
  console.log('   - Appointments: 10');
  console.log('   - Patient Services: 12');
  console.log('   - Payments: 10');
  console.log('   - Invoices: 5');
  console.log('   - Notifications: 10');
  console.log('   - Visits: 3');
  console.log('   - Medications: 4');
}

main().catch(console.error);
