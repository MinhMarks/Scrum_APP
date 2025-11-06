import { Router } from "express";
import Assessment from "../models/Assessment.js";
import Criteria from "../models/Criteria.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/assessments
 * Supervisor tạo đánh giá cho nhân viên
 * Body:
 * {
 *   employee: "<employeeId>",
 *   period: "quarterly",
 *   cycleLabel: "Q4 2025",
 *   criteria: [
 *     { key: "technical", label: "Kỹ năng chuyên môn", score: 4 },
 *     { key: "communication", label: "Giao tiếp", score: 5 }
 *   ],
 *   comment: "...",
 *   nextGoals: "..."
 * }
 */
router.post("/", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const { employee, period, cycleLabel, criteria, comment, nextGoals } =
      req.body;

    // Kiểm tra bắt buộc
    if (!employee || !period || !cycleLabel || !criteria?.length) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    // 🔹 Snapshot tiêu chí từ DB (đảm bảo tiêu chí hiện hành)
    const activeCriteria = await Criteria.find({ isActive: true });
    const snapshot = criteria.map((c) => {
      const match = activeCriteria.find(
        (ac) => ac.code === c.code || ac.name === c.label
      );
      return {
        key: c.key || match?.code || "",
        label: c.label || match?.name || "",
        score: c.score ?? 0,
        comment: c.comment ?? "",
      };
    });

    // 🔹 Tạo document mới
    const doc = await Assessment.create({
      employee,
      supervisor: req.user._id,
      period,
      cycleLabel,
      criteria: snapshot,
      comment,
      nextGoals,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("Error creating assessment:", err);
    res.status(500).json({ message: "Lỗi khi tạo đánh giá" });
  }
});

/**
 * GET /api/assessments/me
 * Employee xem toàn bộ đánh giá của chính mình
 */
router.get("/me", requireAuth(["employee"]), async (req, res) => {
  try {
    const items = await Assessment.find({ employee: req.user._id })
      .populate("supervisor", "fullName email position")
      .sort("-createdAt")
      .lean();

    res.json(items);
  } catch (err) {
    console.error("Error fetching employee assessments:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu" });
  }
});

/**
 * GET /api/assessments/employee/:id
 * Supervisor xem lịch sử đánh giá của 1 nhân viên cụ thể
 */
router.get("/employee/:id", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const items = await Assessment.find({ employee: req.params.id })
      .populate("employee", "fullName email position department")
      .sort("-createdAt")
      .lean();

    res.json(items);
  } catch (err) {
    console.error("Error fetching employee assessments:", err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu" });
  }
});

/**
 * GET /api/assessments/:id
 * Lấy chi tiết 1 bản đánh giá
 */
router.get(
  "/:id",
  requireAuth(["supervisor", "employee"]),
  async (req, res) => {
    try {
      const doc = await Assessment.findById(req.params.id)
        .populate("employee", "fullName email position")
        .populate("supervisor", "fullName email")
        .lean();

      if (!doc)
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      res.json(doc);
    } catch (err) {
      console.error("Error fetching assessment detail:", err);
      res.status(500).json({ message: "Lỗi khi lấy chi tiết đánh giá" });
    }
  }
);

/**
 * PUT /api/assessments/:id
 * Supervisor cập nhật đánh giá (chỉ được sửa comment, goals, hoặc criteria score)
 */
router.put("/:id", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const updateFields = (({ criteria, comment, nextGoals }) => ({
      criteria,
      comment,
      nextGoals,
    }))(req.body);

    const doc = await Assessment.findOneAndUpdate(
      { _id: req.params.id, supervisor: req.user._id },
      updateFields,
      { new: true }
    );

    if (!doc)
      return res
        .status(404)
        .json({ message: "Không tìm thấy hoặc không có quyền cập nhật" });
    res.json(doc);
  } catch (err) {
    console.error("Error updating assessment:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật đánh giá" });
  }
});

/**
 * DELETE /api/assessments/:id
 * Supervisor xoá 1 bản đánh giá (tuỳ chọn)
 */
router.delete("/:id", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const doc = await Assessment.findOneAndDelete({
      _id: req.params.id,
      supervisor: req.user._id,
    });

    if (!doc)
      return res
        .status(404)
        .json({ message: "Không tìm thấy hoặc không có quyền xoá" });
    res.json({ message: "Đã xoá đánh giá", id: req.params.id });
  } catch (err) {
    console.error("Error deleting assessment:", err);
    res.status(500).json({ message: "Lỗi khi xoá đánh giá" });
  }
});

export default router;
