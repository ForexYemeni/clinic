export function toClient(doc: any): any {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  if (obj.__v !== undefined) delete obj.__v;
  return obj;
}

export function toClientList(docs: any[]): any[] {
  return docs.map(toClient);
}
