import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 75) return "text-blue-700 bg-blue-50 border-blue-200";
  if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "text-amber-700 bg-amber-50 border-amber-200",
    assigned: "text-blue-700 bg-blue-50 border-blue-200",
    notified: "text-emerald-700 bg-emerald-50 border-emerald-200",
    pending_approval: "text-amber-700 bg-amber-50 border-amber-200",
    approved: "text-blue-700 bg-blue-50 border-blue-200",
    rejected: "text-red-700 bg-red-50 border-red-200",
  };
  return map[status] ?? "text-gray-700 bg-gray-50 border-gray-200";
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    assigned: "Assigned",
    notified: "Notified",
    pending_approval: "Awaiting Approval",
    approved: "Approved",
    rejected: "Rejected",
  };
  return map[status] ?? status;
}
