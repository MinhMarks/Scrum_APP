import jwt from "jsonwebtoken";
import User from "../models/User.js";

export function requireAuth(roles = []) {
  return async (req, res, next) => {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (!token) return res.status(401).json({ message: "No token" });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(payload.id).lean();
      if (!req.user) return res.status(401).json({ message: "Invalid user" });

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (e) {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
}
