import mongoose, { Schema, Document } from "mongoose";

export interface IKYCVerification extends Document {
  walletAddress: string;
  isVerified: boolean;
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
  },
  {
    timestamps: true,
  }
);

// Check if the model is already defined to prevent overwriting
export const KYCVerification =
  mongoose.models.KYCVerification ||
  mongoose.model<IKYCVerification>("KYCVerification", kycVerificationSchema);
