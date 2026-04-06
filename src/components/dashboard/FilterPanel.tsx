"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { getStatesForCountry, getRegionsForState } from "@/actions/crops";

interface FilterPanelProps {
  countries: string[];
  crops: string[];
  seasons: string[];
  months: string[];
}

export default function FilterPanel({ countries, crops, seasons, months }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [states, setStates] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  const currentCountry = searchParams.get("country") || "";
  const currentState = searchParams.get("state") || "";
  const currentRegion = searchParams.get("region") || "";
  const currentCrop = searchParams.get("crop") || "";
  const currentSeason = searchParams.get("season") || "";
  const currentMonth = searchParams.get("month") || "";

  useEffect(() => {
    if (currentCountry) {
      getStatesForCountry(currentCountry).then(setStates);
    } else {
      setStates([]);
    }
  }, [currentCountry]);

  useEffect(() => {
    if (currentCountry && currentState) {
      getRegionsForState(currentCountry, currentState).then(setRegions);
    } else {
      setRegions([]);
    }
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
        params.delete("region");
      }
      if (key === "state") {
        params.delete("region");
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SelectFilter label="Country" value={currentCountry} options={countries} onChange={(v) => updateFilter("country", v)} />
        <SelectFilter label="State" value={currentState} options={states} onChange={(v) => updateFilter("state", v)} disabled={!currentCountry} />
        <SelectFilter label="Region" value={currentRegion} options={regions} onChange={(v) => updateFilter("region", v)} disabled={!currentState} />
        <SelectFilter label="Crop" value={currentCrop} options={crops} onChange={(v) => updateFilter("crop", v)} />
        <SelectFilter label="Season" value={currentSeason} options={seasons} onChange={(v) => updateFilter("season", v)} />
        <SelectFilter label="Month" value={currentMonth} options={months} onChange={(v) => updateFilter("month", v)} />
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
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
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
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
