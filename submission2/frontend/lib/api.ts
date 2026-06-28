const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Request failed: ${res.status}`);
  }
  return res.json() as T;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface Customer {
  id: number;
  name: string;
  city: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_regions: string[];
  apartment_type: string | null;
  furnished_status: string | null;
  parking_required: boolean;
  pets_allowed: boolean;
  office_location: string | null;
  move_date: string | null;
  special_requirements: string[];
  assignment_status: string;
  created_at: string;
}

export interface Broker {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  city: string;
  regions_covered: string[];
  property_types: string[];
  budget_min: number | null;
  budget_max: number | null;
  current_active_count: number;
  capacity_limit: number;
  avg_response_time_hours: number;
  rating: number;
  is_active: boolean;
  created_at: string;
}

export interface Recommendation {
  broker: Broker;
  score: number;
  reasoning: string;
}

export interface Assignment {
  id: number;
  customer_id: number;
  broker_id: number;
  ai_score: number | null;
  ai_reasoning: string | null;
  status: string;
  deadline: string | null;
  approved_by: string | null;
  approval_timestamp: string | null;
  assigned_date: string;
  created_at: string;
}

// ── Customers ────────────────────────────────────────────────────────────────

export async function uploadCustomerDoc(file: File): Promise<Customer> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/customers/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Upload failed: ${res.status}`);
  }
  return res.json();
}

export const listCustomers = (): Promise<Customer[]> => request("/customers");

export const getCustomer = (id: number): Promise<Customer> => request(`/customers/${id}`);

export const updateCustomer = (id: number, data: Partial<Customer>): Promise<Customer> =>
  request(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const getRecommendations = (
  customerId: number
): Promise<{ customer_id: number; recommendations: Recommendation[]; message?: string }> =>
  request(`/customers/${customerId}/recommendations`);

// ── Brokers ──────────────────────────────────────────────────────────────────

export const listBrokers = (city?: string): Promise<Broker[]> =>
  request(`/brokers${city ? `?city=${encodeURIComponent(city)}` : ""}`);

// ── Assignments ───────────────────────────────────────────────────────────────

export const createAssignment = (data: {
  customer_id: number;
  broker_id: number;
  ai_score?: number;
  ai_reasoning?: string;
  deadline?: string;
}): Promise<Assignment> =>
  request("/assignments", { method: "POST", body: JSON.stringify(data) });

export const listAssignments = (): Promise<Assignment[]> => request("/assignments");

export const approveAssignment = (
  id: number,
  approved_by: string,
  deadline?: string
): Promise<{ success: boolean; assignment_id: number; status: string; notification_sent: boolean }> =>
  request(`/assignments/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ approved_by, deadline }),
  });

export const rejectAssignment = (id: number): Promise<{ success: boolean }> =>
  request(`/assignments/${id}/reject`, { method: "POST", body: JSON.stringify({}) });
