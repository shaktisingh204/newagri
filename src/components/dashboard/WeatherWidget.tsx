"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  getWeatherForLocation,
  type WeatherResult,
} from "@/actions/weather";

export default function WeatherWidget() {
  const searchParams = useSearchParams();
  const country = searchParams.get("country") || "India";
  const state = searchParams.get("state") || "";
  const district = searchParams.get("district") || "";

  const [result, setResult] = useState<WeatherResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!country || !state || !district) {
      setResult(null);
      return;
    }
    let cancelled = false;
    startTransition(() => {
      getWeatherForLocation(country, state, district).then((res) => {
        if (!cancelled) setResult(res);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [country, state, district]);

  if (!district) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 text-sm text-gray-500">
        Select a district to see current weather.
      </div>
    );
  }

  if (isPending || (!result && district)) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-3" />
        <div className="flex gap-6">
          <div className="h-10 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 flex-1 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!result) return null;

  if (!result.ok) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 text-sm text-gray-400">
        Weather unavailable ({result.reason})
      </div>
    );
  }

  const {
    currentTemp,
    humidity,
    windSpeed,
    weatherDescription,
    daily,
    locationLabel,
  } = result;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="text-3xl font-bold text-gray-800">
            {Math.round(currentTemp)}
            <span className="text-xl text-gray-500">°C</span>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-800">
              {weatherDescription}
            </div>
            <div className="text-gray-500 text-xs">
              {locationLabel || district}
            </div>
          </div>
        </div>

        <div className="flex gap-4 text-xs text-gray-600">
          <div>
            <span className="text-gray-400">Humidity</span>{" "}
            <span className="font-medium text-gray-800">
              {Math.round(humidity)}%
            </span>
          </div>
          <div>
            <span className="text-gray-400">Wind</span>{" "}
            <span className="font-medium text-gray-800">
              {Math.round(windSpeed)} km/h
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {daily.map((d) => (
            <div
              key={d.date}
              className="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
            >
              <div className="text-gray-500">{formatDate(d.date)}</div>
              <div className="font-medium text-gray-800">
                {Math.round(d.tMax)}° / {Math.round(d.tMin)}°
              </div>
              <div className="text-gray-400">
                {d.precip.toFixed(1)} mm
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
