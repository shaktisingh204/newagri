"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  createCropCalendar,
  updateCropCalendar,
  type CropCalendarDoc,
  type CropCalendarInput,
} from "@/actions/adminCrud";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SEASON_OPTIONS = ["Kharif", "Rabi", "Zaid", "Summer", "Autumn", "Spring"];

type FormMode = "create" | "edit";

interface CropFormProps {
  mode: FormMode;
  initial?: CropCalendarDoc | null;
}

interface FormState {
  cropName: string;
  country: string;
  state: string;
  region: string;
  season: string;
  sowingMonths: Set<number>;
  growingMonths: Set<number>;
  harvestingMonths: Set<number>;
  durationDays: string;
  soilType: string;
  waterRequirement: "" | "low" | "medium" | "high";
  temperatureRangeMin: string;
  temperatureRangeMax: string;
  rainfallRequirement: string;
  fertilizerRecommendation: string;
  pests: string;
  yieldInfo: string;
  profitEstimate: string;
  cropImage: string;
  description: string;
}

function initialState(initial?: CropCalendarDoc | null): FormState {
  return {
    cropName: initial?.cropName ?? "",
    country: initial?.country ?? "India",
    state: initial?.state ?? "",
    region: initial?.region ?? "",
    season: initial?.season ?? "Kharif",
    sowingMonths: new Set(initial?.sowingMonths ?? []),
    growingMonths: new Set(initial?.growingMonths ?? []),
    harvestingMonths: new Set(initial?.harvestingMonths ?? []),
    durationDays: initial?.durationDays !== undefined ? String(initial.durationDays) : "",
    soilType: initial?.soilType ?? "",
    waterRequirement: (initial?.waterRequirement as "" | "low" | "medium" | "high") ?? "",
    temperatureRangeMin:
      initial?.temperatureRange?.min !== undefined ? String(initial.temperatureRange.min) : "",
    temperatureRangeMax:
      initial?.temperatureRange?.max !== undefined ? String(initial.temperatureRange.max) : "",
    rainfallRequirement: initial?.rainfallRequirement ?? "",
    fertilizerRecommendation: initial?.fertilizerRecommendation ?? "",
    pests: initial?.pests?.join(", ") ?? "",
    yieldInfo: initial?.yieldInfo ?? "",
    profitEstimate: initial?.profitEstimate ?? "",
    cropImage: initial?.cropImage ?? "",
    description: initial?.description ?? "",
  };
}

