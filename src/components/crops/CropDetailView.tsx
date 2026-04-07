"use client";

import { useState } from "react";
import { toggleFavorite } from "@/actions/favorites";
import { getCropAIInfo } from "@/actions/ai";
import toast from "react-hot-toast";
import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const PHASE_COLORS: Record<string, string> = {
  sowing: "bg-amber-400 text-amber-900",
  growing: "bg-green-500 text-green-900",
  harvesting: "bg-orange-500 text-orange-900",
  idle: "bg-gray-100 text-gray-400",
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
  sowingMonths: number[];
  growingMonths: number[];
  harvestingMonths: number[];
}

export default function CropDetailView({
  calendar,
  initialFavorited,
}: {
  calendar: Calendar;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [copying, setCopying] = useState(false);
  const [aiInfo, setAiInfo] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const totalDuration = calendar.phases?.filter((p) => p.phase !== "idle").length || 0;

  async function handleAIInfo() {
    if (aiInfo) {
      setAiInfo(null);
      return;
    }
    setAiLoading(true);
    try {
      const result = await getCropAIInfo(calendar.cropName, calendar.country, calendar.state, calendar.season);
      if (result.error) {
        toast.error(result.error);
      } else {
        setAiInfo(result.info!);
      }
    } catch {
      toast.error("Failed to get AI info");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleFavorite() {
    try {
      const result = await toggleFavorite(calendar._id);
      setFavorited(result.favorited);
      toast.success(result.favorited ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/crops/${calendar._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopying(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  const sowingMonthNames = calendar.sowingMonths.map((m) => FULL_MONTHS[m - 1]);
  const growingMonthNames = calendar.growingMonths.map((m) => FULL_MONTHS[m - 1]);
  const harvestingMonthNames = calendar.harvestingMonths.map((m) => FULL_MONTHS[m - 1]);

  const totalActiveMonths = calendar.sowingMonths.length + calendar.growingMonths.length + calendar.harvestingMonths.length;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/dashboard" className="text-green-700 hover:underline text-sm font-medium">
        &larr; Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{calendar.cropName}</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              {calendar.country} / {calendar.state}
              {calendar.region ? ` / ${calendar.region}` : ""}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {calendar.season}
              </span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Duration: {totalDuration} month{totalDuration !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAIInfo}
              disabled={aiLoading}
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {aiLoading ? "Loading..." : aiInfo ? "Hide AI" : "AI Info"}
            </button>
            <button
              onClick={handleFavorite}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                favorited
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {favorited ? "Unfavorite" : "Favorite"}
            </button>
            <button
              onClick={handleShare}
              className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {copying ? "Copied!" : "Share Link"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Info */}
      {aiInfo && (
        <div className="bg-purple-50 rounded-xl shadow-sm border border-purple-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-purple-700 mb-3">AI Insights</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{aiInfo}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">12-Month Calendar</h2>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 gap-1.5 min-w-[480px]">
            {MONTHS.map((m, i) => {
              const phase = calendar.phases?.find((p) => p.month === i + 1);
              const phaseType = phase?.phase || "idle";
              return (
                <div key={m} className="text-center">
                  <div className="text-xs text-gray-500 mb-1.5">{m}</div>
                  <div
                    className={`h-12 sm:h-14 rounded-lg ${PHASE_COLORS[phaseType]} flex items-center justify-center`}
                    title={`${FULL_MONTHS[i]}: ${phaseType}`}
                  >
                    <span className="text-xs font-semibold capitalize">
                      {phaseType !== "idle" ? phaseType.slice(0, 3) : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-4">
          {["sowing", "growing", "harvesting"].map((phase) => (
            <div key={phase} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${PHASE_COLORS[phase].split(" ")[0]}`} />
              <span className="text-xs text-gray-600 capitalize">{phase}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Total Duration" value={`${totalDuration} months`} />
        <StatCard label="Active Months" value={`${totalActiveMonths} / 12`} />
        <StatCard label="Sowing" value={`${calendar.sowingMonths.length} months`} />
        <StatCard label="Growing" value={`${calendar.growingMonths.length} months`} />
        <StatCard label="Harvesting" value={`${calendar.harvestingMonths.length} months`} />
      </div>

      {/* Phase Details */}
      <div className="grid sm:grid-cols-3 gap-4">
        <PhaseCard title="Sowing Period" months={sowingMonthNames} color="amber" />
        <PhaseCard title="Growing Period" months={growingMonthNames} color="green" />
        <PhaseCard title="Harvesting Period" months={harvestingMonthNames} color="orange" />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4 text-center">
      <div className="text-xl sm:text-2xl font-bold text-green-700">{value}</div>
      <div className="text-xs sm:text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function PhaseCard({ title, months, color }: { title: string; months: string[]; color: string }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 border-amber-200",
    green: "bg-green-50 border-green-200",
    orange: "bg-orange-50 border-orange-200",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
      {months.length > 0 ? (
        <ul className="space-y-1">
          {months.map((m) => (
            <li key={m} className="text-sm text-gray-600">{m}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">No data</p>
      )}
    </div>
  );
}
