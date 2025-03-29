import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "viem/chains";
import { http } from "viem";

const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

if (!SEPOLIA_RPC_URL) {
  throw new Error("NEXT_PUBLIC_RPC_URL environment variable is not set");
}

export const config = getDefaultConfig({
  appName: "Donation Platform",
  projectId: WALLET_CONNECT_PROJECT_ID,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
  },
  ssr: true,
});
