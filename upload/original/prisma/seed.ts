import { db } from '../src/lib/db';
import { hash } from 'crypto';

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await db.dailyReport.deleteMany();
  await db.notification.deleteMany();
  await db.invoice.deleteMany();
  await db.payment.deleteMany();
  await db.patientService.deleteMany();
  await db.medication.deleteMany();
  await db.visit.deleteMany();
  await db.appointment.deleteMany();
  await db.emergency.deleteMany();
  await db.service.deleteMany();
  await db.patient.deleteMany();
  await db.user.deleteMany();

  // Create Admin
  const admin = await db.user.create({
    data: {
      name: 'د. أحمد محمد',
      email: 'admin@clinic.com',
      password: 'admin123',
      role: 'admin',
      phone: '0501234567',
      active: true,
    },
  });

  // Create Nurses
  const nurse1 = await db.user.create({
    data: {
      name: 'نورة العلي',
      email: 'noura@clinic.com',
      password: 'nurse123',
      role: 'nurse',
      phone: '0509876543',
      active: true,
    },
  });

  const nurse2 = await db.user.create({
    data: {
      name: 'سعيد الحربي',
      email: 'saeed@clinic.com',
      password: 'nurse123',
      role: 'nurse',
      phone: '0507654321',
      active: true,
    },
  });

  // Create Patients
  const patients = await Promise.all([
    db.patient.create({ data: { name: 'خالد عبدالله الشمري', age: 45, gender: 'male', phone: '0551112233', emergencyPhone: '0551112244', address: 'حي النزهة - الرياض', bloodType: 'A+', chronicDiseases: 'ضغط مرتفع', allergies: 'بنسلين', medicalHistory: 'مراجعة دورية لضغط الدم', registeredBy: admin.id } }),
    db.patient.create({ data: { name: 'فاطمة أحمد القحطاني', age: 32, gender: 'female', phone: '0552223344', emergencyPhone: '0552223355', address: 'حي العليا - الرياض', bloodType: 'O-', chronicDiseases: 'سكري نوع 2', allergies: 'لا يوجد', medicalHistory: 'متابعة السكر والضغط', registeredBy: nurse1.id } }),
    db.patient.create({ data: { name: 'محمد سعد الدوسري', age: 58, gender: 'male', phone: '0553334455', emergencyPhone: '0553334466', address: 'حي السليمانية - الرياض', bloodType: 'B+', chronicDiseases: 'قلب، ضغط', allergies: 'أسبرين', medicalHistory: 'عميلة قلب مفتوح سابقة', registeredBy: nurse1.id } }),
    db.patient.create({ data: { name: 'نوف سلطان العتيبي', age: 27, gender: 'female', phone: '0554445566', emergencyPhone: '0554445577', address: 'حي الملقا - الرياض', bloodType: 'AB+', chronicDiseases: 'لا يوجد', allergies: 'لا يوجد', medicalHistory: 'حالة صحية جيدة', registeredBy: admin.id } }),
    db.patient.create({ data: { name: 'عبدالرحمن فيصل المالكي', age: 63, gender: 'male', phone: '0555556677', emergencyPhone: '0555556688', address: 'حي الروضة - الرياض', bloodType: 'O+', chronicDiseases: 'سكري، كوليسترول', allergies: 'يود', medicalHistory: 'متابعة السكر والكوليسترول', registeredBy: nurse2.id } }),
    db.patient.create({ data: { name: 'هند ناصر الغامدي', age: 41, gender: 'female', phone: '0556667788', emergencyPhone: '0556667799', address: 'حي الورود - الرياض', bloodType: 'A-', chronicDiseases: 'ربو', allergies: 'غبار، لقاح', medicalHistory: 'نوبات ربو متكررة', registeredBy: nurse1.id } }),
    db.patient.create({ data: { name: 'يوسف إبراهيم الحربي', age: 19, gender: 'male', phone: '0557778899', emergencyPhone: '0557778800', address: 'حي النخيل - الرياض', bloodType: 'B-', chronicDiseases: 'لا يوجد', allergies: 'لا يوجد', medicalHistory: 'إصابة رياضية في الركبة', registeredBy: nurse2.id } }),
    db.patient.create({ data: { name: 'مريم عبدالعزيز الزهراني', age: 55, gender: 'female', phone: '0558889900', emergencyPhone: '0558889911', address: 'حي السلام - الرياض', bloodType: 'AB-', chronicDiseases: 'ضغط، قلب', allergies: 'سلفا', medicalHistory: 'ذبحة صدرية سابقة', registeredBy: admin.id } }),
    db.patient.create({ data: { name: 'سلطان محمد العنزي', age: 36, gender: 'male', phone: '0559990011', emergencyPhone: '0559990022', address: 'حي الياسمين - الرياض', bloodType: 'O+', chronicDiseases: 'لا يوجد', allergies: 'بنسلين', medicalHistory: 'حرق في اليد اليمنى', registeredBy: nurse1.id } }),
    db.patient.create({ data: { name: 'لطيفة حسن الشهري', age: 48, gender: 'female', phone: '0550001122', emergencyPhone: '0550001133', address: 'حي الربوة - الرياض', bloodType: 'A+', chronicDiseases: 'غدة درقية', allergies: 'لا يوجد', medicalHistory: 'متابعة الغدة الدرقية', registeredBy: nurse2.id } }),
    db.patient.create({ data: { name: 'عمر خالد المطيري', age: 29, gender: 'male', phone: '0551112233', emergencyPhone: '0551112244', address: 'حي الورود - الرياض', bloodType: 'B+', chronicDiseases: 'لا يوجد', allergies: 'لا يوجد', medicalHistory: 'كسر في المعصم', registeredBy: nurse1.id } }),
    db.patient.create({ data: { name: 'سارة عبدالله البلوي', age: 38, gender: 'female', phone: '0552223344', emergencyPhone: '0552223355', address: 'حي الملقا - الرياض', bloodType: 'O-', chronicDiseases: 'صداع نصفي', allergies: 'مسكنات', medicalHistory: 'صداع مزمن', registeredBy: admin.id } }),
    db.patient.create({ data: { name: 'إبراهيم سالم الرشيدي', age: 72, gender: 'male', phone: '0553334455', emergencyPhone: '0553334466', address: 'حي السليمانية - الرياض', bloodType: 'A+', chronicDiseases: 'ضغط، سكري، قلب', allergies: 'يود، أسبرين', medicalHistory: 'قصور كلوي مبكر', registeredBy: nurse2.id } }),
    db.patient.create({ data: { name: 'ريم فهد السبيعي', age: 22, gender: 'female', phone: '0554445566', emergencyPhone: '0554445577', address: 'حي النخيل - الرياض', bloodType: 'AB+', chronicDiseases: 'لا يوجد', allergies: 'لا يوجد', medicalHistory: 'جرح قطعي في القدم', registeredBy: nurse1.id } }),
    db.patient.create({ data: { name: 'ماجد عادل الجهني', age: 51, gender: 'male', phone: '0555556677', emergencyPhone: '0555556688', address: 'حي العليا - الرياض', bloodType: 'O+', chronicDiseases: 'كوليسترول', allergies: 'لا يوجد', medicalHistory: 'ألم في الصدر متكرر', registeredBy: admin.id } }),
  ]);

  // Create Services
  const services = await Promise.all([
    db.service.create({ data: { name: 'Blood Pressure', nameAr: 'قياس الضغط', description: 'قياس ضغط الدم باستخدام جهاز متقدم', price: 25, duration: 10, category: 'قياسات', active: true } }),
    db.service.create({ data: { name: 'Blood Sugar', nameAr: 'قياس السكر', description: 'فحص مستوى السكر في الدم', price: 20, duration: 10, category: 'قياسات', active: true } }),
    db.service.create({ data: { name: 'Temperature', nameAr: 'قياس الحرارة', description: 'قياس درجة حرارة الجسم', price: 15, duration: 5, category: 'قياسات', active: true } }),
    db.service.create({ data: { name: 'Pulse Check', nameAr: 'قياس النبض', description: 'فحص معدل النبض وانتظامه', price: 15, duration: 5, category: 'قياسات', active: true } }),
    db.service.create({ data: { name: 'Oxygen Level', nameAr: 'قياس الأكسجين', description: 'قياس مستوى الأكسجين في الدم', price: 20, duration: 5, category: 'قياسات', active: true } }),
    db.service.create({ data: { name: 'Injection', nameAr: 'إعطاء الحقن', description: 'إعطاء الحقن العضلية والوريدية وتحت الجلد', price: 50, duration: 15, category: 'علاج', active: true } }),
    db.service.create({ data: { name: 'IV Drip', nameAr: 'تركيب المحاليل', description: 'تركيب محلول وريدي وتابعته', price: 80, duration: 45, category: 'علاج', active: true } }),
    db.service.create({ data: { name: 'Wound Dressing', nameAr: 'تضميد الجروح', description: 'تنظيف وتضميد الجروح المختلفة', price: 40, duration: 20, category: 'جروح', active: true } }),
    db.service.create({ data: { name: 'Wound Cleaning', nameAr: 'تنظيف الجروح', description: 'تنظيف وتطهير الجروح والخدوش', price: 35, duration: 15, category: 'جروح', active: true } }),
    db.service.create({ data: { name: 'Burn Treatment', nameAr: 'علاج الحروق', description: 'إسعاف وعلاج الحروق من الدرجة الأولى والثانية', price: 60, duration: 25, category: 'علاج', active: true } }),
    db.service.create({ data: { name: 'Fracture First Aid', nameAr: 'إسعاف الكسور البسيطة', description: 'تثبيت وإسعاف الكسور البسيطة قبل التحويل', price: 75, duration: 30, category: 'علاج', active: true } }),
    db.service.create({ data: { name: 'Nebulizer', nameAr: 'جلسات الرذاذ', description: 'جلسة رذاذ للجهاز التنفسي', price: 45, duration: 20, category: 'علاج', active: true } }),
    db.service.create({ data: { name: 'Resuscitation', nameAr: 'الإنعاش الأولي', description: 'إجراءات الإنعاش الأولي والإنقاذ', price: 100, duration: 30, category: 'طوارئ', active: true } }),
    db.service.create({ data: { name: 'Oxygen Therapy', nameAr: 'الأكسجين العلاجي', description: 'إعطاء الأكسجين العلاجي للمريض', price: 55, duration: 20, category: 'علاج', active: true } }),
    db.service.create({ data: { name: 'Medication', nameAr: 'إعطاء الأدوية', description: 'إعطاء الأدوية الموصوفة للمريض', price: 30, duration: 10, category: 'علاج', active: true } }),
    db.service.create({ data: { name: 'Dressing Change', nameAr: 'تغيير الضمادات', description: 'تغيير الضمادات ومتابعة التئام الجرح', price: 35, duration: 15, category: 'جروح', active: true } }),
    db.service.create({ data: { name: 'Home Visit', nameAr: 'خدمات منزلية', description: 'زيارة منزلية لرعاية المريض في مقره', price: 150, duration: 60, category: 'خدمات خاصة', active: true } }),
    db.service.create({ data: { name: 'Follow-up', nameAr: 'متابعة الحالات', description: 'متابعة حالة المريض وتسجيل التحسن', price: 40, duration: 20, category: 'متابعة', active: true } }),
  ]);

  // Create Emergencies
  const now = new Date();
  const emergencies = await Promise.all([
    db.emergency.create({ data: { patientId: patients[2].id, nurseId: nurse1.id, severity: 'critical', arrivalTime: new Date(now.getTime() - 3600000), treatmentTime: new Date(now.getTime() - 1800000), actions: 'إنعاش قلبي، إعطاء أكسجين، نقل لقسم القلب', status: 'transferred', notes: 'ألم حاد في الصدر مع ضيق تنفس' } }),
    db.emergency.create({ data: { patientId: patients[5].id, nurseId: nurse2.id, severity: 'high', arrivalTime: new Date(now.getTime() - 7200000), treatmentTime: new Date(now.getTime() - 5400000), actions: 'جلسة رذاذ، إعطاء موسع شعب', status: 'treated', notes: 'نوبة ربو حادة' } }),
    db.emergency.create({ data: { patientId: patients[8].id, nurseId: nurse1.id, severity: 'moderate', arrivalTime: new Date(now.getTime() - 10800000), treatmentTime: new Date(now.getTime() - 9000000), actions: 'تنظيف الحرق، وضع مرهم، تضميد', status: 'treated', notes: 'حرق درجة ثانية في اليد' } }),
    db.emergency.create({ data: { patientId: patients[12].id, nurseId: nurse2.id, severity: 'high', arrivalTime: new Date(now.getTime() - 14400000), status: 'active', actions: 'قياس العلامات الحيوية، تركيب محاليل', notes: 'هبوط حاد في الضغط' } }),
    db.emergency.create({ data: { patientId: patients[10].id, nurseId: nurse1.id, severity: 'moderate', arrivalTime: new Date(now.getTime() - 18000000), treatmentTime: new Date(now.getTime() - 16200000), actions: 'تثبيت الكسر، وضع جبيرة', status: 'treated', notes: 'كسر بسيط في المعصم' } }),
    db.emergency.create({ data: { patientId: patients[13].id, nurseId: nurse2.id, severity: 'low', arrivalTime: new Date(now.getTime() - 21600000), treatmentTime: new Date(now.getTime() - 20500000), actions: 'تنظيف الجرح، تضميد', status: 'treated', notes: 'جرح قطعي في القدم' } }),
    db.emergency.create({ data: { patientId: patients[14].id, nurseId: nurse1.id, severity: 'high', arrivalTime: new Date(now.getTime() - 25200000), status: 'active', actions: 'تخطيط قلب، إعطاء أكسجين', notes: 'ألم في الصدر مع تعرق' } }),
    db.emergency.create({ data: { patientId: patients[0].id, nurseId: nurse2.id, severity: 'low', arrivalTime: new Date(now.getTime() - 28800000), treatmentTime: new Date(now.getTime() - 27500000), actions: 'قياس الضغط، إعطاء دواء', status: 'archived', notes: 'ارتفاع ضغط الدم' } }),
  ]);

  // Create Appointments
  const today = new Date();
  const appointments = await Promise.all([
    db.appointment.create({ data: { patientId: patients[0].id, nurseId: nurse1.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0), duration: 30, type: 'checkup', status: 'confirmed', notes: 'متابعة ضغط الدم' } }),
    db.appointment.create({ data: { patientId: patients[1].id, nurseId: nurse2.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30), duration: 30, type: 'follow-up', status: 'scheduled', notes: 'فحص السكر الدوري' } }),
    db.appointment.create({ data: { patientId: patients[3].id, nurseId: nurse1.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0), duration: 30, type: 'checkup', status: 'scheduled', notes: 'فحص عام' } }),
    db.appointment.create({ data: { patientId: patients[4].id, nurseId: nurse2.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30), duration: 45, type: 'treatment', status: 'scheduled', notes: 'تركيب محلول وريدي' } }),
    db.appointment.create({ data: { patientId: patients[6].id, nurseId: nurse1.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0), duration: 30, type: 'follow-up', status: 'scheduled', notes: 'متابعة حالتها' } }),
    db.appointment.create({ data: { patientId: patients[9].id, nurseId: nurse2.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30), duration: 30, type: 'checkup', status: 'scheduled', notes: 'متابعة الغدة الدرقية' } }),
    db.appointment.create({ data: { patientId: patients[2].id, nurseId: nurse1.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0), duration: 30, type: 'follow-up', status: 'completed', notes: 'متابعة بعد الطوارئ' } }),
    db.appointment.create({ data: { patientId: patients[7].id, nurseId: nurse2.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0), duration: 30, type: 'checkup', status: 'scheduled', notes: 'فحص دوري' } }),
    db.appointment.create({ data: { patientId: patients[11].id, nurseId: nurse1.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0), duration: 30, type: 'follow-up', status: 'scheduled', notes: 'متابعة الصداع النصفي' } }),
    db.appointment.create({ data: { patientId: patients[5].id, nurseId: nurse2.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0), duration: 30, type: 'treatment', status: 'scheduled', notes: 'جلسة رذاذ' } }),
  ]);

  // Create Patient Services
  const patientServices = await Promise.all([
    db.patientService.create({ data: { patientId: patients[0].id, serviceId: services[0].id, nurseId: nurse1.id, status: 'completed', notes: 'الضغط 140/90', performedAt: new Date(now.getTime() - 86400000) } }),
    db.patientService.create({ data: { patientId: patients[1].id, serviceId: services[1].id, nurseId: nurse2.id, status: 'completed', notes: 'السكر 180', performedAt: new Date(now.getTime() - 86400000) } }),
    db.patientService.create({ data: { patientId: patients[5].id, serviceId: services[11].id, nurseId: nurse1.id, status: 'completed', notes: 'جلسة رذاذ كاملة', performedAt: new Date(now.getTime() - 172800000) } }),
    db.patientService.create({ data: { patientId: patients[4].id, serviceId: services[6].id, nurseId: nurse2.id, status: 'in-progress', notes: 'محلول وريدي جلوكوز' } }),
    db.patientService.create({ data: { patientId: patients[8].id, serviceId: services[9].id, nurseId: nurse1.id, status: 'completed', notes: 'علاج حرق درجة ثانية', performedAt: new Date(now.getTime() - 259200000) } }),
    db.patientService.create({ data: { patientId: patients[10].id, serviceId: services[10].id, nurseId: nurse2.id, status: 'completed', notes: 'تثبيت كسر المعصم', performedAt: new Date(now.getTime() - 345600000) } }),
    db.patientService.create({ data: { patientId: patients[13].id, serviceId: services[7].id, nurseId: nurse1.id, status: 'completed', notes: 'تضميد جرح القدم', performedAt: new Date(now.getTime() - 172800000) } }),
    db.patientService.create({ data: { patientId: patients[3].id, serviceId: services[3].id, nurseId: nurse2.id, status: 'completed', notes: 'النبض 72 طبيعي', performedAt: new Date(now.getTime() - 432000000) } }),
    db.patientService.create({ data: { patientId: patients[12].id, serviceId: services[0].id, nurseId: nurse1.id, status: 'completed', notes: 'الضغط 90/60 - هبوط', performedAt: new Date(now.getTime() - 86400000) } }),
    db.patientService.create({ data: { patientId: patients[9].id, serviceId: services[4].id, nurseId: nurse2.id, status: 'pending', notes: 'في الانتظار' } }),
    db.patientService.create({ data: { patientId: patients[6].id, serviceId: services[17].id, nurseId: nurse1.id, status: 'completed', notes: 'متابعة حالة الربو - تحسن ملحوظ', performedAt: new Date(now.getTime() - 259200000) } }),
    db.patientService.create({ data: { patientId: patients[14].id, serviceId: services[13].id, nurseId: nurse2.id, status: 'in-progress', notes: 'أكسجين علاجي 3 لتر' } }),
    db.patientService.create({ data: { patientId: patients[7].id, serviceId: services[5].id, nurseId: nurse1.id, status: 'completed', notes: 'حقنة عضلية', performedAt: new Date(now.getTime() - 518400000) } }),
    db.patientService.create({ data: { patientId: patients[11].id, serviceId: services[14].id, nurseId: nurse2.id, status: 'completed', notes: 'إعطاء مسكنات', performedAt: new Date(now.getTime() - 432000000) } }),
    db.patientService.create({ data: { patientId: patients[2].id, serviceId: services[12].id, nurseId: nurse1.id, status: 'completed', notes: 'إنعاش قلبي أولي', performedAt: new Date(now.getTime() - 86400000) } }),
  ]);

  // Create Visits
  await Promise.all([
    db.visit.create({ data: { patientId: patients[0].id, visitDate: new Date(now.getTime() - 86400000), reason: 'متابعة ضغط الدم', diagnosis: 'ارتفاع ضغط الدم', notes: 'تعديل الجرعة', vitals: '{"bp":"140/90","pulse":82,"temp":37,"o2":98}', status: 'completed' } }),
    db.visit.create({ data: { patientId: patients[1].id, visitDate: new Date(now.getTime() - 172800000), reason: 'فحص السكر الدوري', diagnosis: 'سكري نوع 2', notes: 'السكر مرتفع - يحتاج تعديل الأنسولين', vitals: '{"bp":"130/85","pulse":76,"temp":36.8,"o2":99,"sugar":180}', status: 'follow-up' } }),
    db.visit.create({ data: { patientId: patients[2].id, visitDate: new Date(now.getTime() - 86400000), reason: 'ألم حاد في الصدر', diagnosis: 'ذبحة صدرية', notes: 'تم التحويل لقسم القلب', vitals: '{"bp":"160/100","pulse":110,"temp":37.2,"o2":93}', status: 'completed' } }),
    db.visit.create({ data: { patientId: patients[5].id, visitDate: new Date(now.getTime() - 172800000), reason: 'نوبة ربو حادة', diagnosis: 'ربو شعبي', notes: 'تحسن بعد جلسة الرذاذ', vitals: '{"bp":"120/80","pulse":95,"temp":37,"o2":94}', status: 'completed' } }),
    db.visit.create({ data: { patientId: patients[8].id, visitDate: new Date(now.getTime() - 259200000), reason: 'حرق في اليد', diagnosis: 'حرق درجة ثانية', notes: 'تم تنظيف وتضميد الحرق', vitals: '{"bp":"125/82","pulse":88,"temp":37.3,"o2":98}', status: 'follow-up' } }),
  ]);

  // Create Medications
  await Promise.all([
    db.medication.create({ data: { patientId: patients[0].id, name: 'أملوديبين', dosage: '5 مجم', frequency: 'مرة يومياً', startDate: new Date(now.getTime() - 30 * 86400000), notes: 'لضغط الدم' } }),
    db.medication.create({ data: { patientId: patients[1].id, name: 'ميتفورمين', dosage: '500 مجم', frequency: 'مرتين يومياً', startDate: new Date(now.getTime() - 60 * 86400000), notes: 'للسكري' } }),
    db.medication.create({ data: { patientId: patients[1].id, name: 'أنسولين غلارجين', dosage: '20 وحدة', frequency: 'مرة يومياً مساءً', startDate: new Date(now.getTime() - 30 * 86400000), notes: 'أنسولين طويل المفعول' } }),
    db.medication.create({ data: { patientId: patients[2].id, name: 'أسبرين', dosage: '81 مجم', frequency: 'مرة يومياً', startDate: new Date(now.getTime() - 90 * 86400000), notes: 'للقلب - لكن المريض عنده حساسية! تم التوقف' } }),
    db.medication.create({ data: { patientId: patients[4].id, name: 'جلوفورمين', dosage: '850 مجم', frequency: 'مرتين يومياً', startDate: new Date(now.getTime() - 45 * 86400000), notes: 'للسكري' } }),
    db.medication.create({ data: { patientId: patients[5].id, name: 'سالبوتامول', dosage: '100 ميكروغرام', frequency: 'عند الحاجة', startDate: new Date(now.getTime() - 20 * 86400000), notes: 'بخاخ للربو' } }),
    db.medication.create({ data: { patientId: patients[5].id, name: 'بوديزونيد', dosage: '200 ميكروغرام', frequency: 'مرتين يومياً', startDate: new Date(now.getTime() - 20 * 86400000), notes: 'بخاخ وقائي' } }),
    db.medication.create({ data: { patientId: patients[9].id, name: 'ليفوثيروكسين', dosage: '50 ميكروغرام', frequency: 'مرة يومياً صباحاً', startDate: new Date(now.getTime() - 120 * 86400000), notes: 'للغدة الدرقية' } }),
  ]);

  // Create Payments
  const payments = await Promise.all([
    db.payment.create({ data: { patientId: patients[0].id, amount: 25, method: 'cash', type: 'payment', description: 'قياس الضغط' } }),
    db.payment.create({ data: { patientId: patients[1].id, amount: 20, method: 'card', type: 'payment', description: 'قياس السكر' } }),
    db.payment.create({ data: { patientId: patients[5].id, amount: 45, method: 'cash', type: 'payment', description: 'جلسة رذاذ' } }),
    db.payment.create({ data: { patientId: patients[8].id, amount: 60, method: 'insurance', type: 'payment', description: 'علاج حرق' } }),
    db.payment.create({ data: { patientId: patients[10].id, amount: 75, method: 'cash', type: 'payment', description: 'إسعاف كسر' } }),
    db.payment.create({ data: { patientId: patients[13].id, amount: 40, method: 'cash', type: 'payment', description: 'تضميد جرح' } }),
    db.payment.create({ data: { patientId: patients[3].id, amount: 15, method: 'card', type: 'payment', description: 'قياس النبض' } }),
    db.payment.create({ data: { patientId: patients[12].id, amount: 55, method: 'cash', type: 'payment', description: 'أكسجين علاجي' } }),
    db.payment.create({ data: { patientId: patients[14].id, amount: 100, method: 'insurance', type: 'payment', description: 'إنعاش أولي' } }),
    db.payment.create({ data: { patientId: patients[7].id, amount: 50, method: 'cash', type: 'payment', description: 'إعطاء حقنة' } }),
  ]);

  // Create Invoices
  await Promise.all([
    db.invoice.create({ data: { patientId: patients[2].id, items: JSON.stringify([{ service: 'الإنعاش الأولي', price: 100 }, { service: 'الأكسجين العلاجي', price: 55 }]), total: 155, paid: 100, status: 'partial', dueDate: new Date(now.getTime() + 7 * 86400000) } }),
    db.invoice.create({ data: { patientId: patients[8].id, items: JSON.stringify([{ service: 'علاج الحروق', price: 60 }, { service: 'تضميد الجروح', price: 40 }]), total: 100, paid: 100, status: 'paid' } }),
    db.invoice.create({ data: { patientId: patients[10].id, items: JSON.stringify([{ service: 'إسعاف الكسور', price: 75 }]), total: 75, paid: 75, status: 'paid' } }),
    db.invoice.create({ data: { patientId: patients[4].id, items: JSON.stringify([{ service: 'تركيب المحاليل', price: 80 }, { service: 'قياس السكر', price: 20 }]), total: 100, paid: 0, status: 'unpaid', dueDate: new Date(now.getTime() + 3 * 86400000) } }),
    db.invoice.create({ data: { patientId: patients[14].id, items: JSON.stringify([{ service: 'الأكسجين العلاجي', price: 55 }, { service: 'تخطيط قلب', price: 45 }]), total: 100, paid: 55, status: 'partial', dueDate: new Date(now.getTime() + 5 * 86400000) } }),
  ]);

  // Create Notifications
  await Promise.all([
    db.notification.create({ data: { userId: admin.id, title: 'حالة طوارئ جديدة', message: 'تم استقبال حالة طوارئ حرجة - ألم في الصدر', type: 'emergency', read: false } }),
    db.notification.create({ data: { userId: admin.id, title: 'موعد جديد', message: 'تم حجز موعد جديد لخالد عبدالله', type: 'appointment', read: false } }),
    db.notification.create({ data: { userId: admin.id, title: 'دفعة مستلمة', message: 'تم استلام دفعة بقيمة 100 ريال', type: 'service', read: true } }),
    db.notification.create({ data: { userId: admin.id, title: 'تحديث النظام', message: 'تم تحديث بيانات الممرضة نورة العلي', type: 'system', read: true } }),
    db.notification.create({ data: { userId: nurse1.id, title: 'موعد خلال 30 دقيقة', message: 'موعد المريض خالد عبدالله بعد 30 دقيقة', type: 'appointment', read: false } }),
    db.notification.create({ data: { userId: nurse1.id, title: 'حالة طوارئ', message: 'حالة حرجة في غرفة الطوارئ - يرجى الحضور فوراً', type: 'emergency', read: false } }),
    db.notification.create({ data: { userId: nurse1.id, title: 'خدمة مكتملة', message: 'تم إكمال خدمة قياس الضغط للمريض خالد', type: 'service', read: true } }),
    db.notification.create({ data: { userId: nurse2.id, title: 'مريض جديد', message: 'تم تسجيل مريض جديد - فاطمة القحطاني', type: 'system', read: true } }),
    db.notification.create({ data: { userId: nurse2.id, title: 'تذكير بموعد', message: 'لديك موعد متابعة مع المريض عبدالرحمن المالكي', type: 'appointment', read: false } }),
    db.notification.create({ data: { userId: admin.id, title: 'تقرير يومي', message: 'التقرير اليومي جاهز للمراجعة', type: 'system', read: false } }),
    db.notification.create({ data: { userId: admin.id, title: 'فاتورة متأخرة', message: 'فاتورة المريض إبراهيم الرشيدي متأخرة', type: 'service', read: false } }),
    db.notification.create({ data: { userId: nurse1.id, title: 'إشعار نظام', message: 'تم تحديث بروتوكول الطوارئ', type: 'system', read: false } }),
  ]);

  // Create Daily Reports
  await Promise.all([
    db.dailyReport.create({ data: { nurseId: nurse1.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2), patientsCount: 8, servicesCount: 12, emergenciesCount: 2, notes: 'يوم عادي - حالتان طارئتان' } }),
    db.dailyReport.create({ data: { nurseId: nurse2.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2), patientsCount: 6, servicesCount: 9, emergenciesCount: 1, notes: 'يوم هادئ نسبياً' } }),
    db.dailyReport.create({ data: { nurseId: nurse1.id, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), patientsCount: 10, servicesCount: 15, emergenciesCount: 3, notes: 'يوم مزدحم - 3 حالات طوارئ' } }),
  ]);

  console.log('✅ Seed completed successfully!');
  console.log(`   - Users: 3 (1 admin, 2 nurses)`);
  console.log(`   - Patients: 15`);
  console.log(`   - Services: 18`);
  console.log(`   - Emergencies: 8`);
  console.log(`   - Appointments: 10`);
  console.log(`   - Patient Services: 15`);
  console.log(`   - Visits: 5`);
  console.log(`   - Medications: 8`);
  console.log(`   - Payments: 10`);
  console.log(`   - Invoices: 5`);
  console.log(`   - Notifications: 12`);
  console.log(`   - Daily Reports: 3`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
