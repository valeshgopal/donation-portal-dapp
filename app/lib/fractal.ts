import crypto from "crypto";

export function verifyFractalWebhook(
  secret: string,
  body: string,
  signature: string
): boolean {
  try {
    // Create HMAC with SHA-256
    const hmac = crypto.createHmac("sha1", secret);

    // Update HMAC with the raw body
    hmac.update(body);

    // Get the calculated signature
    const calculatedSignature = hmac.digest("hex");

    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}
