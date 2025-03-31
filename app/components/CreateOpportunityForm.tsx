"use client";

import React, { useRef } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useTransaction } from "wagmi";
import { isAddress } from "viem";
import { useOpportunityFactory } from "../hooks/useOpportunityFactory";
import toast, { Toaster } from "react-hot-toast";
import { useEthPrice } from "../hooks/useEthPrice";
import { countries } from "../lib/countries";
import { uploadToIPFS } from "../lib/ipfs";

// List of causes
const causes = [
  "Education",
  "Healthcare",
  "Hunger",
  "Poverty",
  "Environment",
  "Disaster Relief",
  "Animal Welfare",
  "Human Rights",
  "Arts & Culture",
  "Community Development",
  "Children & Youth",
  "Elderly Care",
  "Disability Support",
  "Mental Health",
  "Refugee Support",
  "Women Empowerment",
  "Clean Water",
  "Renewable Energy",
  "Technology Access",
  "Sports & Recreation",
] as const;

type Cause = (typeof causes)[number];

type ValidationErrors = {
  title?: string;
  summary?: string;
  description?: string;
  location?: string;
  cause?: string;
  fundingGoal?: string;
  recipientWallet?: string;
};

// Helper function to get Sepolia explorer URLs
const getExplorerUrl = (type: "tx" | "address", hash: string) => {
  return `https://sepolia.etherscan.io/${type}/${hash}`;
};

