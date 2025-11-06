// backend/src/seed.js
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import User from "./models/User.js";
import Assessment from "./models/Assessment.js";
import Criteria from "./models/Criteria.js";

(async () => {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await connectDB();

    // =========================
    // 🔄 RESET EXISTING DATA
    // =========================
    console.log("⏳ Resetting database...");
    await Promise.all([
      User.deleteMany({}),
      Assessment.deleteMany({}),
      Criteria.deleteMany({}),
    ]);
    console.log("✅ Cleared old data");

    // =========================
    // 👥 CREATE USERS
    // =========================
    const employeesData = [
      [
        "sarah.johnson",
        "Sarah Johnson",
        "Engineering",
        "Senior Software Engineer",
      ],
      ["michael.chen", "Michael Chen", "Product", "Product Manager"],
      ["emma.nguyen", "Emma Nguyen", "HR", "HR Specialist"],
      ["minh.tran", "Minh Tran", "Marketing", "Marketing Executive"],
      ["david.pham", "David Pham", "Engineering", "Backend Developer"],
      ["anna.le", "Anna Le", "Engineering", "Frontend Developer"],
      ["peter.vo", "Peter Vo", "Sales", "Sales Executive"],
      ["lisa.ho", "Lisa Ho", "Finance", "Accountant"],
      ["kelly.bui", "Kelly Bui", "Marketing", "Content Specialist"],
      ["tommy.ngo", "Tommy Ngo", "IT", "System Support"],
      ["phuong.tran", "Phuong Tran", "Product", "Product Analyst"],
      ["vinh.do", "Vinh Do", "Engineering", "DevOps Engineer"],
    ];

    const users = [
      {
        username: "manager",
        passwordHash: await bcrypt.hash("123456", 10),
        role: "supervisor",
        fullName: "Quản lý Hệ thống",
        email: "manager@company.com",
        department: "Engineering",
        position: "Engineering Manager",
      },
      ...employeesData.map(([username, fullName, dept, position]) => ({
        username,
        passwordHash: bcrypt.hashSync("123456", 10),
        role: "employee",
        fullName,
        email: `${username}@company.com`,
        department: dept,
        position,
      })),
    ];

    const createdUsers = await User.insertMany(users);
    const manager = createdUsers.find((u) => u.role === "supervisor");
    const employees = createdUsers.filter((u) => u.role === "employee");

    console.log(`✅ Created ${employees.length} employees and 1 supervisor`);

    // =========================
    // 🧱 CREATE CRITERIA (version 1)
    // =========================
    
    // Tiêu chí chung cho tất cả phòng ban
    const generalCriteria = [
      {
        code: "G1",
        name: "Giao tiếp",
        description: "Khả năng diễn đạt và lắng nghe",
        department: null, // Chung cho tất cả
        weight: 1.0,
        version: 1,
        isActive: true,
      },
      {
        code: "G2",
        name: "Làm việc nhóm",
        description: "Hợp tác, hỗ trợ, tôn trọng đồng nghiệp",
        department: null,
        weight: 1.0,
        version: 1,
        isActive: true,
      },
      {
        code: "G3",
        name: "Chủ động sáng tạo",
        description: "Đề xuất, cải tiến, tìm kiếm giải pháp mới",
        department: null,
        weight: 1.0,
        version: 1,
        isActive: true,
      },
    ];

    // Tiêu chí riêng cho phòng Engineering/IT
    const engineeringCriteria = [
      {
        code: "E1",
        name: "Kỹ năng lập trình",
        description: "Hiểu biết về ngôn ngữ lập trình và framework",
        department: "Engineering",
        weight: 2.0,
        version: 1,
        isActive: true,
      },
      {
        code: "E2",
        name: "Giải quyết vấn đề kỹ thuật",
        description: "Phân tích và xử lý các vấn đề kỹ thuật phức tạp",
        department: "Engineering",
        weight: 1.5,
        version: 1,
        isActive: true,
      },
      {
        code: "E3",
        name: "Code Quality",
        description: "Viết code sạch, có thể maintain và test được",
        department: "Engineering",
        weight: 1.5,
        version: 1,
        isActive: true,
      },
    ];

    // Tiêu chí riêng cho phòng HR
    const hrCriteria = [
      {
        code: "H1",
        name: "Quản lý nhân sự",
        description: "Kỹ năng tuyển dụng, đào tạo và phát triển nhân viên",
        department: "HR",
        weight: 2.0,
        version: 1,
        isActive: true,
      },
      {
        code: "H2",
        name: "Tư vấn nhân sự",
        description: "Hỗ trợ và tư vấn các vấn đề liên quan đến nhân sự",
        department: "HR",
        weight: 1.5,
        version: 1,
        isActive: true,
      },
    ];

    // Tiêu chí riêng cho phòng Sales
    const salesCriteria = [
      {
        code: "S1",
        name: "Kỹ năng bán hàng",
        description: "Khả năng thuyết phục và chốt đơn hàng",
        department: "Sales",
        weight: 2.5,
        version: 1,
        isActive: true,
      },
      {
        code: "S2",
        name: "Chăm sóc khách hàng",
        description: "Duy trì mối quan hệ tốt với khách hàng",
        department: "Sales",
        weight: 1.5,
        version: 1,
        isActive: true,
      },
      {
        code: "S3",
        name: "Đạt target",
        description: "Hoàn thành mục tiêu doanh số được giao",
        department: "Sales",
        weight: 2.0,
        version: 1,
        isActive: true,
      },
    ];

    // Tiêu chí riêng cho phòng Marketing
    const marketingCriteria = [
      {
        code: "M1",
        name: "Sáng tạo nội dung",
        description: "Tạo ra nội dung marketing hấp dẫn và hiệu quả",
        department: "Marketing",
        weight: 2.0,
        version: 1,
        isActive: true,
      },
      {
        code: "M2",
        name: "Phân tích thị trường",
        description: "Nghiên cứu và phân tích xu hướng thị trường",
        department: "Marketing",
        weight: 1.5,
        version: 1,
        isActive: true,
      },
    ];

    // Tiêu chí riêng cho phòng Finance
    const financeCriteria = [
      {
        code: "F1",
        name: "Kỹ năng kế toán",
        description: "Xử lý các nghiệp vụ kế toán chính xác",
        department: "Finance",
        weight: 2.0,
        version: 1,
        isActive: true,
      },
      {
        code: "F2",
        name: "Phân tích tài chính",
        description: "Phân tích báo cáo tài chính và đưa ra khuyến nghị",
        department: "Finance",
        weight: 1.5,
        version: 1,
        isActive: true,
      },
    ];

    // Tiêu chí riêng cho phòng Product
    const productCriteria = [
      {
        code: "P1",
        name: "Product Strategy",
        description: "Xây dựng chiến lược sản phẩm hiệu quả",
        department: "Product",
        weight: 2.0,
        version: 1,
        isActive: true,
      },
      {
        code: "P2",
        name: "User Research",
        description: "Nghiên cứu người dùng và phân tích feedback",
        department: "Product",
        weight: 1.5,
        version: 1,
        isActive: true,
      },
    ];

    // Tiêu chí riêng cho phòng IT
    const itCriteria = [
      {
        code: "I1",
        name: "Hỗ trợ kỹ thuật",
        description: "Giải quyết các vấn đề kỹ thuật của người dùng",
        department: "IT",
        weight: 2.0,
        version: 1,
        isActive: true,
      },
      {
        code: "I2",
        name: "Quản lý hệ thống",
        description: "Duy trì và vận hành hệ thống IT ổn định",
        department: "IT",
        weight: 1.5,
        version: 1,
        isActive: true,
      },
    ];

    const allCriteria = [
      ...generalCriteria,
      ...engineeringCriteria,
      ...hrCriteria,
      ...salesCriteria,
      ...marketingCriteria,
      ...financeCriteria,
      ...productCriteria,
      ...itCriteria,
    ];

    await Criteria.insertMany(allCriteria);
    console.log(`✅ Seeded ${allCriteria.length} criteria (version 1) with department-specific criteria`);

    // =========================
    // 📊 CREATE ASSESSMENTS DATA
    // =========================
    const cycles = [
      "Q1 2024",
      "Q2 2024",
      "Q3 2024",
      "Q4 2024",
      "Q1 2025",
      "Q2 2025",
      "Q3 2025",
      "Q4 2025",
    ];

    const criteriaTemplate = [
      { key: "technical", label: "Kỹ năng chuyên môn" },
      { key: "communication", label: "Giao tiếp" },
      { key: "teamwork", label: "Làm việc nhóm" },
      { key: "problem", label: "Giải quyết vấn đề" },
      { key: "initiative", label: "Chủ động sáng tạo" },
    ];

    const genCriteria = () =>
      criteriaTemplate.map((c) => ({
        ...c,
        score: +(Math.random() * (5 - 2.5) + 2.5).toFixed(1),
      }));

    console.log("📈 Seeding assessments...");

    const assessments = [];

    for (const emp of employees) {
      for (const cycle of cycles) {
        const overallScore = +(Math.random() * (5 - 2.6) + 2.6).toFixed(1);

        assessments.push({
          employee: emp._id,
          supervisor: manager._id,
          period: "quarterly",
          cycleLabel: cycle,
          overall: overallScore,
          comment: "Nhân viên làm việc tốt, có tinh thần trách nhiệm.",
          criteria: genCriteria(),
          nextGoals: "Tiếp tục cải thiện kỹ năng và phát triển nghề nghiệp.",
        });
      }
    }

    // Bulk insert for performance
    await Assessment.insertMany(assessments);
    console.log(`✅ Inserted ${assessments.length} assessments`);

    // =========================
    // ✅ DONE
    // =========================
    console.log("🌱 Database seeding completed successfully!");
    console.log("🔐 Login with: username: manager | password: 123456");
  } catch (err) {
    console.error("❌ Error while seeding database:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
  }
})();
  