"use client";

import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import type { Broker } from "@/lib/api";

interface Props {
  onClose: () => void;
  onCreated: (broker: Broker) => void;
}

const CITIES = ["Bengaluru", "Hyderabad", "Mumbai", "Pune", "Chennai", "Delhi", "Kolkata", "Ahmedabad"];
const PROPERTY_TYPE_OPTIONS = ["1BHK", "2BHK", "3BHK", "4BHK", "Studio", "Villa", "Row House", "Penthouse"];

export default function AddBrokerModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "Bengaluru",
    regions_raw: "",
    budget_min: "",
    budget_max: "",
    capacity_limit: "10",
    avg_response_time_hours: "24",
    rating: "4.0",
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const toggleType = (t: string) =>
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.city) {
      setError("Name, email, and city are required.");
      return;
    }
    setError(null);
    setLoading(true);

    const regions = form.regions_raw
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      city: form.city,
      regions_covered: regions,
      property_types: selectedTypes,
      budget_min: form.budget_min ? parseInt(form.budget_min) : undefined,
      budget_max: form.budget_max ? parseInt(form.budget_max) : undefined,
      capacity_limit: parseInt(form.capacity_limit) || 10,
      avg_response_time_hours: parseFloat(form.avg_response_time_hours) || 24,
      rating: parseFloat(form.rating) || 4.0,
      current_active_count: 0,
      is_active: true,
    };

    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${BASE}/brokers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to create broker.");
      const broker = await res.json();
      onCreated(broker);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Broker</h2>
            <p className="text-xs text-gray-500 mt-0.5">Broker will be immediately available for allocation</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input
                type="text"
                placeholder="Ravi Kumar"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
                required
              />
            </Field>
            <Field label="Email *">
              <input
                type="email"
                placeholder="ravi@brokerage.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass}
                required
              />
            </Field>
          </div>

          {/* Phone + City */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <input
                type="tel"
                placeholder="+91 98450 12345"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="City they serve *" hint="The city this broker operates in">
              <select
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass}
              >
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Regions */}
          <Field label="Localities / Areas within the City" hint="Neighbourhoods they cover. e.g. RS Puram, Saibaba Colony, Gandhipuram">
            <input
              type="text"
              placeholder="Whitefield, Marathahalli, ITPL"
              value={form.regions_raw}
              onChange={(e) => set("regions_raw", e.target.value)}
              className={inputClass}
            />
          </Field>

          {/* Property types */}
          <Field label="Property Types Handled">
            <div className="flex flex-wrap gap-2 mt-1">
              {PROPERTY_TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTypes.includes(t)
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min Budget (₹/mo)">
              <input
                type="number"
                placeholder="15000"
                value={form.budget_min}
                onChange={(e) => set("budget_min", e.target.value)}
                className={inputClass}
                min={0}
              />
            </Field>
            <Field label="Max Budget (₹/mo)">
              <input
                type="number"
                placeholder="50000"
                value={form.budget_max}
                onChange={(e) => set("budget_max", e.target.value)}
                className={inputClass}
                min={0}
              />
            </Field>
          </div>

          {/* Capacity + Response time + Rating */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Max Capacity">
              <input
                type="number"
                value={form.capacity_limit}
                onChange={(e) => set("capacity_limit", e.target.value)}
                className={inputClass}
                min={1}
                max={50}
              />
            </Field>
            <Field label="Avg Response (hrs)">
              <input
                type="number"
                value={form.avg_response_time_hours}
                onChange={(e) => set("avg_response_time_hours", e.target.value)}
                className={inputClass}
                min={0.5}
                step={0.5}
              />
            </Field>
            <Field label="Initial Rating">
              <input
                type="number"
                value={form.rating}
                onChange={(e) => set("rating", e.target.value)}
                className={inputClass}
                min={1}
                max={5}
                step={0.1}
              />
            </Field>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Broker
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
