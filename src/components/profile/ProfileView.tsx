"use client";

import { useActionState, useEffect } from "react";
import { updatePassword } from "@/actions/profile";
import toast from "react-hot-toast";
import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PHASE_COLORS: Record<string, string> = {
  sowing: "bg-amber-400",
  growing: "bg-green-500",
  harvesting: "bg-orange-500",
  idle: "bg-gray-100",
};

interface Profile {
  _id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  createdAt: string;
}

interface Phase {
  month: number;
  phase: string;
}

interface FavCalendar {
  _id: string;
  cropName: string;
  country: string;
  state: string;
  season: string;
  phases: Phase[];
}

export default function ProfileView({ profile, favorites }: { profile: Profile; favorites: FavCalendar[] }) {
  const [state, formAction, pending] = useActionState(updatePassword, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Profile Info */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h2>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <InfoRow label="Name" value={profile.name} />
          <InfoRow label="Email" value={profile.email} />
          <InfoRow label="Role" value={profile.role} />
          <InfoRow label="Tenant ID" value={profile.tenantId} />
          <InfoRow label="Member Since" value={new Date(profile.createdAt).toLocaleDateString()} />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
        <form action={formAction} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {pending ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Favorite Crops */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Favorite Crops ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <p className="text-gray-400">No favorites yet. Browse the dashboard to add some.</p>
        ) : (
          <div className="space-y-3">
            {favorites.map((cal) => (
              <Link
                key={cal._id}
                href={`/crops/${cal._id}`}
                className="block bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                  <span className="font-medium text-gray-800">{cal.cropName}</span>
                  <span className="text-xs text-gray-500">
                    {cal.country} / {cal.state} &middot; {cal.season}
                  </span>
                </div>
                <div className="grid grid-cols-12 gap-0.5">
                  {MONTHS.map((m, i) => {
                    const phase = cal.phases?.find((p) => p.month === i + 1);
                    const phaseType = phase?.phase || "idle";
                    return (
                      <div key={m} className={`h-2 rounded-sm ${PHASE_COLORS[phaseType]}`} title={`${m}: ${phaseType}`} />
                    );
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-sm text-gray-500">{label}</span>
      <p className="font-medium text-gray-800 truncate">{value}</p>
    </div>
  );
}
