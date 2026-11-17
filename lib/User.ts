import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export type Role = "admin" | "business_developer";

export interface IUser extends Document {
  username: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  passwordRequest?: boolean;
  requestDate?: Date;
  tempPassword?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    profilePicture: { type: String, default: "" },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["admin", "business_developer"], default: "business_developer", required: true },
    passwordRequest: { type: Boolean, default: false },
    requestDate: { type: Date },
    tempPassword: { type: String, default: "" },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;