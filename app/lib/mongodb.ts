import mongoose from "mongoose";

type CachedType = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: { conn: null; promise: null } | CachedType;
}

if (!process.env.NEXT_PUBLIC_MONGODB_URI) {
  throw new Error("Please add your NEXT_PUBLIC_MONGODB_URI to .env");
}

const NEXT_PUBLIC_MONGODB_URI: string = process.env.NEXT_PUBLIC_MONGODB_URI;

let cached = global.mongoose || { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached = global.mongoose = {
      conn: null,
      promise: mongoose.connect(NEXT_PUBLIC_MONGODB_URI, opts),
    };
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
