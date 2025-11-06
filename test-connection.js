// backend/test-connection.js
import "dotenv/config";
import mongoose from "mongoose";

async function testConnection() {
  try {
    console.log("🔍 Testing MongoDB Cloud connection...");
    console.log(`📍 URI: ${process.env.MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}`);
    
    mongoose.set("strictQuery", true);
    
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "employee_assessment",
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log("✅ MongoDB Cloud connection successful!");
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Test a simple query
    const stats = await mongoose.connection.db.stats();
    console.log(`💾 Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    
    if (error.message.includes("authentication")) {
      console.error("💡 Authentication failed - check username/password");
    } else if (error.message.includes("network")) {
      console.error("💡 Network error - check internet connection and IP whitelist");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("💡 DNS resolution failed - check cluster URL");
    }
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Connection closed");
    process.exit(0);
  }
}

testConnection();