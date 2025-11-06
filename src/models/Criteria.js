import mongoose from "mongoose";

const CriteriaSchema = new mongoose.Schema(
  {
    code: { type: String, required: true }, // VD: C1, C2
    name: { type: String, required: true }, // VD: Teamwork
    description: String,
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    // Thêm trường phòng ban - null có nghĩa là áp dụng cho tất cả phòng ban
    department: { 
      type: String, 
      default: null,
      trim: true 
    }, // VD: "IT", "HR", "Sales", null (cho tất cả)
    // Trọng số của tiêu chí (để tính điểm tổng hợp)
    weight: { 
      type: Number, 
      default: 1,
      min: 0.1,
      max: 5 
    },
  },
  { timestamps: true }
);

// Index để truy vấn nhanh theo phòng ban và version
CriteriaSchema.index({ department: 1, version: 1, isActive: 1 });
CriteriaSchema.index({ version: 1, isActive: 1 });

export default mongoose.model("Criteria", CriteriaSchema);
