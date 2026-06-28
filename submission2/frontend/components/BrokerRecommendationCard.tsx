"use client";

import { useState } from "react";
import { cn, formatCurrency, scoreColor } from "@/lib/utils";
import type { Recommendation } from "@/lib/api";
import { Star, Clock, Users, MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Props {
  rec: Recommendation;
  rank: number;
  customerId: number;
  onApproved: (assignmentId: number) => void;
}

export default function BrokerRecommendationCard({ rec, rank, customerId, onApproved }: Props) {
  const [deadline, setDeadline] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [loading, setLoading] = useState<"approve" | null>(null);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { broker, score, reasoning } = rec;

  const handleApprove = async () => {
    if (!approvedBy.trim()) {
      setError("Please enter your name before approving.");
      return;
    }
    setError(null);
    setLoading("approve");
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

      // Step 1: create assignment
      const assignRes = await fetch(`${BASE}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          broker_id: broker.id,
          ai_score: score,
          ai_reasoning: reasoning,
          deadline: deadline || undefined,
        }),
      });
      if (!assignRes.ok) throw new Error((await assignRes.json()).detail);
      const assignment = await assignRes.json();

      // Step 2: approve it
      const approveRes = await fetch(`${BASE}/assignments/${assignment.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: approvedBy, deadline: deadline || undefined }),
      });
      if (!approveRes.ok) throw new Error((await approveRes.json()).detail);
      const approveData = await approveRes.json();

      setResult("approved");
      onApproved(assignment.id);

      if (!approveData.notification_sent) {
        setError("Assignment approved. Broker notification pending (n8n not configured).");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const rankLabels: Record<number, string> = { 1: "Top Pick", 2: "Strong Match", 3: "Good Match" };
  const rankColors: Record<number, string> = {
    1: "bg-amber-400 text-white",
    2: "bg-gray-300 text-gray-700",
    3: "bg-orange-300 text-white",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border-2 p-6 space-y-5 transition-all",
        result === "approved"
          ? "border-emerald-400 bg-emerald-50/30"
          : result === "rejected"
          ? "border-gray-200 opacity-60"
          : "border-gray-200 hover:border-brand-300"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5",
              rankColors[rank]
            )}
          >
            {rank}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{broker.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {rankLabels[rank]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{broker.email}</p>
            {broker.phone && <p className="text-sm text-gray-500">{broker.phone}</p>}
          </div>
        </div>

        {/* Score */}
        <div
          className={cn(
            "flex-shrink-0 w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center",
            scoreColor(score)
          )}
        >
          <span className="text-2xl font-bold leading-none">{score}</span>
          <span className="text-xs mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Star className="w-3.5 h-3.5 text-amber-500" />} label="Rating" value={`${broker.rating}/5`} />
        <Stat
          icon={<Clock className="w-3.5 h-3.5 text-blue-500" />}
          label="Response"
          value={`${broker.avg_response_time_hours}h`}
        />
        <Stat
          icon={<Users className="w-3.5 h-3.5 text-purple-500" />}
          label="Workload"
          value={`${broker.current_active_count}/${broker.capacity_limit}`}
        />
        <Stat
          icon={<MapPin className="w-3.5 h-3.5 text-emerald-500" />}
          label="Budget"
          value={`${formatCurrency(broker.budget_min)}–${formatCurrency(broker.budget_max)}`}
        />
      </div>

      {/* Regions */}
      <div className="flex flex-wrap gap-1.5">
        {broker.regions_covered.map((r) => (
          <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
            {r}
          </span>
        ))}
      </div>

      {/* AI Reasoning */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs font-medium text-gray-500 mb-1">AI Reasoning</p>
        <p className="text-sm text-gray-700 leading-relaxed">{reasoning}</p>
      </div>

      {/* Approval section */}
      {result === "approved" ? (
        <div className="flex items-center gap-2 text-emerald-700 font-medium">
          <CheckCircle className="w-5 h-5" />
          Assignment approved and broker notified
        </div>
      ) : result === "rejected" ? (
        <div className="flex items-center gap-2 text-gray-500">
          <XCircle className="w-5 h-5" />
          Rejected
        </div>
      ) : (
        <div className="space-y-3 pt-1 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your Name *</label>
              <input
                type="text"
                placeholder="Ops Executive"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Response Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">{error}</p>}

          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading === "approve" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Approving & Notifying Broker…
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Approve & Assign {broker.name}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center bg-gray-50 rounded-lg p-2 border border-gray-100">
      <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
