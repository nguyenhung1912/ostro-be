import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    mongoose.connection.on("disconnected", () => {
      console.log("Mất kết nối MongoDB!");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Lỗi kết nối MongoDB:", err);
    });

    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("Kết nối cơ sở dữ liệu thành công!");
  } catch (err) {
    console.error("Kết nối cơ sở dữ liệu ban đầu thất bại:", err);
    process.exit(1);
  }
};
