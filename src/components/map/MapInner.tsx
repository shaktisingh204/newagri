"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RegionData {
  _id: string;
  country: string;
  state: string;
  region: string;
  latitude: number;
  longitude: number;
  agroEcologicalZone: string;
}

export default function MapInner({ regions }: { regions: RegionData[] }) {
  const center: [number, number] =
    regions.length > 0
      ? [regions[0].latitude, regions[0].longitude]
      : [20, 0];

  return (
    <div className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-sm border">
      <MapContainer center={center} zoom={3} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {regions.map((r) => (
          <Marker key={r._id} position={[r.latitude, r.longitude]} icon={defaultIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{r.region}</p>
                <p className="text-gray-600">
                  {r.state}, {r.country}
                </p>
                {r.agroEcologicalZone && (
                  <p className="text-xs text-gray-500 mt-1">Zone: {r.agroEcologicalZone}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
