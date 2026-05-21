# Batch 2 - Firebase to MongoDB API Route Conversion

## Summary
Converted 10 Firebase Firestore API routes to MongoDB/Mongoose, following the established conversion rules.

## Files Converted

1. **src/app/api/patients/route.ts** - Patient listing (GET with search) and creation (POST)
2. **src/app/api/patients/[id]/route.ts** - Patient detail (GET with visits/services/invoices), update (PUT), delete (DELETE with cascading)
3. **src/app/api/platform/migrate/route.ts** - Migration check (GET) and admin-to-super_admin promotion (POST)
4. **src/app/api/platform/reset/route.ts** - Full platform reset (DELETE)
5. **src/app/api/platform/route.ts** - Platform config GET/PUT
6. **src/app/api/platform/setup/route.ts** - Platform setup check (GET) and super admin creation (POST)
7. **src/app/api/reports/route.ts** - Reports with complex queries (GET)
8. **src/app/api/salary/route.ts** - Salary withdrawals CRUD (GET/POST/PUT/DELETE)
9. **src/app/api/services/route.ts** - Service listing (GET) and creation (POST)
10. **src/app/api/services/[id]/route.ts** - Service update (PUT) and soft-delete (DELETE)

## Key Conversion Patterns Applied

- `import { adminDb } from '@/lib/firebase-admin'` → `import dbConnect from '@/lib/mongodb'` + model imports
- `await dbConnect()` added at start of every handler
- `adminDb.collection('X').where(...).get()` → `Model.find({...}).lean()`
- `adminDb.collection('X').doc(id).get()` → `Model.findById(id).lean()`
- `adminDb.collection('X').add(data)` → `Model.create(data)` + `toClient()`
- `adminDb.collection('X').doc(id).update({...})` → `Model.findByIdAndUpdate(id, { $set: {...} })`
- `adminDb.collection('X').doc(id).delete()` → `Model.findByIdAndDelete(id)`
- `doc.exists` → `result !== null`
- `doc.id` → `result._id.toString()` or via `toClient()` which adds `id`
- `doc.data()` → just the result object (or `toClient()`)
- `snapshot.empty` → `results.length === 0`
- `snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))` → `toClientList(results)`
- Batch operations: `adminDb.batch()` → `Model.deleteMany({})` or `Model.updateMany()` or `Model.insertMany()`
- `toClient`/`toClientList` imported from `@/lib/mongoose-helpers`
- Models imported from `@/models/XXX`
- All auth and multi-tenant imports preserved as-is
- All error messages, status codes, and business logic preserved exactly

## Lint Status
✅ All 10 converted files pass lint with zero errors.

## Dev Server
✅ Server running without compilation errors.
