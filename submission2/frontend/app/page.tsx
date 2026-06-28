"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listCustomers,
  listAssignments,
  listBrokers,
  type Customer,
  type Assignment,
  type Broker,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import AddBrokerModal from "@/components/AddBrokerModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  ClipboardCheck,
  Clock,
  CheckCircle,
  Upload,
  ArrowRight,
  Loader2,
  Plus,
  Star,
  MapPin,
  Phone,
  Mail,
  Building2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type Tab = "requests" | "brokers";

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBroker, setShowAddBroker] = useState(false);

  useEffect(() => {
    Promise.all([listCustomers(), listAssignments(), listBrokers()])
      .then(([c, a, b]) => {
        setCustomers(c);
        setAssignments(a);
        setBrokers(b);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pending = customers.filter((c) => c.assignment_status === "pending").length;
  const assigned = customers.filter((c) => c.assignment_status === "assigned").length;
  const notified = customers.filter((c) => c.assignment_status === "notified").length;
  const activeBrokers = brokers.filter((b) => b.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            AI-assisted broker allocation for QuickMove relocation requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "brokers" && (
            <button
              onClick={() => setShowAddBroker(true)}
              className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Broker
            </button>
          )}
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            New Request
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-12">
          <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard…</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard
              icon={<Upload className="w-4 h-4 text-gray-500" />}
              label="Total Requests"
              value={customers.length}
            />
            <StatCard
              icon={<Clock className="w-4 h-4 text-amber-500" />}
              label="Pending"
              value={pending}
              accent="amber"
            />
            <StatCard
              icon={<ClipboardCheck className="w-4 h-4 text-brand-500" />}
              label="Assigned"
              value={assigned}
              accent="brand"
            />
            <StatCard
              icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
              label="Notified"
              value={notified}
              accent="emerald"
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-purple-500" />}
              label="Active Brokers"
              value={activeBrokers}
              accent="purple"
            />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-6">
              <TabButton
                active={tab === "requests"}
                onClick={() => setTab("requests")}
                count={customers.length}
              >
                Relocation Requests
              </TabButton>
              <TabButton
                active={tab === "brokers"}
                onClick={() => setTab("brokers")}
                count={brokers.length}
              >
                Brokers
              </TabButton>
            </nav>
          </div>

          {/* Tab content */}
          {tab === "requests" && (
            <RequestsTab customers={customers} />
          )}
          {tab === "brokers" && (
            <BrokersTab
              brokers={brokers}
              onAdd={() => setShowAddBroker(true)}
              onBrokerUpdated={(updated) =>
                setBrokers((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
              }
            />
          )}
        </>
      )}

      {showAddBroker && (
        <AddBrokerModal
          onClose={() => setShowAddBroker(false)}
          onCreated={(broker) => {
            setBrokers((prev) => [broker, ...prev]);
            setShowAddBroker(false);
          }}
        />
      )}
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full ${
          active ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// ── Requests tab ─────────────────────────────────────────────────────────────

function RequestsTab({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center space-y-4">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
          <Upload className="w-7 h-7 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-700">No requests yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload a customer requirement document to get started
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload First Request
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <Th>Customer</Th>
            <Th>City</Th>
            <Th>Budget</Th>
            <Th>Apartment</Th>
            <Th>Move Date</Th>
            <Th>Status</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c.preferred_regions?.slice(0, 2).join(", ") || "—"}
                </p>
              </td>
              <td className="px-4 py-3 text-gray-600">{c.city}</td>
              <td className="px-4 py-3 text-gray-600">
                {c.budget_min || c.budget_max
                  ? `${formatCurrency(c.budget_min)}–${formatCurrency(c.budget_max)}`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-gray-600">{c.apartment_type ?? "—"}</td>
              <td className="px-4 py-3 text-gray-600">{formatDate(c.move_date)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.assignment_status} />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/customers/${c.id}`}
                  className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  {c.assignment_status === "pending" ? "Find Brokers" : "View"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Brokers tab ───────────────────────────────────────────────────────────────

function BrokersTab({
  brokers,
  onAdd,
  onBrokerUpdated,
}: {
  brokers: Broker[];
  onAdd: () => void;
  onBrokerUpdated: (b: Broker) => void;
}) {
  const [cityFilter, setCityFilter] = useState("All");
  const cities = ["All", ...Array.from(new Set(brokers.map((b) => b.city))).sort()];
  const filtered = cityFilter === "All" ? brokers : brokers.filter((b) => b.city === cityFilter);

  if (brokers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center space-y-4">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
          <Building2 className="w-7 h-7 text-gray-400" />
        </div>
        <p className="font-medium text-gray-700">No brokers yet</p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add First Broker
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">City:</span>
        {cities.map((c) => (
          <button
            key={c}
            onClick={() => setCityFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              cityFilter === c
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {c}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {filtered.length} broker{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Broker grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((broker) => (
          <BrokerCard key={broker.id} broker={broker} onUpdated={onBrokerUpdated} />
        ))}
      </div>
    </div>
  );
}

function BrokerCard({
  broker,
  onUpdated,
}: {
  broker: Broker;
  onUpdated: (b: Broker) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const workloadPct = broker.capacity_limit > 0
    ? Math.round((broker.current_active_count / broker.capacity_limit) * 100)
    : 0;

  const toggleActive = async () => {
    setToggling(true);
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${BASE}/brokers/${broker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !broker.is_active }),
      });
      if (res.ok) onUpdated(await res.json());
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border p-5 space-y-4 transition-opacity ${
        broker.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-700 font-bold text-sm">
            {broker.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{broker.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {broker.city}
            </p>
          </div>
        </div>

        {/* Rating + active toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {broker.rating.toFixed(1)}
          </div>
          <button
            onClick={toggleActive}
            disabled={toggling}
            title={broker.is_active ? "Deactivate broker" : "Activate broker"}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {broker.is_active ? (
              <ToggleRight className="w-5 h-5 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{broker.email}</span>
        </div>
        {broker.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            {broker.phone}
          </div>
        )}
      </div>

      {/* Regions */}
      {broker.regions_covered?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {broker.regions_covered.slice(0, 4).map((r) => (
            <span
              key={r}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
            >
              {r}
            </span>
          ))}
          {broker.regions_covered.length > 4 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
              +{broker.regions_covered.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Property types */}
      {broker.property_types?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {broker.property_types.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-100"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-50">
        <Metric label="Budget" value={broker.budget_min ? `${Math.round(broker.budget_min / 1000)}k–${Math.round((broker.budget_max ?? 0) / 1000)}k` : "—"} />
        <Metric label="Response" value={`${broker.avg_response_time_hours}h`} />
        <div>
          <p className="text-xs text-gray-400 mb-1">Workload</p>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  workloadPct >= 80
                    ? "bg-red-400"
                    : workloadPct >= 60
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
                style={{ width: `${workloadPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-10 text-right">
              {broker.current_active_count}/{broker.capacity_limit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xs font-medium text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}
