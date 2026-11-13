import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export type Role = "admin" | "employee";

export interface IUser extends Document {
  username: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  passwordRequest?: boolean;
  requestDate?: Date;
  tempPassword?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["admin", "employee"], default: "employee", required: true },
    passwordRequest: { type: Boolean, default: false },
    requestDate: { type: Date },
    tempPassword: { type: String, default: "" },
    securityQuestion: { type: String, default: "" },
    securityAnswer: { type: String, default: "" },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("securityAnswer") || !this.securityAnswer) return;
  const salt = await bcrypt.genSalt(10);
  this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase().trim(), salt);
});

UserSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Force Mongoose to drop the old cached schema
delete mongoose.models.User;

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;