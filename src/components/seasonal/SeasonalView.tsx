"use client";

import { useState } from "react";
import Link from "next/link";

const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const PHASE_BADGE: Record<string, string> = {
  sowing: "bg-amber-100 text-amber-800",
  growing: "bg-green-100 text-green-800",
  harvesting: "bg-orange-100 text-orange-800",
};

interface SeasonalCrop {
  _id: string;
  cropName: string;
  country: string;
  state: string;
  season: string;
  currentPhase: string;
}

export default function SeasonalView({
  data,
  currentMonth,
}: {
  data: SeasonalCrop[];
  currentMonth: number;
}) {
  const [filterPhase, setFilterPhase] = useState<string>("all");

  const filtered = filterPhase === "all" ? data : data.filter((c) => c.currentPhase === filterPhase);

  const sowingCount = data.filter((c) => c.currentPhase === "sowing").length;
  const growingCount = data.filter((c) => c.currentPhase === "growing").length;
  const harvestingCount = data.filter((c) => c.currentPhase === "harvesting").length;

  return (
    <div className="space-y-6">
      {/* Current Month */}
      <div className="bg-white rounded-xl shadow-sm border p-5 sm:p-6 text-center">
        <p className="text-gray-500 text-sm">Current Month</p>
        <p className="text-2xl sm:text-3xl font-bold text-green-700">{FULL_MONTHS[currentMonth - 1]}</p>
        <p className="text-gray-500 mt-1 text-sm">{data.length} crops currently active</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <button
          onClick={() => setFilterPhase(filterPhase === "sowing" ? "all" : "sowing")}
          className={`rounded-xl border p-3 sm:p-4 text-center transition-colors ${filterPhase === "sowing" ? "ring-2 ring-amber-400" : ""}`}
        >
          <div className="text-xl sm:text-2xl font-bold text-amber-600">{sowingCount}</div>
          <div className="text-xs sm:text-sm text-gray-500">Sowing</div>
        </button>
        <button
          onClick={() => setFilterPhase(filterPhase === "growing" ? "all" : "growing")}
          className={`rounded-xl border p-3 sm:p-4 text-center transition-colors ${filterPhase === "growing" ? "ring-2 ring-green-400" : ""}`}
        >
          <div className="text-xl sm:text-2xl font-bold text-green-600">{growingCount}</div>
          <div className="text-xs sm:text-sm text-gray-500">Growing</div>
        </button>
        <button
          onClick={() => setFilterPhase(filterPhase === "harvesting" ? "all" : "harvesting")}
          className={`rounded-xl border p-3 sm:p-4 text-center transition-colors ${filterPhase === "harvesting" ? "ring-2 ring-orange-400" : ""}`}
        >
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{harvestingCount}</div>
          <div className="text-xs sm:text-sm text-gray-500">Harvesting</div>
        </button>
      </div>

      {/* Crop List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 sm:p-12 text-center">
          <p className="text-gray-400">No crops in this phase right now.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((crop) => (
            <Link
              key={crop._id}
              href={`/crops/${crop._id}`}
              className="bg-white rounded-xl shadow-sm border p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{crop.cropName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${PHASE_BADGE[crop.currentPhase]}`}>
                  {crop.currentPhase}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">{crop.country} / {crop.state}</p>
              <p className="text-xs text-gray-400 mt-1">{crop.season}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
