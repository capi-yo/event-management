"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  locationName?: string;
  height?: string;
}

export default function LocationMap({
  latitude,
  longitude,
  locationName,
  height = "400px",
}: LocationMapProps) {
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Convert to numbers and validate
  const lat = typeof latitude === "string" ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === "string" ? parseFloat(longitude) : longitude;

  // Debug logging
  useEffect(() => {
    console.log("LocationMap props:", {
      latitude,
      longitude,
      lat,
      lng,
      locationName,
    });
  }, [latitude, longitude, lat, lng, locationName]);

  useEffect(() => {
    setMounted(true);

    // Fix for default marker icon
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
      setIsReady(true);
    });
  }, []);

  if (!mounted || !isReady) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Location not available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden border border-gray-200 shadow-sm"
      style={{ height, minHeight: height }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%", minHeight: height }}
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={1}
        />
        <Marker position={[lat, lng]}>
          {locationName && (
            <Popup>
              <div className="text-sm font-medium p-1">{locationName}</div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
