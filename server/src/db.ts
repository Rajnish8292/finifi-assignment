import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      await mongoose.connect(uri);
      console.log('Connected to MongoDB via URI:', uri);
      return;
    } catch (error) {
      console.warn('Failed to connect to MONGODB_URI. Falling back to MongoMemoryServer...', error);
    }
  }

  // Fallback to in-memory MongoDB
  mongoMemoryServer = await MongoMemoryServer.create();
  const memoryUri = mongoMemoryServer.getUri();
  await mongoose.connect(memoryUri);
  console.log('Connected to In-Memory MongoDB at:', memoryUri);
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
}
