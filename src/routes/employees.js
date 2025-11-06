import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/employees - Lấy danh sách nhân viên
router.get("/", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" })
      .select("-passwordHash")
      .lean();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách nhân viên", error: error.message });
  }
});

// GET /api/employees/:id - Lấy thông tin một nhân viên
router.get("/:id", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, role: "employee" })
      .select("-passwordHash")
      .lean();
    
    if (!employee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin nhân viên", error: error.message });
  }
});

// POST /api/employees - Tạo nhân viên mới
router.post("/", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const { username, password, fullName, email, department, position } = req.body;

    // Validate required fields
    if (!username || !password || !fullName) {
      return res.status(400).json({ 
        message: "Tên đăng nhập, mật khẩu và họ tên là bắt buộc" 
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new employee
    const newEmployee = new User({
      username,
      passwordHash,
      fullName,
      email,
      department,
      position,
      role: "employee"
    });

    await newEmployee.save();

    // Return employee without password
    const employeeResponse = newEmployee.toObject();
    delete employeeResponse.passwordHash;

    res.status(201).json({
      message: "Tạo nhân viên thành công",
      employee: employeeResponse
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo nhân viên", error: error.message });
  }
});

// PUT /api/employees/:id - Cập nhật thông tin nhân viên
router.put("/:id", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const { fullName, email, department, position, password } = req.body;
    const updateData = {};

    // Build update object
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (position) updateData.position = position;

    // Check if email is being changed and already exists
    if (email) {
      const existingEmail = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
    }

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedEmployee = await User.findOneAndUpdate(
      { _id: req.params.id, role: "employee" },
      updateData,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    res.json({
      message: "Cập nhật thông tin nhân viên thành công",
      employee: updatedEmployee
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật nhân viên", error: error.message });
  }
});

// DELETE /api/employees/:id - Xóa nhân viên
router.delete("/:id", requireAuth(["supervisor"]), async (req, res) => {
  try {
    const deletedEmployee = await User.findOneAndDelete({ 
      _id: req.params.id, 
      role: "employee" 
    });

    if (!deletedEmployee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    res.json({
      message: "Xóa nhân viên thành công",
      employee: {
        _id: deletedEmployee._id,
        username: deletedEmployee.username,
        fullName: deletedEmployee.fullName
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa nhân viên", error: error.message });
  }
});

export default router;
