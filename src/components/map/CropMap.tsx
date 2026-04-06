"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface RegionData {
  _id: string;
  country: string;
  state: string;
  region: string;
  latitude: number;
  longitude: number;
  agroEcologicalZone: string;
}

// Dynamically import to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import("./MapInner"), { ssr: false, loading: () => <MapPlaceholder /> });

function MapPlaceholder() {
  return (
    <div className="h-[300px] sm:h-[400px] lg:h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
      <p className="text-gray-400">Loading map...</p>
    </div>
  );
}

export default function CropMap({ regions }: { regions: RegionData[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <MapPlaceholder />;

  return <MapInner regions={regions} />;
}
