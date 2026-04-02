"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const [useMapEvents, setUseMapEvents] = useState<any>(null);

  useEffect(() => {
    import("react-leaflet").then((mod) => {
      setUseMapEvents(() => mod.useMapEvents);
    });
  }, []);

  if (!useMapEvents) return null;

  const MapEvents = () => {
    useMapEvents({
      click(e: any) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return <MapEvents />;
}

export default function LocationPicker({
  latitude,
  longitude,
  onLocationSelect,
  height = "400px",
}: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null,
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    9.032, 38.7469,
  ]);
  const [locating, setLocating] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

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
    });
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
      setMapCenter([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition([lat, lng]);
          setMapCenter([lat, lng]);
          onLocationSelect(lat, lng);

          // Fly to the new location
          if (mapInstance) {
            mapInstance.flyTo([lat, lng], 15);
          }
          setLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Unable to get your location. Please ensure location services are enabled.",
          );
          setLocating(false);
        },
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height, width: "100%" }}
        scrollWheelZoom={true}
        ref={setMapInstance}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        {position && <Marker position={position} />}
      </MapContainer>

      {/* Instructions */}
      <div className="absolute top-3 left-3 bg-white px-3 py-2 rounded-lg shadow-md text-xs font-medium text-gray-700 z-[1000]">
        <MapPin className="h-3 w-3 inline mr-1" />
        Click on map to select location
      </div>

      {/* Locate Me Button */}
      <div className="absolute top-3 right-3 z-[1000]">
        <Button
          type="button"
          size="sm"
          onClick={handleLocateMe}
          disabled={locating}
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-md"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
          <span className="ml-2">Locate Me</span>
        </Button>
      </div>
    </div>
  );
}
