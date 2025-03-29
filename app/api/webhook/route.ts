import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "../../lib/mongodb";
import { KYCVerification } from "../../lib/models/KYCVerification";

export async function POST(request: Request) {
  try {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.NEXT_PUBLIC_DIDIT_WEBHOOK_SECRET_KEY;
    if (!webhookSecret) {
      throw new Error("NEXT_PUBLIC_DIDIT_WEBHOOK_SECRET_KEY is not configured");
    }

    // Get the raw body
    const rawBody = await request.text();

    // Get headers
    const signature = request.headers.get("x-signature");
    const timestamp = request.headers.get("x-timestamp");

    // Validate required headers
    if (!signature || !timestamp || !rawBody || !webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate timestamp (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const incomingTime = parseInt(timestamp, 10);
    if (Math.abs(currentTime - incomingTime) > 300) {
      return NextResponse.json(
        { error: "Request timestamp is stale" },
        { status: 401 }
      );
    }

    // Generate HMAC
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const expectedSignature = hmac.update(rawBody).digest("hex");

    // Compare signatures using timing-safe comparison
    const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");
    const providedSignatureBuffer = Buffer.from(signature, "utf8");

    if (
      expectedSignatureBuffer.length !== providedSignatureBuffer.length ||
      !crypto.timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer)
    ) {
      return NextResponse.json(
        {
          error: `Invalid signature. Computed (${expectedSignature}), Provided (${signature})`,
        },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const { session_id, status, vendor_data: walletAddress } = payload;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();

    // Update KYC status in database
    await KYCVerification.findOneAndUpdate(
      { walletAddress },
      { status },
      { new: true, upsert: true }
    );

    console.log("KYC Verification Update:", {
      sessionId: session_id,
      status,
      walletAddress,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Webhook event processed" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
