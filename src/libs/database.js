import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("Kết nối cơ sở dữ liệu thành công!");
  } catch (err) {
    console.error("Kết nối cơ sở dữ liệu thất bại:", err);
    process.exit(1);
  }
};
