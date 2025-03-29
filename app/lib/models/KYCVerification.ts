import mongoose, { Schema, Document } from "mongoose";

export interface IKYCVerification extends Document {
  walletAddress: string;
  isVerified: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const kycVerificationSchema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Check if the model is already defined to prevent overwriting
export const KYCVerification =
  mongoose.models.KYCVerification ||
  mongoose.model<IKYCVerification>("KYCVerification", kycVerificationSchema);
