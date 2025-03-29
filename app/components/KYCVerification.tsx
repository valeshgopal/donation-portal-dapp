"use client";

import { useAccount } from "wagmi";
import { useEffect, useState, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { createSession } from "../lib/didit/createSession";
import { VerificationStatus } from "../lib/models/KYCVerification";

interface KYCStatus {
  exists: boolean;
  status: VerificationStatus;
  data: any;
}

interface KYCVerificationProps {
  children: ReactNode;
}

interface StatusConfig {
  title: string;
  message: string;
  showButton: boolean;
  buttonText: string;
  buttonDisabled: boolean;
  showSpinner: boolean;
}

const getStatusConfig = (
  status: VerificationStatus | undefined,
  isCreatingSession: boolean
): StatusConfig => {
  if (isCreatingSession) {
    return {
      title: "Creating KYC Session",
      message: "Please wait while we set up your verification session.",
      showButton: true,
      buttonText: "Creating KYC Session",
      buttonDisabled: true,
      showSpinner: true,
    };
  }

  switch (status) {
    case "Not Started":
      return {
        title: "KYC Verification Required",
        message:
          "Please complete your KYC verification before creating a donation opportunity.",
        showButton: true,
        buttonText: "Verify KYC",
        buttonDisabled: false,
        showSpinner: false,
      };
    case "In Progress":
      return {
        title: "KYC Verification in Progress",
        message:
          "Please complete the verification process in the Didit window.",
        showButton: true,
        buttonText: "Verification in Progress",
        buttonDisabled: true,
        showSpinner: true,
      };
    case "Approved":
      return {
        title: "KYC Verification Approved",
        message: "Your KYC verification has been approved.",
        showButton: false,
        buttonText: "",
        buttonDisabled: true,
        showSpinner: false,
      };
    case "Declined":
      return {
        title: "KYC Verification Declined",
        message:
          "Your KYC verification was declined. Please try again with valid documents.",
        showButton: true,
        buttonText: "Try Again",
        buttonDisabled: false,
        showSpinner: false,
      };
    case "In Review":
      return {
        title: "KYC Under Review",
        message:
          "Your documents are being reviewed. This process may take up to 24 hours.",
        showButton: true,
        buttonText: "Under Review",
        buttonDisabled: true,
        showSpinner: true,
      };
    case "Expired":
      return {
        title: "KYC Verification Expired",
        message:
          "Your verification session has expired. Please start a new verification process.",
        showButton: true,
        buttonText: "Start New Verification",
        buttonDisabled: false,
        showSpinner: false,
      };
    case "Abandoned":
      return {
        title: "KYC Verification Incomplete",
        message:
          "You didn't complete the verification process. Please try again.",
        showButton: true,
        buttonText: "Restart Verification",
        buttonDisabled: false,
        showSpinner: false,
      };
    case "Kyc Expired":
      return {
        title: "KYC Verification Expired",
        message:
          "Your KYC verification has expired. Please complete the verification process again.",
        showButton: true,
        buttonText: "Renew Verification",
        buttonDisabled: false,
        showSpinner: false,
      };
    default:
      return {
        title: "Checking KYC Status",
        message: "Please wait while we verify your KYC status.",
        showButton: false,
        buttonText: "",
        buttonDisabled: true,
        showSpinner: true,
      };
  }
};

export default function KYCVerification({ children }: KYCVerificationProps) {
  const { address, isConnected } = useAccount();
  const [kycStatus, setKYCStatus] = useState<KYCStatus | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
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

  const handleCreateSession = async () => {
    setIsCreatingSession(true);
    try {
      const data = await createSession(
        "OCR + FACE",
        `${process.env.NEXT_PUBLIC_DOMAIN_URL}/create`,
        address as string
      );

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating session:", error);
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
