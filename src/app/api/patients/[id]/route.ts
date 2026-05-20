import dbConnect from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Service from '@/models/Service';
import { toClient } from '@/lib/mongoose-helpers';
import { NextRequest, NextResponse } from 'next/server';

// GET: Get patient detail with visits, services, invoices
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const patientDoc = await Patient.findById(id).lean();

    if (!patientDoc) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    const patientData = toClient(patientDoc);

    // Get related visits
    let visits: any[] = [];
    try {
      visits = await Visit.find({ patientId: id })
        .sort({ visitDate: -1 })
        .lean();
      visits = visits.map((v) => toClient(v));
    } catch (visitErr) {
      console.warn('Visits query failed:', visitErr);
    }

    // Get related invoices
    let invoices: any[] = [];
    try {
      invoices = await Invoice.find({ patientId: id })
        .sort({ createdAt: -1 })
        .lean();
      invoices = invoices.map((inv) => {
        const data = toClient(inv);
        data.remaining = data.remaining ?? (data.total - (data.paid || 0));
        return data;
      });
    } catch (invErr) {
      console.warn('Invoices query failed:', invErr);
    }

    // Get unique service IDs from visits
    const serviceIds = new Set<string>();
    visits.forEach((visit: any) => {
      if (visit.serviceIds && Array.isArray(visit.serviceIds)) {
        visit.serviceIds.forEach((sid: string) => serviceIds.add(sid));
      }
    });

    // Fetch service details for those IDs
    const services: any[] = [];
    for (const serviceId of serviceIds) {
      try {
        const serviceDoc = await Service.findById(serviceId).lean();
        if (serviceDoc) {
          services.push(toClient(serviceDoc));
        }
      } catch {}
    }

    return NextResponse.json({
      ...patientData,
      visits,
      services,
      invoices,
    });
  } catch (error) {
    console.error('Get patient error:', error);
    return NextResponse.json(
      { error: 'خطأ في جلب بيانات المريض' },
      { status: 500 }
    );
  }
}

// PUT: Update patient info
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    // Check if patient exists
    const patientDoc = await Patient.findById(id).lean();
    if (!patientDoc) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.age !== undefined) updateData.age = body.age;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.emergencyPhone !== undefined) updateData.emergencyPhone = body.emergencyPhone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.bloodType !== undefined) updateData.bloodType = body.bloodType;
    if (body.chronicDiseases !== undefined) updateData.chronicDiseases = body.chronicDiseases;
    if (body.allergies !== undefined) updateData.allergies = body.allergies;
    if (body.medicalHistory !== undefined) updateData.medicalHistory = body.medicalHistory;
    if (body.notes !== undefined) updateData.notes = body.notes;

    await Patient.findByIdAndUpdate(id, updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    console.error('Update patient error:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث بيانات المريض' },
      { status: 500 }
    );
  }
}

// DELETE: Delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    // Check if patient exists
    const patientDoc = await Patient.findById(id).lean();
    if (!patientDoc) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    // Delete related visits, invoices, and the patient
    await Promise.all([
      Visit.deleteMany({ patientId: id }),
      Invoice.deleteMany({ patientId: id }),
      Patient.findByIdAndDelete(id),
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Delete patient error:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف المريض' },
      { status: 500 }
    );
  }
}
