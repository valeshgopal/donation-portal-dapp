"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface KYCStatus {
  exists: boolean;
  isVerified: boolean;
  data: any;
}

export default function KYCVerification() {
  const { address, isConnected } = useAccount();
  const [kycStatus, setKYCStatus] = useState<KYCStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const searchParams = useSearchParams();

  const checkKYCStatus = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/kyc?walletAddress=${address}`);
      const data = await response.json();
      setKYCStatus(data);
      return data;
    } catch (error) {
      console.error("Error checking KYC status:", error);
      return null;
    }
  };

  useEffect(() => {
    // Check if we have an authorization code from Fractal
    const code = searchParams.get("code");
    if (code) {
      // Start polling for KYC status
      setIsPolling(true);
      let attempts = 0;
      const maxAttempts = 10; // 20 seconds total (2 seconds * 10 attempts)

      const pollStatus = async () => {
        const status = await checkKYCStatus();
        attempts++;

        // Stop polling if:
        // 1. The wallet exists in DB and is verified
        // 2. The wallet exists in DB but is not verified (failed verification)
        // 3. We've reached max attempts
        if (status?.exists || attempts >= maxAttempts) {
          setIsPolling(false);
          return;
        }

        // Poll every 2 seconds
        setTimeout(pollStatus, 2000);
      };

      pollStatus();
    } else {
      // If no code, check status immediately
      checkKYCStatus();
    }
  }, [address, searchParams]);

  // Handle error from Fractal
  const error = searchParams.get("error");
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            KYC Verification Failed
          </h1>
          <p className="text-gray-600 mb-6">
            {searchParams.get("error_description") ||
              "The verification process was not completed."}
          </p>
          <button
            onClick={() => (window.location.href = "/create")}
            className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!address || !isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-600">
            Please connect your wallet to create a donation opportunity.
          </p>
        </div>
      </div>
    );
  }

  if (kycStatus?.exists === false || kycStatus?.isVerified === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">KYC Verification Required</h1>
          <p className="text-gray-600 mb-6">
            Please complete your KYC verification before creating a donation
            opportunity.
          </p>

          <div className="flex flex-col items-center gap-4 mb-8">
            <a
              href={
                process.env.NEXT_PUBLIC_FRACTAL_KYC_URL +
                `&ensure_wallet=${address}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Verify with Fractal
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus === null || isPolling) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Checking KYC Status...</h1>
          <p className="text-gray-600">
            {isPolling
              ? "Please wait while we verify your KYC status. This may take up to 20 seconds."
              : "Please wait while we verify your KYC status."}
          </p>
          {isPolling && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
