import mongoose from "mongoose";

const connectionString = process.env.DATABASE_CONNECTION_STRING;

export default async function connectDB() {
  try {
    if (!connectionString) {
      throw new Error("Database connection string not found");
    }
    await mongoose.connect(connectionString);
    console.log("MongoDB connected successfully");
  } catch (error: any) {
    console.error("MongoDB connection failed:", error?.message);
    process.exit(1);
  }
}

// module.exports = connectDB;