export function CreateOpportunityForm() {
  const router = useRouter();
  const { address } = useAccount();
  const opportunityFactory = useOpportunityFactory();
  const { minEthPrice } = useEthPrice(1000);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isSuccess } = useTransaction({ hash: txHash });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    description: "",
    location: "",
    cause: "",
    fundingGoal: "",
    recipientWallet: "",
  });
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [creationStage, setCreationStage] = useState<
    "idle" | "uploading" | "deploying"
  >("idle");
  const toastIdRef = useRef<string | undefined>();

  const validateField = (
    name: keyof typeof formData,
    value: string
  ): string | undefined => {
    switch (name) {
      case "title":
        return !value.trim()
          ? "Title is required"
          : value.length < 5
          ? "Title must be at least 5 characters"
          : undefined;
      case "summary":
        return !value.trim()
          ? "Summary is required"
          : value.length < 10
          ? "Summary must be at least 10 characters"
          : value.trim().split(/\s+/).length > 50
          ? "Summary must be less than 50 words"
          : undefined;
      case "description": {
        if (!value.trim()) return "Description is required";
        if (value.length < 50)
          return "Description must be at least 50 characters";
        const wordCount = value.trim().split(/\s+/).length;
        if (wordCount > 1000) return "Description must be less than 1000 words";
        return undefined;
      }
      case "location":
        return !value ? "Location is required" : undefined;
      case "cause":
        return !value.trim() ? "Cause is required" : undefined;
      case "fundingGoal":
        return !value
          ? "Funding goal is required"
          : parseFloat(value) < minEthPrice
          ? `Funding goal must be at least ${minEthPrice} ETH`
          : undefined;
      case "recipientWallet":
        return !value.trim()
          ? "Recipient wallet address is required"
          : !isAddress(value as `0x${string}`)
          ? "Invalid wallet address"
          : undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate all fields
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key as keyof typeof formData, value);
      if (error) {
        errors[key as keyof ValidationErrors] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError("Please connect your account first");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    toastIdRef.current = toast.loading(
      "Starting to create your opportunity..."
    );

    try {
      if (!formData.recipientWallet) {
        throw new Error("Recipient wallet is required");
      }

      // First stage: Upload metadata to IPFS
      setCreationStage("uploading");
      toast.loading("Uploading metadata to IPFS...", {
        id: toastIdRef.current,
      });

      const metadata = {
        title: formData.title,
        summary: formData.summary,
        description: formData.description,
        location: formData.location,
        cause: formData.cause,
      };

      let metaDataURI: string;
      try {
        // Create a promise that rejects after 30 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Upload operation timed out. Please try again."));
          }, 60000);
        });

        // Race between the upload and the timeout
        metaDataURI = (await Promise.race([
          uploadToIPFS(metadata),
          timeoutPromise,
        ])) as string;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to upload metadata to IPFS. Please try again.";
        toast.error(errorMessage, {
          id: toastIdRef.current,
        });
        return;
      }

      // Second stage: Deploy contract
      setCreationStage("deploying");
      toast.loading("Creating your opportunity...", { id: toastIdRef.current });

      if (!opportunityFactory) {
        throw new Error("Opportunity factory contract is not initialized");
      }

      const tx = await opportunityFactory.createOpportunity(
        formData.title,
        formData.fundingGoal,
        formData.recipientWallet as `0x${string}`,
        metaDataURI // Using IPFS hash as metadata
      );

      setTxHash(tx as `0x${string}`);
      toast.loading("Transaction submitted. Waiting for confirmation...", {
        id: toastIdRef.current,
      });
    } catch (error) {
      toast.error("Failed to create opportunity. Please try again.", {
        id: toastIdRef.current,
      });
    } finally {
      setIsSubmitting(false);
      setCreationStage("idle");
    }
  };

  const getButtonText = () => {
    if (!isSubmitting) return "Create Opportunity";

    switch (creationStage) {
      case "deploying":
        return "Deploying Contract...";
      case "uploading":
        return "Uploading Metadata...";
      default:
        return "Creating...";
    }
  };

  useEffect(() => {
    if (isSuccess && txHash) {
      // Store success message and transaction hash in sessionStorage
      sessionStorage.setItem(
        "opportunityCreated",
        JSON.stringify({
          title: formData.title,
          txHash: txHash,
        })
      );
      // Redirect to dashboard
      router.push("/dashboard");
    }
  }, [isSuccess, txHash, router, formData.title]);

  return (
    <>
      <Toaster position="top-right" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {txHash && (
          <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md">
            <p>
              Your opportunity is being created. You will be redirected to the
              dashboard shortly.
            </p>
            <p className="text-sm mt-1">
              Note: It may take a few minutes for your opportunity to appear in
              the dashboard.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title<span className="text-xs text-gray-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.title ? "border-red-300" : "border-gray-300"
            }`}
            required
          />
          {validationErrors.title && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.title}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="summary"
            className="block text-sm font-medium text-gray-700"
          >
            Summary<span className="text-xs text-gray-400">*</span>
          </label>
          <input
            type="text"
            id="summary"
            value={formData.summary}
            onChange={(e) => handleFieldChange("summary", e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.summary ? "border-red-300" : "border-gray-300"
            }`}
            required
          />
          {validationErrors.summary && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.summary}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description<span className="text-xs text-gray-400">*</span>{" "}
            <span className="text-sm text-gray-500">(max 1000 words)</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            placeholder="Explain the impact of your opportunity - describe the problem, your solution, beneficiaries, expected outcomes, timeline, and how you'll ensure transparency."
            rows={8}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.description
                ? "border-red-300"
                : "border-gray-300"
            }`}
            required
          />
          <div className="mt-1 flex justify-between">
            <div>
              {validationErrors.description && (
                <p className="text-sm text-red-600">
                  {validationErrors.description}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {formData.description.trim().split(/\s+/).length} / 1000 words
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location<span className="text-xs text-gray-400">*</span>
          </label>
          <select
            id="location"
            value={formData.location}
            onChange={(e) => handleFieldChange("location", e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.location ? "border-red-300" : "border-gray-300"
            }`}
            required
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {validationErrors.location && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.location}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="cause"
            className="block text-sm font-medium text-gray-700"
          >
            Cause<span className="text-xs text-gray-400">*</span>
          </label>
          <select
            id="cause"
            value={formData.cause}
            onChange={(e) => handleFieldChange("cause", e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.cause ? "border-red-300" : "border-gray-300"
            }`}
            required
          >
            <option value="">Select a cause</option>
            {causes.map((cause) => (
              <option key={cause} value={cause}>
                {cause}
              </option>
            ))}
          </select>
          {validationErrors.cause && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.cause}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="fundingGoal"
            className="block text-sm font-medium text-gray-700"
          >
            Funding Goal<span className="text-xs text-gray-400">*</span>
          </label>
          <input
            type="number"
            id="fundingGoal"
            value={formData.fundingGoal}
            onChange={(e) => handleFieldChange("fundingGoal", e.target.value)}
            step="any"
            min={minEthPrice}
            placeholder={`Amount in ETH (${
              minEthPrice > 0 ? "min: " + minEthPrice : ""
            })`}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.fundingGoal
                ? "border-red-300"
                : "border-gray-300"
            }`}
            required
          />
          {validationErrors.fundingGoal && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.fundingGoal}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="recipientWallet"
            className="block text-sm font-medium text-gray-700"
          >
            Recipient Wallet Address
            <span className="text-xs text-gray-400">*</span>
          </label>
          <input
            type="text"
            id="recipientWallet"
            value={formData.recipientWallet}
            onChange={(e) =>
              handleFieldChange("recipientWallet", e.target.value)
            }
            placeholder="Wallet address"
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.recipientWallet
                ? "border-red-300"
                : "border-gray-300"
            }`}
            required
          />
          {validationErrors.recipientWallet && (
            <p className="mt-1 text-sm text-red-600">
              {validationErrors.recipientWallet}
            </p>
          )}
        </div>

        <div>
          <input
            type="checkbox"
            id="terms"
            name="terms"
            required
            onChange={(e) => {}}
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            I acknowledge that 5% is a platform fee, and I will receive 95% of
            the donation.
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !address}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {getButtonText()}
        </button>
      </form>
    </>
  );
}
