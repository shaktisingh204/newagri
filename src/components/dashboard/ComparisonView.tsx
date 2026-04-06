"use client";

import { useState, useTransition } from "react";
import { getCropComparisonData } from "@/actions/crops";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CROP_COLORS = [
  { sowing: "bg-amber-400", growing: "bg-green-500", harvesting: "bg-orange-500" },
  { sowing: "bg-blue-400", growing: "bg-teal-500", harvesting: "bg-purple-500" },
  { sowing: "bg-pink-400", growing: "bg-cyan-500", harvesting: "bg-red-500" },
];

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

export default function ComparisonView({ availableCrops }: { availableCrops: string[] }) {
  const [selected, setSelected] = useState<string[]>([""]);
  const [results, setResults] = useState<CalendarEntry[]>([]);
  const [isPending, startTransition] = useTransition();

  const addCrop = () => {
    if (selected.length < 3) setSelected([...selected, ""]);
  };

  const removeCrop = (index: number) => {
    setSelected(selected.filter((_, i) => i !== index));
  };

  const updateCrop = (index: number, value: string) => {
    const updated = [...selected];
    updated[index] = value;
    setSelected(updated);
  };

  const compare = () => {
    const crops = selected.filter(Boolean);
    if (crops.length === 0) return;
    startTransition(async () => {
      const data = await getCropComparisonData(crops);
      setResults(data);
    });
  };

  // Group results by crop
  const groupedByCrop = selected.filter(Boolean).map((cropName) => ({
    cropName,
    entries: results.filter((r) => r.cropName === cropName),
  }));

  return (
    <div className="space-y-6">
      {/* Crop selector */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Select Crops to Compare (max 3)</h2>
        <div className="space-y-3">
          {selected.map((crop, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full ${CROP_COLORS[idx]?.growing || "bg-gray-400"}`}
              />
              <select
                value={crop}
                onChange={(e) => updateCrop(idx, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select a crop...</option>
                {availableCrops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {selected.length > 1 && (
                <button
                  onClick={() => removeCrop(idx)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          {selected.length < 3 && (
            <button
              onClick={addCrop}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              + Add Crop
            </button>
          )}
          <button
            onClick={compare}
            disabled={isPending || !selected.some(Boolean)}
            className="px-6 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Comparing..." : "Compare"}
          </button>
        </div>
      </div>

      {/* Comparison results */}
      {groupedByCrop.length > 0 && groupedByCrop[0].entries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="font-semibold text-lg">Side-by-Side Comparison</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Month headers */}
            <div className="grid grid-cols-12 gap-1 mb-2">
              {MONTHS.map((m) => (
                <div key={m} className="text-center text-xs font-medium text-gray-500">
                  {m}
                </div>
              ))}
            </div>

            {groupedByCrop.map((group, cropIdx) => (
              <div key={group.cropName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${CROP_COLORS[cropIdx]?.growing || "bg-gray-400"}`} />
                  <span className="font-medium text-gray-800">{group.cropName}</span>
                  <span className="text-sm text-gray-400">({group.entries.length} regions)</span>
                </div>
                {group.entries.slice(0, 5).map((entry) => (
                  <div key={entry._id}>
                    <div className="text-xs text-gray-400 mb-1 ml-5">
                      {entry.state}, {entry.region} — {entry.season}
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      {MONTHS.map((_, mi) => {
                        const phase = entry.phases?.find((p) => p.month === mi + 1);
                        const phaseType = phase?.phase || "idle";
                        const color =
                          phaseType === "idle"
                            ? "bg-gray-100"
                            : CROP_COLORS[cropIdx]?.[phaseType as keyof (typeof CROP_COLORS)[0]] || "bg-gray-300";
                        return <div key={mi} className={`h-6 rounded ${color}`} title={`${MONTHS[mi]}: ${phaseType}`} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Legend */}
            <div className="border-t pt-4 flex gap-6 text-sm text-gray-600">
              <span className="font-medium">Phases:</span>
              <span>Sowing</span>
              <span>Growing</span>
              <span>Harvesting</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
