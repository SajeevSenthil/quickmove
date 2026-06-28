"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/UploadZone";
import CustomerProfileCard from "@/components/CustomerProfileCard";
import type { Customer } from "@/lib/api";
import { ArrowRight, Edit2, CheckCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleUploaded = (c: Customer) => {
    setCustomer(c);
    setConfirmed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirm = () => {
    if (!customer) return;
    setConfirmed(true);
    setTimeout(() => router.push(`/customers/${customer.id}`), 800);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Step indicator */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Relocation Request</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload a customer requirement document to start the AI-assisted broker allocation workflow.
        </p>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mt-6">
          {["Upload Document", "Review Profile", "AI Recommendations", "Approve & Notify"].map(
            (step, i) => {
              const active = i === 0 ? !customer : i === 1 ? !!customer && !confirmed : false;
              const done = i === 0 ? !!customer : false;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        done
                          ? "bg-emerald-500 text-white"
                          : active
                          ? "bg-brand-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-xs ${
                        active ? "text-brand-700 font-medium" : "text-gray-400"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {i < 3 && <div className="w-4 h-px bg-gray-200" />}
                </div>
              );
            }
          )}
        </div>
      </div>

      {!customer ? (
        <UploadZone onUploaded={handleUploaded} />
      ) : (
        <div className="space-y-6">
          {/* Success banner */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                AI extraction complete — review the profile below
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Gemini extracted {Object.values(customer).filter(Boolean).length} fields from the document.
                Correct any mistakes before proceeding.
              </p>
            </div>
          </div>

          <CustomerProfileCard customer={customer} />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCustomer(null)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Upload Different Document
            </button>

            <button
              onClick={handleConfirm}
              disabled={confirmed}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 rounded-lg transition-colors ml-auto"
            >
              {confirmed ? (
                "Redirecting…"
              ) : (
                <>
                  Profile Looks Good — Find Brokers
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Re-upload zone below if user wants to try again */}
          <details className="text-sm text-gray-500 cursor-pointer">
            <summary className="hover:text-gray-700">Upload a different document instead</summary>
            <div className="mt-3">
              <UploadZone onUploaded={handleUploaded} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
