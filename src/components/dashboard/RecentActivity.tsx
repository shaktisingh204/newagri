"use client";

import Link from "next/link";

interface Activity {
  cropName: string;
  country: string;
  createdAt: string;
}

export default function RecentActivity({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="font-semibold text-gray-800 mb-3">Recent Searches</h3>
      <div className="space-y-2">
        {activities.map((a, i) => (
          <Link
            key={i}
            href={`/dashboard?crop=${encodeURIComponent(a.cropName)}${a.country ? `&country=${encodeURIComponent(a.country)}` : ""}`}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">{a.cropName}</span>
            <div className="flex items-center gap-2">
              {a.country && <span className="text-xs text-gray-400">{a.country}</span>}
              <span className="text-xs text-gray-300">
                {new Date(a.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
