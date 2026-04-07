"use client";

import { useState } from "react";
import { toggleFavorite } from "@/actions/favorites";
import { getCropAIInfo } from "@/actions/ai";
import toast from "react-hot-toast";
import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PHASE_COLORS: Record<string, string> = {
  sowing: "bg-amber-400",
  growing: "bg-green-500",
  harvesting: "bg-orange-500",
  idle: "bg-gray-100",
};

const PHASE_TEXT_COLORS: Record<string, string> = {
  sowing: "text-amber-800",
  growing: "text-green-900",
  harvesting: "text-orange-900",
  idle: "text-gray-400",
};

interface Phase {
  month: number;
  phase: string;
}

interface CalendarEntry {
  _id: string;
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  phases: Phase[];
}

function getCropDuration(phases: Phase[]): string {
  const active = phases.filter((p) => p.phase !== "idle").length;
  return `${active} month${active !== 1 ? "s" : ""}`;
}

export default function CropTimeline({
  calendars,
  favoriteIds,
}: {
  calendars: CalendarEntry[];
  favoriteIds: string[];
}) {
  const [favSet, setFavSet] = useState<Set<string>>(new Set(favoriteIds));
  const [aiInfo, setAiInfo] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  async function handleAIInfo(cal: CalendarEntry) {
    if (aiInfo[cal._id]) {
      setAiInfo((prev) => {
        const next = { ...prev };
        delete next[cal._id];
        return next;
      });
      return;
    }
    setAiLoading(cal._id);
    try {
      const result = await getCropAIInfo(cal.cropName, cal.country, cal.state, cal.season);
      if (result.error) {
        toast.error(result.error);
      } else {
        setAiInfo((prev) => ({ ...prev, [cal._id]: result.info! }));
      }
    } catch {
      toast.error("Failed to get AI info");
    } finally {
      setAiLoading(null);
    }
  }

  async function handleToggleFav(id: string) {
    try {
      const result = await toggleFavorite(id);
      setFavSet((prev) => {
        const next = new Set(prev);
        if (result.favorited) next.add(id);
        else next.delete(id);
        return next;
      });
      toast.success(result.favorited ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  if (calendars.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 sm:p-12 text-center">
        <p className="text-gray-500 text-lg">No crop calendars found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4 flex flex-wrap items-center gap-3 sm:gap-6">
        <span className="text-sm font-medium text-gray-600">Legend:</span>
        {Object.entries(PHASE_COLORS)
          .filter(([k]) => k !== "idle")
          .map(([phase, color]) => (
            <div key={phase} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="text-sm capitalize text-gray-700">{phase}</span>
            </div>
          ))}
      </div>

      {/* Timeline cards */}
      {calendars.map((cal) => (
        <div key={cal._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Link href={`/crops/${cal._id}`} className="font-semibold text-base sm:text-lg text-gray-800 hover:text-green-700 transition-colors">
                {cal.cropName}
              </Link>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-500">
                  {cal.country} / {cal.state}
                  {cal.region ? ` / ${cal.region}` : ""}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {cal.season}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {getCropDuration(cal.phases || [])}
                </span>
                <button
                  onClick={() => handleAIInfo(cal)}
                  disabled={aiLoading === cal._id}
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                  title="Get AI insights"
                >
                  {aiLoading === cal._id ? "Loading..." : aiInfo[cal._id] ? "Hide AI" : "AI Info"}
                </button>
                <button
                  onClick={() => handleToggleFav(cal._id)}
                  className={`text-sm px-2 py-1 rounded transition-colors ${
                    favSet.has(cal._id)
                      ? "text-red-500 hover:text-red-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  title={favSet.has(cal._id) ? "Remove from favorites" : "Add to favorites"}
                >
                  {favSet.has(cal._id) ? "\u2665" : "\u2661"}
                </button>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4 overflow-x-auto">
            <div className="grid grid-cols-12 gap-1 min-w-[480px]">
              {MONTHS.map((m, i) => {
                const phase = cal.phases?.find((p) => p.month === i + 1);
                const phaseType = phase?.phase || "idle";
                return (
                  <div key={m} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{m}</div>
                    <div
                      className={`h-10 rounded-lg ${PHASE_COLORS[phaseType]} flex items-center justify-center transition-all hover:scale-105`}
                      title={`${m}: ${phaseType}`}
                    >
                      <span className={`text-xs font-medium ${PHASE_TEXT_COLORS[phaseType]}`}>
                        {phaseType !== "idle" ? phaseType.charAt(0).toUpperCase() : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {aiInfo[cal._id] && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-purple-50">
              <p className="text-xs font-semibold text-purple-700 mb-2">AI Insights</p>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{aiInfo[cal._id]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
