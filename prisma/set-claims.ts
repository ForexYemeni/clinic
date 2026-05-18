import { adminAuth } from '../src/lib/firebase-admin';

async function main() {
  await adminAuth.setCustomUserClaims('admin-001', { role: 'admin' });
  console.log('✅ Admin claims set');
  await adminAuth.setCustomUserClaims('nurse-001', { role: 'nurse' });
  console.log('✅ Nurse 1 claims set');
  await adminAuth.setCustomUserClaims('nurse-002', { role: 'nurse' });
  console.log('✅ Nurse 2 claims set');
}

main().catch(console.error);
