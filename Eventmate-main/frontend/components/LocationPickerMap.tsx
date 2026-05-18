"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

type LocationPickerMapProps = {
  center: [number, number];
  marker: [number, number] | null;
  flyTo: [number, number] | null;
  zoom?: number;
  height: string;
  onMapClick: (lat: number, lng: number) => void;
};

function MapFlyTo({
  target,
  zoom = 15,
}: {
  target: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo(target, zoom, { duration: 1 });
  }, [map, target?.[0], target?.[1], zoom]);

  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({
  center,
  marker,
  flyTo,
  zoom = 13,
  height,
  onMapClick,
}: LocationPickerMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFlyTo target={flyTo} zoom={15} />
      <MapClickHandler onMapClick={onMapClick} />
      {marker && <Marker position={marker} />}
    </MapContainer>
  );
}
