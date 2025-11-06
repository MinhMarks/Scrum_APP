import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    fullName: String,
    email: String,
    department: String,
    position: String,
    role: { type: String, enum: ["supervisor", "employee"], required: true }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
