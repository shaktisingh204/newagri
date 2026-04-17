"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { getBestCropsForCurrentMonth } from "@/actions/crops";

interface BestCrop {
  cropName: string;
  season: string;
  reason: string;
}

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

export default function BestCropBadge() {
  const searchParams = useSearchParams();
  const country = searchParams.get("country") || "";
  const state = searchParams.get("state") || "";
  const district = searchParams.get("district") || "";

  const [crops, setCrops] = useState<BestCrop[]>([]);
  const [, startTransition] = useTransition();
  const [monthName, setMonthName] = useState<string>("");

  useEffect(() => {
    setMonthName(MONTH_NAMES[new Date().getMonth()] ?? "");
    let cancelled = false;
    startTransition(() => {
      getBestCropsForCurrentMonth({
        country: country || undefined,
        state: state || undefined,
        district: district || undefined,
      })
        .then((result) => {
          if (!cancelled) setCrops(result);
        })
        .catch(() => {
          if (!cancelled) setCrops([]);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [country, state, district]);

  if (crops.length === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-green-900 mb-3">
        Best Crops This Month{monthName ? ` — ${monthName}` : ""}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {crops.map((crop) => (
          <li
            key={crop.cropName}
            className="flex items-center gap-2 bg-white border border-green-200 rounded-full px-3 py-1.5"
          >
            <span className="text-sm font-medium text-gray-900">{crop.cropName}</span>
            <span className="text-xs text-gray-500">{crop.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
