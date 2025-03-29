import mongoose, { Schema, Document } from "mongoose";

export type VerificationStatus =
  | "Not Started"
  | "In Progress"
  | "Approved"
  | "Declined"
  | "In Review"
  | "Expired"
  | "Abandoned"
  | "Kyc Expired";

export interface IKYCVerification extends Document {
  walletAddress: string;
  status: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const kycVerificationSchema = new Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: [
        "Not Started",
        "In Progress",
        "Approved",
        "Declined",
        "In Review",
        "Expired",
        "Abandoned",
        "Kyc Expired",
      ],
      default: "Not Started",
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
