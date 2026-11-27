import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGlobalIndustry extends Document {
  name: string;        // canonical display name (e.g. "Electricity & Power")
  normalized: string;  // lowercase, punctuation-stripped, used for dedup
  usageCount: number;  // how many leads reference it (best-effort)
  createdBy: string;   // user who first added it
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

const GlobalIndustrySchema = new Schema<IGlobalIndustry>(
  {
    name:       { type: String, required: true, trim: true },
    normalized: { type: String, required: true, trim: true, unique: true, index: true },
    usageCount: { type: Number, default: 0, index: true },
    createdBy:  { type: String, trim: true },
    createdById:{ type: String, trim: true },
  },
  { timestamps: true }
);

const GlobalIndustry: Model<IGlobalIndustry> =
  mongoose.models.GlobalIndustry ||
  mongoose.model<IGlobalIndustry>("GlobalIndustry", GlobalIndustrySchema);

export default GlobalIndustry;