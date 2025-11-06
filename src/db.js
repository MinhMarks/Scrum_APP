// backend/src/db.js
import mongoose from "mongoose";

export async function connectDB() {
  try {
    mongoose.set("strictQuery", true);
    
    // Kiểm tra MONGO_URI có tồn tại không
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    
    console.log("🔗 Connecting to MongoDB Cloud...");
    
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "employee_assessment",
      // Các options cho MongoDB Cloud
      retryWrites: true,
      w: "majority",
      // Timeout settings
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log("✅ MongoDB Cloud connected successfully");
    console.log(`📊 Database: employee_assessment`);
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    
    // Log chi tiết hơn cho debugging
    if (error.message.includes("MONGO_URI")) {
      console.error("💡 Please check your .env file and ensure MONGO_URI is set correctly");
    } else if (error.message.includes("authentication")) {
      console.error("💡 Please check your MongoDB credentials");
    } else if (error.message.includes("network")) {
      console.error("💡 Please check your internet connection and MongoDB network access");
    }
    
    process.exit(1);
  }
}
