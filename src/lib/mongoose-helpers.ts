// Helper to convert Mongoose lean document to Firestore-like format
// Firestore returns: { id: doc.id, ...doc.data() }
// Mongoose lean returns: { _id: ObjectId, ...fields }
// This function maps _id to id for API response compatibility

export function toClient<T extends { _id: any }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as Omit<T, '_id'> & { id: string };
}

export function toClientList<T extends { _id: any }>(docs: T[]): (Omit<T, '_id'> & { id: string })[] {
  return docs.map(toClient);
}
