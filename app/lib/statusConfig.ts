import { VerificationStatus } from "./models/KYCVerification";

interface StatusConfig {
  title: string;
  message: string;
  showButton: boolean;
  buttonText: string;
  buttonDisabled: boolean;
  showSpinner: boolean;
}

export const getStatusConfig = (
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
