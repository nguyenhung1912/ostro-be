import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("Database connected successfully!");
  } catch (err) {
    console.error("Connection failed: ", err);
    process.exit(1); // exit if db connection fails
  }
};
