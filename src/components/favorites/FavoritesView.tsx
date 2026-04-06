"use client";

import { useState } from "react";
import { toggleFavorite } from "@/actions/favorites";
import toast from "react-hot-toast";
import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PHASE_COLORS: Record<string, string> = {
  sowing: "bg-amber-400",
  growing: "bg-green-500",
  harvesting: "bg-orange-500",
  idle: "bg-gray-100",
};

interface Phase {
  month: number;
  phase: string;
}

interface Calendar {
  _id: string;
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  phases: Phase[];
}

export default function FavoritesView({ calendars: initial }: { calendars: Calendar[] }) {
  const [calendars, setCalendars] = useState(initial);

  async function handleRemove(id: string) {
    try {
      await toggleFavorite(id);
      setCalendars((prev) => prev.filter((c) => c._id !== id));
      toast.success("Removed from favorites");
    } catch {
      toast.error("Failed to remove");
    }
  }

  if (calendars.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <p className="text-gray-400 text-lg">No favorites yet.</p>
        <Link href="/dashboard" className="text-green-700 hover:underline text-sm mt-2 inline-block">
          Browse the dashboard to add some
        </Link>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {calendars.map((cal) => (
        <div key={cal._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <Link href={`/crops/${cal._id}`} className="font-semibold text-gray-800 hover:text-green-700">
                {cal.cropName}
              </Link>
              <button
                onClick={() => handleRemove(cal._id)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                Remove
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {cal.country} / {cal.state}
              {cal.region ? ` / ${cal.region}` : ""}
            </p>
            <span className="inline-block mt-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
              {cal.season}
            </span>
          </div>
          <div className="px-5 pb-4">
            <div className="grid grid-cols-12 gap-0.5">
              {MONTHS.map((m, i) => {
                const phase = cal.phases?.find((p) => p.month === i + 1);
                const phaseType = phase?.phase || "idle";
                return (
                  <div key={m} className={`h-3 rounded-sm ${PHASE_COLORS[phaseType]}`} title={`${m}: ${phaseType}`} />
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">Jan</span>
              <span className="text-[10px] text-gray-400">Dec</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