export default function CropForm({ mode, initial }: CropFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMonth(
    field: "sowingMonths" | "growingMonths" | "harvestingMonths",
    month: number
  ) {
    setState((prev) => {
      const next = new Set(prev[field]);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return { ...prev, [field]: next };
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const pestsArr = state.pests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Partial<CropCalendarInput> = {
      cropName: state.cropName,
      country: state.country,
      state: state.state,
      region: state.region,
      season: state.season,
      sowingMonths: Array.from(state.sowingMonths).sort((a, b) => a - b),
      growingMonths: Array.from(state.growingMonths).sort((a, b) => a - b),
      harvestingMonths: Array.from(state.harvestingMonths).sort((a, b) => a - b),
      durationDays: state.durationDays ? Number(state.durationDays) : undefined,
      soilType: state.soilType || undefined,
      waterRequirement: state.waterRequirement || undefined,
      temperatureRange: {
        min: state.temperatureRangeMin ? Number(state.temperatureRangeMin) : undefined,
        max: state.temperatureRangeMax ? Number(state.temperatureRangeMax) : undefined,
      },
      rainfallRequirement: state.rainfallRequirement || undefined,
      fertilizerRecommendation: state.fertilizerRecommendation || undefined,
      pests: pestsArr,
      yieldInfo: state.yieldInfo || undefined,
      profitEstimate: state.profitEstimate || undefined,
      cropImage: state.cropImage || undefined,
      description: state.description || undefined,
    };

    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createCropCalendar(payload)
            : await updateCropCalendar(initial!._id, payload);

        if (result.error) {
          setError(result.error);
          toast.error(result.error);
          return;
        }

        toast.success(mode === "create" ? "Record created" : "Record updated");
        router.push("/admin/crops");
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        toast.error(msg);
      }
    });
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="cropName">Crop Name *</label>
            <input
              id="cropName"
              type="text"
              value={state.cropName}
              onChange={(e) => updateField("cropName", e.target.value)}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="season">Season *</label>
            <select
              id="season"
              value={state.season}
              onChange={(e) => updateField("season", e.target.value)}
              className={inputCls}
              required
            >
              {SEASON_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="country">Country *</label>
            <input
              id="country"
              type="text"
              value={state.country}
              onChange={(e) => updateField("country", e.target.value)}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="state">State *</label>
            <input
              id="state"
              type="text"
              value={state.state}
              onChange={(e) => updateField("state", e.target.value)}
              className={inputCls}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="region">District / Region *</label>
            <input
              id="region"
              type="text"
              value={state.region}
              onChange={(e) => updateField("region", e.target.value)}
              className={inputCls}
              required
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Phase Months</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select the months for each phase. If a month appears in multiple lists, priority is
            sowing &gt; growing &gt; harvesting.
          </p>
        </div>

        {(
          [
            ["sowingMonths", "Sowing"],
            ["growingMonths", "Growing"],
            ["harvestingMonths", "Harvesting"],
          ] as const
        ).map(([field, label]) => (
          <div key={field}>
            <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
              {MONTH_NAMES.map((name, idx) => {
                const m = idx + 1;
                const active = state[field].has(m);
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => toggleMonth(field, m)}
                    className={`border rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-green-700 text-white border-green-700"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Agronomic Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="durationDays">Duration (days)</label>
            <input
              id="durationDays"
              type="number"
              min={0}
              value={state.durationDays}
              onChange={(e) => updateField("durationDays", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="soilType">Soil Type</label>
            <input
              id="soilType"
              type="text"
              value={state.soilType}
              onChange={(e) => updateField("soilType", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="waterRequirement">Water Requirement</label>
            <select
              id="waterRequirement"
              value={state.waterRequirement}
              onChange={(e) =>
                updateField("waterRequirement", e.target.value as FormState["waterRequirement"])
              }
              className={inputCls}
            >
              <option value="">—</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="rainfallRequirement">Rainfall Requirement</label>
            <input
              id="rainfallRequirement"
              type="text"
              value={state.rainfallRequirement}
              onChange={(e) => updateField("rainfallRequirement", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="temperatureRangeMin">Temperature Min (°C)</label>
            <input
              id="temperatureRangeMin"
              type="number"
              value={state.temperatureRangeMin}
              onChange={(e) => updateField("temperatureRangeMin", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="temperatureRangeMax">Temperature Max (°C)</label>
            <input
              id="temperatureRangeMax"
              type="number"
              value={state.temperatureRangeMax}
              onChange={(e) => updateField("temperatureRangeMax", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="fertilizerRecommendation">Fertilizer Recommendation</label>
            <textarea
              id="fertilizerRecommendation"
              value={state.fertilizerRecommendation}
              onChange={(e) => updateField("fertilizerRecommendation", e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="pests">Pests (comma-separated)</label>
            <input
              id="pests"
              type="text"
              value={state.pests}
              onChange={(e) => updateField("pests", e.target.value)}
              className={inputCls}
              placeholder="e.g. Aphids, Stem borer, Leaf hopper"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Economics &amp; Metadata</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="yieldInfo">Yield Info</label>
            <input
              id="yieldInfo"
              type="text"
              value={state.yieldInfo}
              onChange={(e) => updateField("yieldInfo", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="profitEstimate">Profit Estimate</label>
            <input
              id="profitEstimate"
              type="text"
              value={state.profitEstimate}
              onChange={(e) => updateField("profitEstimate", e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="cropImage">Crop Image URL</label>
            <input
              id="cropImage"
              type="url"
              value={state.cropImage}
              onChange={(e) => updateField("cropImage", e.target.value)}
              className={inputCls}
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="description">Description</label>
            <textarea
              id="description"
              value={state.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/crops"
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Record"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
