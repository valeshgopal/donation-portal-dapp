"use client";

import { CreateOpportunityForm } from "../components/CreateOpportunityForm";
import { Suspense } from "react";
import KYCVerification from "../components/KYCVerification";

export default function CreateOpportunityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <p className="text-gray-600">
              Please wait while we check your KYC status.
            </p>
          </div>
        }
      >
        <KYCVerification>
          <CreateOpportunityForm />
        </KYCVerification>
      </Suspense>
    </div>
  );
}
