import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Clinic from '@/models/Clinic';
import { NextResponse } from 'next/server';

// GET: Health check - test MongoDB connection and data status
export async function GET() {
  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    database: 'unknown',
  };

  try {
    await dbConnect();
    result.database = 'connected';

    const userCount = await User.countDocuments();
    const clinicCount = await Clinic.countDocuments();

    result.users = userCount;
    result.clinics = clinicCount;
    result.hasSetup = clinicCount > 0;

    if (clinicCount > 0) {
      const clinic = await Clinic.findOne().lean();
      result.clinicName = clinic?.name || '';
      result.setupComplete = clinic?.setupComplete || false;
    }

    if (userCount > 0) {
      const adminUser = await User.findOne({ role: 'admin' }).lean();
      result.hasAdmin = !!adminUser;
      if (adminUser) {
        result.adminPhone = adminUser.phone;
      }
    }
  } catch (error) {
    result.database = 'error';
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json(result);
}
