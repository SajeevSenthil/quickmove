import { formatCurrency, formatDate } from "@/lib/utils";
import type { Customer } from "@/lib/api";
import { MapPin, IndianRupee, Home, Calendar, Briefcase, Check, X } from "lucide-react";

interface Props {
  customer: Customer;
}

export default function CustomerProfileCard({ customer }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
        <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-sm">
          <MapPin className="w-3.5 h-3.5" />
          <span>Moving to {customer.city}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoRow
          icon={<IndianRupee className="w-4 h-4" />}
          label="Budget"
          value={
            customer.budget_min || customer.budget_max
              ? `${formatCurrency(customer.budget_min)} – ${formatCurrency(customer.budget_max)}/mo`
              : "Not specified"
          }
        />
        <InfoRow
          icon={<Home className="w-4 h-4" />}
          label="Apartment Type"
          value={customer.apartment_type ?? "Not specified"}
        />
        <InfoRow
          icon={<Calendar className="w-4 h-4" />}
          label="Move Date"
          value={formatDate(customer.move_date)}
        />
        <InfoRow
          icon={<Briefcase className="w-4 h-4" />}
          label="Office Location"
          value={customer.office_location ?? "Not specified"}
        />
      </div>

      {customer.preferred_regions?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Preferred Localities
          </p>
          <div className="flex flex-wrap gap-1.5">
            {customer.preferred_regions.map((r) => (
              <span
                key={r}
                className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs rounded-full border border-brand-100"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        <BoolPill label="Parking" value={customer.parking_required} />
        <BoolPill label="Pets" value={customer.pets_allowed} />
        <span className="text-gray-600">
          {customer.furnished_status
            ? customer.furnished_status.charAt(0).toUpperCase() + customer.furnished_status.slice(1)
            : ""}
        </span>
      </div>

      {customer.special_requirements?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Special Requirements
          </p>
          <ul className="space-y-1">
            {customer.special_requirements.map((req, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function BoolPill({ label, value }: { label: string; value: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
        value
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-gray-50 text-gray-500 border-gray-200"
      }`}
    >
      {value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {label}
    </span>
  );
}
