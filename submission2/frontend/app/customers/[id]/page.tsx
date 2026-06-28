"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomerProfileCard from "@/components/CustomerProfileCard";
import BrokerRecommendationCard from "@/components/BrokerRecommendationCard";
import { getCustomer, getRecommendations, listBrokers, type Customer, type Recommendation, type Broker } from "@/lib/api";
import { Loader2, AlertCircle, RefreshCw, ChevronRight, Users } from "lucide-react";

type Phase = "loading" | "loaded" | "fetching-recs" | "recs-ready" | "error";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = Number(id);

  const [phase, setPhase] = useState<Phase>("loading");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [allBrokers, setAllBrokers] = useState<Broker[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvedAssignmentId, setApprovedAssignmentId] = useState<number | null>(null);
  const [noRecsMessage, setNoRecsMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  async function loadCustomer() {
    setPhase("loading");
    setError(null);
    try {
      const c = await getCustomer(customerId);
      setCustomer(c);
      setPhase("loaded");
      fetchRecommendations(c);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load customer.");
      setPhase("error");
    }
  }

  async function fetchRecommendations(c: Customer) {
    setPhase("fetching-recs");
    try {
      const result = await getRecommendations(c.id);
      setRecommendations(result.recommendations ?? []);
      setNoRecsMessage(result.message ?? null);
      if ((result.recommendations ?? []).length === 0) {
        const brokers = await listBrokers(c.city);
        setAllBrokers(brokers);
      }
      setPhase("recs-ready");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Recommendation engine failed.");
      setPhase("error");
    }
  }

  if (phase === "loading") return <LoadingState label="Loading customer profile…" />;
  if (phase === "error")
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={loadCustomer}
          className="mt-4 flex items-center gap-2 mx-auto text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <button onClick={() => router.push("/")} className="hover:text-gray-900">Dashboard</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">{customer?.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: customer profile */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-24">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Customer Profile
            </h2>
            {customer && <CustomerProfileCard customer={customer} />}

            {approvedAssignmentId && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-emerald-800">Assignment Complete</p>
                <p className="text-xs text-emerald-600 mt-1">Broker has been notified.</p>
                <button
                  onClick={() => router.push("/assignments")}
                  className="mt-3 text-xs text-emerald-700 underline underline-offset-2"
                >
                  View in Assignments →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: recommendations */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                AI Broker Recommendations
              </h2>
              {phase === "recs-ready" && recommendations.length > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Ranked by AI based on locality match, budget, workload, and ratings
                </p>
              )}
            </div>
            {phase === "recs-ready" && (
              <button
                onClick={() => customer && fetchRecommendations(customer)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            )}
          </div>

          {phase === "fetching-recs" && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">AI is analysing brokers…</p>
              <p className="text-xs text-gray-400 mt-1">
                Gemini is scoring {customer?.city ?? ""} brokers against requirements
              </p>
            </div>
          )}

          {phase === "recs-ready" && recommendations.length > 0 && (
            <div className="space-y-5">
              {recommendations.map((rec, i) => (
                <BrokerRecommendationCard
                  key={rec.broker.id}
                  rec={rec}
                  rank={i + 1}
                  customerId={customerId}
                  onApproved={(aId) => setApprovedAssignmentId(aId)}
                />
              ))}
            </div>
          )}

          {phase === "recs-ready" && recommendations.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center space-y-4">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-medium text-gray-700">
                {noRecsMessage ?? "No matching brokers found."}
              </p>
              <p className="text-sm text-gray-500">
                Select a broker manually from the list below.
              </p>

              {allBrokers.length > 0 && customer && (
                <ManualBrokerSelect
                  brokers={allBrokers}
                  customerId={customerId}
                  selectedId={selectedBrokerId}
                  onSelect={setSelectedBrokerId}
                  onApproved={(aId) => setApprovedAssignmentId(aId)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function ManualBrokerSelect({
  brokers,
  customerId,
  selectedId,
  onSelect,
  onApproved,
}: {
  brokers: Broker[];
  customerId: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onApproved: (id: number) => void;
}) {
  const [approvedBy, setApprovedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleAssign = async () => {
    if (!selectedId || !approvedBy.trim()) {
      setError("Select a broker and enter your name.");
      return;
    }
    setLoading(true);
    setError(null);
    const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      const assignRes = await fetch(`${BASE}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, broker_id: selectedId }),
      });
      const assignment = await assignRes.json();
      const approveRes = await fetch(`${BASE}/assignments/${assignment.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: approvedBy }),
      });
      if (!approveRes.ok) throw new Error((await approveRes.json()).detail);
      setDone(true);
      onApproved(assignment.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return <p className="text-emerald-700 font-medium">Broker assigned and notified.</p>;

  return (
    <div className="text-left space-y-3 mt-4">
      <div className="grid gap-2">
        {brokers.map((b) => (
          <label
            key={b.id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedId === b.id
                ? "border-brand-400 bg-brand-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="broker"
              value={b.id}
              checked={selectedId === b.id}
              onChange={() => onSelect(b.id)}
              className="accent-brand-600"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{b.name}</p>
              <p className="text-xs text-gray-500">{b.regions_covered.slice(0, 3).join(", ")}</p>
            </div>
            <span className="text-xs text-gray-500">★ {b.rating}</span>
          </label>
        ))}
      </div>
      <input
        type="text"
        placeholder="Your name *"
        value={approvedBy}
        onChange={(e) => setApprovedBy(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleAssign}
        disabled={loading}
        className="w-full bg-brand-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Assign Selected Broker
      </button>
    </div>
  );
}
