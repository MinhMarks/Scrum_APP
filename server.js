// backend/server.js
import "dotenv/config"; // Tự động load biến môi trường từ .env
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./src/db.js";

// Import các route
import authRoutes from "./src/routes/auth.js";
import employeeRoutes from "./src/routes/employees.js";
import assessmentRoutes from "./src/routes/assessments.js";
import criteriaRoutes from "./src/routes/criteria.js";

const app = express();

// =====================
// 🧩 Middleware
// =====================
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Cho phép tất cả Vercel preview URLs
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Kiểm tra whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" })); // hạn chế payload lớn
app.use(morgan("dev")); // log HTTP request

// =====================
// ✅ Health check route
// =====================
app.get("/", (_, res) =>
  res.status(200).send("✅ Employee Assessment API running")
);

// =====================
// 🧠 API routes
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/criteria", criteriaRoutes);

// =====================
// ⚠️ Error handler (global)
// =====================
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught error:", err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

// =====================
// 🚀 Server start
// =====================
const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
      console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
      console.log(`📊 Database: employee_assessment`);
      console.log(`🔑 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err.message);
    console.error("💡 Please check your MongoDB connection and environment variables");
    process.exit(1);
  });
