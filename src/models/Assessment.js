import mongoose from "mongoose";

/**
 * Assessment Model
 * -----------------
 * Mô tả một lần đánh giá hiệu suất của nhân viên (Employee)
 * do Supervisor thực hiện trong một kỳ (biweekly, monthly, quarterly, yearly).
 *
 * Dữ liệu `criteria` được lưu dưới dạng snapshot — tức là tại thời điểm đánh giá,
 * tiêu chí sẽ được ghi cứng (key, label, score) để không bị thay đổi nếu bộ tiêu chí
 * trong tương lai được cập nhật.
 */

const AssessmentSchema = new mongoose.Schema(
  {
    // Liên kết tới nhân viên được đánh giá
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Người đánh giá (Supervisor)
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Chu kỳ đánh giá
    period: {
      type: String,
      enum: ["biweekly", "monthly", "quarterly", "yearly"],
      required: true,
    },

    // Nhãn cụ thể cho kỳ (ví dụ: "Q4 2024" hoặc "Tháng 10/2025")
    cycleLabel: {
      type: String,
      required: true,
      trim: true,
    },

    // Snapshot bộ tiêu chí tại thời điểm đánh giá
    criteria: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        }, // ví dụ: "technical", "communication"
        label: {
          type: String,
          required: true,
          trim: true,
        }, // ví dụ: "Kỹ năng chuyên môn"
        score: {
          type: Number,
          min: 0,
          max: 5,
          required: true,
        },
        comment: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],

    // Nhận xét tổng quát của Supervisor
    comment: {
      type: String,
      default: "",
      trim: true,
    },

    // Mục tiêu kế tiếp của nhân viên (Next Goals)
    nextGoals: {
      type: String,
      default: "",
      trim: true,
    },

    // Điểm tổng hợp chung (overall rating)
    overall: {
      type: Number,
      min: 0,
      max: 5,
      default: function () {
        if (!this.criteria?.length) return 0;
        const sum = this.criteria.reduce((a, c) => a + (c.score || 0), 0);
        return Math.round((sum / this.criteria.length) * 10) / 10; // làm tròn 1 chữ số thập phân
      },
    },
  },
  { timestamps: true }
);

// 🔹 Index để truy vấn nhanh theo kỳ và nhân viên
AssessmentSchema.index({ employee: 1, period: 1, cycleLabel: 1 });
AssessmentSchema.index({ supervisor: 1, createdAt: -1 });

// 🔹 Trước khi lưu, đảm bảo overall luôn đúng nếu criteria thay đổi
AssessmentSchema.pre("save", function (next) {
  if (this.criteria?.length) {
    const sum = this.criteria.reduce((a, c) => a + (c.score || 0), 0);
    this.overall = Math.round((sum / this.criteria.length) * 10) / 10;
  }
  next();
});

export default mongoose.model("Assessment", AssessmentSchema);
