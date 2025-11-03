import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/payment-tracker";

let cached = (global as any).mongoose || { conn: null, promise: null };

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(
        "Connected to MongoDBsddddddddddddddddddddddddddddddddddddddddd"
      );
      return mongoose;
    });
  }

  try {
    console.log("Connected to ");

    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export const disconnectDB = async () => {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("Disconnected from MongoDB");
  }
};
