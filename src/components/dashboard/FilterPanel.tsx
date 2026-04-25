"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { getStatesForCountry, getDistrictsForState } from "@/actions/crops";

interface FilterPanelProps {
  countries: string[];
  crops: string[];
  seasons: string[];
  months: string[];
  soilTypes: string[];
  waterRequirements: string[];
}

const SORT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Crop Name (A-Z)", value: "cropName_asc" },
  { label: "Crop Name (Z-A)", value: "cropName_desc" },
  { label: "Duration (Shortest)", value: "duration_asc" },
  { label: "Duration (Longest)", value: "duration_desc" },
  { label: "Season", value: "season_asc" },
  { label: "Harvesting (Earliest)", value: "harvest_asc" },
];

export default function FilterPanel({ countries, crops, seasons, months, soilTypes, waterRequirements }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);

  const currentCountry = searchParams.get("country") || "India";
  const currentState = searchParams.get("state") || "";
  const currentDistrict = searchParams.get("district") || "";
  const currentCrop = searchParams.get("crop") || "";
  const currentSeason = searchParams.get("season") || "";
  const currentMonth = searchParams.get("month") || "";
  const currentSort = searchParams.get("sort") || "";
  const currentSoilType = searchParams.get("soilType") || "";
  const currentWaterRequirement = searchParams.get("waterRequirement") || "";

  useEffect(() => {
    let cancelled = false;
    setStates([]);
    if (currentCountry) {
      getStatesForCountry(currentCountry).then((s) => {
        if (!cancelled) setStates(s);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [currentCountry]);

  useEffect(() => {
    let cancelled = false;
    setDistricts([]);
    if (currentCountry && currentState) {
      getDistrictsForState(currentCountry, currentState).then((d) => {
        if (!cancelled) setDistricts(d);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [currentCountry, currentState]);


  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Clear dependent filters
      if (key === "country") {
        params.delete("state");
        params.delete("district");
      }
      if (key === "state") {
        params.delete("district");
      }
      startTransition(() => {
        router.push(`/dashboard?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push("/dashboard");
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        {isPending && <span className="text-sm text-green-600 animate-pulse">Loading...</span>}
        <button onClick={clearAll} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
          Clear All
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
        <SelectFilter label="Country" value={currentCountry} options={countries} onChange={(v) => updateFilter("country", v)} />
        <SelectFilter label="State" value={currentState} options={states} onChange={(v) => updateFilter("state", v)} disabled={!currentCountry} />
        <SelectFilter label="District" value={currentDistrict} options={districts} onChange={(v) => updateFilter("district", v)} disabled={!currentState} />
        <SelectFilter label="Crop" value={currentCrop} options={crops} onChange={(v) => updateFilter("crop", v)} />
        <SelectFilter label="Season" value={currentSeason} options={seasons} onChange={(v) => updateFilter("season", v)} />
        <SelectFilter label="Month" value={currentMonth} options={months} onChange={(v) => updateFilter("month", v)} />
        <SortFilter value={currentSort} onChange={(v) => updateFilter("sort", v)} />
        <SelectFilter label="Soil Type" value={currentSoilType} options={soilTypes} onChange={(v) => updateFilter("soilType", v)} />
        <SelectFilter
          label="Water Need"
          value={currentWaterRequirement}
          options={waterRequirements}
          formatLabel={(opt) => opt.charAt(0).toUpperCase() + opt.slice(1)}
          onChange={(v) => updateFilter("waterRequirement", v)}
        />
      </div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
  disabled = false,
  formatLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  formatLabel?: (opt: string) => string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
      >
        <option value="">All {label}s</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {formatLabel ? formatLabel(opt) : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function SortFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Sort</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      >
        <option value="">Default</option>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
