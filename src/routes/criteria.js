import { Router } from "express";
import Criteria from "../models/Criteria.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * ===========================================================
 *  GET /api/criteria
 *  👉 Lấy danh sách tiêu chí đang áp dụng (isActive = true)
 *  Query params: ?department=IT (lấy tiêu chí cho phòng ban cụ thể)
 * ===========================================================
 */
router.get("/", requireAuth(["supervisor", "employee"]), async (req, res) => {
  try {
    const { department } = req.query;
    let query = { isActive: true };
    
    if (department) {
      // Lấy tiêu chí cho phòng ban cụ thể + tiêu chí chung (department: null)
      query = {
        isActive: true,
        $or: [
          { department: department },
          { department: null }
        ]
      };
    }
    
    const criteria = await Criteria.find(query)
      .sort({ department: 1, code: 1 })
      .lean();
    res.json(criteria);
  } catch (err) {
    console.error("Error fetching criteria:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách tiêu chí" });
  }
});

/**
 * ===========================================================
 *  GET /api/criteria/all
 *  👉 Lấy tất cả version tiêu chí (cũ + mới)
 * ===========================================================
 */
router.get("/all", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const all = await Criteria.find()
      .sort({ version: -1, department: 1, code: 1 })
      .lean();
    res.json(all);
  } catch (err) {
    console.error("Error fetching all criteria:", err);
    res.status(500).json({ message: "Lỗi khi lấy toàn bộ tiêu chí" });
  }
});

/**
 * ===========================================================
 *  GET /api/criteria/departments
 *  👉 Lấy danh sách các phòng ban có tiêu chí riêng
 * ===========================================================
 */
router.get("/departments", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const departments = await Criteria.distinct("department", { 
      department: { $ne: null },
      isActive: true 
    });
    res.json(departments.sort());
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng ban" });
  }
});

/**
 * ===========================================================
 *  POST /api/criteria
 *  👉 Tạo version mới (tự động vô hiệu version cũ)
 * ===========================================================
 */
router.post("/", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const { version, list, department } = req.body;

    if (!list?.length || !version) {
      return res
        .status(400)
        .json({ message: "Thiếu dữ liệu version hoặc list" });
    }

    // 🔹 Vô hiệu version cũ cho phòng ban cụ thể hoặc tất cả
    if (department) {
      await Criteria.updateMany({ department }, { isActive: false });
    } else {
      await Criteria.updateMany({}, { isActive: false });
    }

    // 🔹 Tạo bộ version mới
    const inserted = await Criteria.insertMany(
      list.map((c) => ({
        code: c.code,
        name: c.name,
        description: c.description || "",
        department: department || null,
        weight: c.weight || 1,
        version,
        isActive: true,
      }))
    );

    const deptLabel = department ? ` cho phòng ban ${department}` : " chung";
    res.status(201).json({
      message: `Đã tạo bộ tiêu chí version ${version}${deptLabel}`,
      count: inserted.length,
      inserted,
    });
  } catch (err) {
    console.error("Error creating new criteria version:", err);
    res.status(500).json({ message: "Lỗi khi tạo bộ tiêu chí mới" });
  }
});

/**
 * ===========================================================
 *  PUT /api/criteria/:id
 *  👉 Cập nhật tiêu chí (chỉ cho version active)
 * ===========================================================
 */
router.put("/:id", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const { name, description, weight, department } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (weight) updateData.weight = weight;
    if (department !== undefined) updateData.department = department || null;

    const updated = await Criteria.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      updateData,
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hoặc tiêu chí không còn active" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating criteria:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật tiêu chí" });
  }
});

/**
 * ===========================================================
 *  DELETE /api/criteria/:id
 *  👉 Xoá tiêu chí trong version hiện hành
 * ===========================================================
 */
router.delete("/:id", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const deleted = await Criteria.findOneAndDelete({
      _id: req.params.id,
      isActive: true,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hoặc tiêu chí không còn active" });
    }

    res.json({ message: `Đã xoá tiêu chí ${deleted.code} - ${deleted.name}` });
  } catch (err) {
    console.error("Error deleting criteria:", err);
    res.status(500).json({ message: "Lỗi khi xoá tiêu chí" });
  }
});

/**
 * ===========================================================
 *  PUT /api/criteria/activate/:version
 *  👉 Kích hoạt lại version cũ (tự động vô hiệu hoá các version khác)
 * ===========================================================
 */
router.put(
  "/activate/:version",
  requireAuth(["supervisor"]),
  async (req, res) => {
    try {
      const { version } = req.params;

      // 🔸 Vô hiệu toàn bộ version hiện tại
      await Criteria.updateMany({}, { isActive: false });

      // 🔸 Kích hoạt version được chọn
      const result = await Criteria.updateMany(
        { version: Number(version) },
        { isActive: true }
      );

      if (result.modifiedCount === 0) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy version cần kích hoạt" });
      }

      res.json({
        message: `✅ Đã kích hoạt version ${version}`,
        updated: result.modifiedCount,
      });
    } catch (err) {
      console.error("Error activating version:", err);
      res.status(500).json({ message: "Lỗi khi kích hoạt version" });
    }
  }
);

export default router;
