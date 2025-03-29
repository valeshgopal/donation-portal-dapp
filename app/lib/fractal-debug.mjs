import { argv } from "process";
import { createHmac } from "crypto";

// Remove the first two arguments (node and script path)
argv.splice(0, 2);

// Get arguments from command line
const webhook_secret_token = argv[0];
const payload_body = argv[1];
const expected_signature = argv[2];

if (!webhook_secret_token || !payload_body || !expected_signature) {
  console.error("Usage: node fractal-debug.mjs <secret> <payload> <signature>");
  process.exit(1);
}

// Calculate signature using the raw body text
const calculated_signature = createHmac("sha1", webhook_secret_token)
  .update(payload_body) // Use the raw body text directly
  .digest("hex");

// Compare signatures
const signature_matches = calculated_signature === expected_signature;

// Log results
console.log(
  JSON.stringify(
    {
      webhook_secret_token,
      payload_body,
      expected_signature,
      calculated_signature,
      signature_matches,
    },
    null,
    2
  )
);
