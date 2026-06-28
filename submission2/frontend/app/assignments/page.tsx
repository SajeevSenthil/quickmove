"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listAssignments,
  listCustomers,
  listBrokers,
  type Assignment,
  type Customer,
  type Broker,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Loader2, ArrowLeft, ClipboardList } from "lucide-react";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [customers, setCustomers] = useState<Map<number, Customer>>(new Map());
  const [brokers, setBrokers] = useState<Map<number, Broker>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAssignments(), listCustomers(), listBrokers()])
      .then(([a, c, b]) => {
        setAssignments(a);
        setCustomers(new Map(c.map((x) => [x.id, x])));
        setBrokers(new Map(b.map((x) => [x.id, x])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading assignments…</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="font-medium text-gray-700">No assignments yet</p>
          <Link href="/upload" className="text-sm text-brand-600 underline underline-offset-2">
            Create your first assignment
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <Th>#</Th>
                <Th>Customer</Th>
                <Th>Broker</Th>
                <Th>AI Score</Th>
                <Th>Deadline</Th>
                <Th>Approved By</Th>
                <Th>Assigned</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const customer = customers.get(a.customer_id);
                const broker = brokers.get(a.broker_id);
                return (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{a.id}</td>
                    <td className="px-4 py-3">
                      {customer ? (
                        <Link
                          href={`/customers/${a.customer_id}`}
                          className="font-medium text-brand-600 hover:text-brand-700"
                        >
                          {customer.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">#{a.customer_id}</span>
                      )}
                      {customer && (
                        <p className="text-xs text-gray-400">{customer.city}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {broker ? (
                        <span className="font-medium text-gray-900">{broker.name}</span>
                      ) : (
                        <span className="text-gray-400">#{a.broker_id}</span>
                      )}
                      {broker && (
                        <p className="text-xs text-gray-400">{broker.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.ai_score != null ? (
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            a.ai_score >= 90
                              ? "bg-emerald-100 text-emerald-700"
                              : a.ai_score >= 75
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {a.ai_score}%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(a.deadline)}</td>
                    <td className="px-4 py-3 text-gray-600">{a.approved_by ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(a.assigned_date)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  );
}
