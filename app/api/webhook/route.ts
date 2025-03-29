import { NextResponse } from "next/server";
import { verifyFractalWebhook } from "../../lib/fractal";
import dbConnect from "../../lib/mongodb";
import { KYCVerification } from "../../lib/models/KYCVerification";

export async function POST(request: Request) {
  try {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.FRACTAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("FRACTAL_WEBHOOK_SECRET is not configured");
    }

    // Get the raw body and signature from the request
    const body = await request.text();
    const signature = request.headers.get("x-fractal-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Verify the webhook signature
    const isValid = verifyFractalWebhook(webhookSecret, body, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the webhook payload
    const payload = JSON.parse(body);

    // Connect to database
    await dbConnect();

    // Handle different webhook types
    switch (payload.type) {
      case "verification_approved":
        // Get the user's wallet address from the user_id
        const walletAddress = payload.data.user_id;

        // Update KYC status in database
        await KYCVerification.findOneAndUpdate(
          { walletAddress: walletAddress.toLowerCase() },
          { isVerified: true },
          { new: true, upsert: true }
        );

        console.log("KYC Verification Approved:", {
          userId: payload.data.user_id,
          level: payload.data.level,
          timestamp: payload.data.timestamp,
        });
        return NextResponse.json({ success: true });
      case "verification_rejected":
        // Get the user's wallet address from the user_id
        const rejectedWalletAddress = payload.data.user_id;

        // Update KYC status in database
        await KYCVerification.findOneAndUpdate(
          { walletAddress: rejectedWalletAddress.toLowerCase() },
          { isVerified: false },
          { new: true, upsert: true }
        );

        console.log("KYC Verification Rejected:", {
          userId: payload.data.user_id,
          timestamp: payload.data.timestamp,
        });
        return NextResponse.json({ success: true });
      default:
        return NextResponse.json(
          { error: "Unknown webhook type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
