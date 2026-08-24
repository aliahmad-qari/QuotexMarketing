import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('[Database] MONGODB_URI not provided. Running in high-performance in-memory repository mode.');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = conn.connection.readyState === 1;
    console.log(`[Database] Connected to MongoDB Atlas (${conn.connection.host})`);
    return true;
  } catch (error) {
    console.warn('[Database] MongoDB connection failed. Falling back to in-memory store:', (error as Error).message);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
