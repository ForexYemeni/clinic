import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('clinicConfig').limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ name: 'عيادة الإسعافات الأولية', isFirstSetup: false });
    }
    const data = snapshot.docs[0].data();
    return NextResponse.json({
      name: data.name || 'عيادة الإسعافات الأولية',
      isFirstSetup: data.isFirstSetup || false,
    });
  } catch (error) {
    return NextResponse.json({ error: 'خطأ في جلب بيانات العيادة' }, { status: 500 });
  }
}
