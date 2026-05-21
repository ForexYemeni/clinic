import dbConnect from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { extractAuthAndClinicId } from '@/lib/auth';
import Patient from '@/models/Patient';
import Visit from '@/models/Visit';
import Invoice from '@/models/Invoice';
import Service from '@/models/Service';
import { toClient } from '@/lib/mongoose-helpers';

// GET: Get patient detail with visits, services, invoices
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const result = await Patient.findById(id).lean();

    if (result === null) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    // Verify clinic ownership (strict: reject if clinicId mismatch or missing)
    const patientClinicId = result.clinicId;
    if (!effectiveClinicId || (patientClinicId && patientClinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const patientData = toClient(result);

    // Get related visits (filtered by clinicId)
    let visits: any[] = [];
    try {
      visits = await Visit.find({
        patientId: id,
        clinicId: effectiveClinicId || patientClinicId,
      })
        .sort({ visitDate: -1 })
        .lean();
      visits = visits.map((v: any) => toClient(v));
    } catch (visitErr) {
      console.warn('Visits query failed, trying without sort:', visitErr);
      try {
        visits = await Visit.find({
          patientId: id,
          clinicId: effectiveClinicId || patientClinicId,
        }).lean();
        visits = visits
          .map((v: any) => toClient(v))
          .sort((a: any, b: any) => (b.visitDate || '').localeCompare(a.visitDate || ''));
      } catch (e2) {
        console.error('Visits query fallback also failed:', e2);
      }
    }

    // Get related invoices (filtered by clinicId)
    let invoices: any[] = [];
    try {
      const invoiceResults = await Invoice.find({
        patientId: id,
        clinicId: effectiveClinicId || patientClinicId,
      })
        .sort({ createdAt: -1 })
        .lean();
      invoices = invoiceResults.map((d: any) => {
        const data = toClient(d) as any;
        data.remaining = data.remaining ?? (data.total - (data.paid || 0));
        return data;
      });
    } catch (invErr) {
      console.warn('Invoices query failed, trying without sort:', invErr);
      try {
        const invoiceResults = await Invoice.find({
          patientId: id,
          clinicId: effectiveClinicId || patientClinicId,
        }).lean();
        invoices = invoiceResults.map((d: any) => {
          const data = toClient(d) as any;
          data.remaining = data.remaining ?? (data.total - (data.paid || 0));
          return data;
        }).sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      } catch (e2) {
        console.error('Invoices query fallback also failed:', e2);
      }
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
        if (serviceDoc !== null) {
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
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;
    const body = await request.json();

    // Check if patient exists
    const patientDoc = await Patient.findById(id).lean();
    if (patientDoc === null) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    // Verify clinic ownership (strict: reject if clinicId mismatch or missing)
    const patientClinicId = patientDoc.clinicId;
    if (!effectiveClinicId || (patientClinicId && patientClinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
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

    await Patient.findByIdAndUpdate(id, { $set: updateData });

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
    const { auth, effectiveClinicId } = extractAuthAndClinicId(request);
    const { id } = await params;

    // Check if patient exists
    const patientDoc = await Patient.findById(id).lean();
    if (patientDoc === null) {
      return NextResponse.json(
        { error: 'المريض غير موجود' },
        { status: 404 }
      );
    }

    // Verify clinic ownership (strict: reject if clinicId mismatch or missing)
    const patientClinicId = patientDoc.clinicId;
    if (!effectiveClinicId || (patientClinicId && patientClinicId !== effectiveClinicId)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Delete related visits, invoices (strict: require clinicId)
    const clinicFilter = effectiveClinicId || patientClinicId;
    if (!clinicFilter) {
      return NextResponse.json({ error: 'لم يتم تحديد العيادة' }, { status: 400 });
    }

    await Promise.all([
      Visit.deleteMany({ patientId: id, clinicId: clinicFilter }),
      Invoice.deleteMany({ patientId: id, clinicId: clinicFilter }),
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
