"use client";

import { useAccount } from "wagmi";
import { useEffect, useState, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { VerificationStatus } from "../lib/models/KYCVerification";
import { getStatusConfig } from "@/lib/statusConfig";

interface KYCStatus {
  exists: boolean;
  status: VerificationStatus;
  data: any;
}

interface KYCVerificationProps {
  children: ReactNode;
}

export default function KYCVerification({ children }: KYCVerificationProps) {
  const { address, isConnected } = useAccount();
  const [kycStatus, setKYCStatus] = useState<KYCStatus | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const searchParams = useSearchParams();
  const [error, setError] = useState(false);

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

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const response = await fetch("/api/didit/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          features: "OCR + FACE",
          callback: `${process.env.NEXT_PUBLIC_DOMAIN_URL}/create`,
          vendor_data: address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create session");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating session:", error);
      setError(true);
    } finally {
      setIsCreatingSession(false);
    }
  };

  useEffect(() => {
    const pollInterval = setInterval(checkKYCStatus, 5000);
    checkKYCStatus();

    return () => clearInterval(pollInterval);
  }, [address]);

  // Handle error from Didit
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
            onClick={handleCreateSession}
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

  const statusConfig = getStatusConfig(kycStatus?.status, isCreatingSession);

  // Show status message for all states except Approved
  if (kycStatus?.status !== "Approved") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{statusConfig.title}</h1>
          <p className="text-gray-600 mb-6">{statusConfig.message}</p>

          {statusConfig.showButton && (
            <div className="flex flex-col items-center gap-4 mb-8">
              <button
                onClick={handleCreateSession}
                disabled={statusConfig.buttonDisabled}
                className={`inline-block px-6 py-3 rounded-md flex items-center gap-2 ${
                  statusConfig.buttonDisabled
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 cursor-pointer"
                } text-white transition-colors`}
              >
                {statusConfig.showSpinner && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {statusConfig.buttonText}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Only render children when status is Approved
  return <>{children}</>;
}
