import mongoose from 'mongoose';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, memoryServer: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (MONGODB_URI) {
      // Use the configured MongoDB URI
      cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
    } else {
      // Fallback to mongodb-memory-server
      console.log('[MongoDB] No MONGODB_URI found, starting in-memory MongoDB server...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const memoryServer = await MongoMemoryServer.create();
      cached.memoryServer = memoryServer;
      const uri = memoryServer.getUri();
      console.log('[MongoDB] In-memory server started at:', uri);
      cached.promise = mongoose.connect(uri).then((m) => m);
    }
  }

  try {
    cached.conn = await cached.promise;
    console.log('[MongoDB] Connected successfully');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

export default dbConnect;
