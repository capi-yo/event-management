"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Crosshair, Loader2, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GeocodedPlace, searchPlaces } from "@/lib/geocoding";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
});

const DEFAULT_CENTER: [number, number] = [9.032, 38.7469];

export type LocationPickerPlace = GeocodedPlace;

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  locationLabel?: string;
  onLocationSelect: (lat: number, lng: number) => void;
  onPlaceSelect?: (place: GeocodedPlace) => void;
  height?: string;
}

export default function LocationPicker({
  latitude,
  longitude,
  locationLabel = "",
  onLocationSelect,
  onPlaceSelect,
  height = "400px",
}: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(locationLabel);
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [confirmedLabel, setConfirmedLabel] = useState(locationLabel);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const parsedLat = latitude != null && String(latitude) !== "" ? Number(latitude) : null;
  const parsedLng = longitude != null && String(longitude) !== "" ? Number(longitude) : null;
  const isValidCoords = parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng);

  const [marker, setMarker] = useState<[number, number] | null>(
    isValidCoords ? [parsedLat as number, parsedLng as number] : null,
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    isValidCoords ? [parsedLat as number, parsedLng as number] : DEFAULT_CENTER,
  );
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  const applyCoordinates = useCallback(
    (lat: number, lng: number) => {
      const next: [number, number] = [lat, lng];
      setMarker(next);
      setMapCenter(next);
      setFlyTo([...next]);
      onLocationSelect(lat, lng);
    },
    [onLocationSelect],
  );

  const applyPlace = useCallback(
    (place: GeocodedPlace) => {
      setSearchQuery(place.venue);
      setConfirmedLabel(place.display_name);
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError("");
      applyCoordinates(place.lat, place.lng);
      onPlaceSelect?.(place);
    },
    [applyCoordinates, onPlaceSelect],
  );

  useEffect(() => {
    setMounted(true);

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
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
    setSearchQuery(locationLabel);
    setConfirmedLabel(locationLabel);
  }, [locationLabel]);

  useEffect(() => {
    if (latitude == null || longitude == null || String(latitude) === "" || String(longitude) === "") return;
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) return;
    const next: [number, number] = [latNum, lngNum];
    setMarker(next);
    setMapCenter(next);
    setFlyTo([...next]);
  }, [latitude, longitude]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setSearching(true);
        setSearchError("");
        const results = await searchPlaces(query, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setShowSuggestions(true);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Location search failed:", error);
          setSuggestions([]);
          setSearchError("Could not search locations. Try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  const runSearch = async () => {
    const query = searchQuery.trim();
    if (query.length < 3) return;

    setSearching(true);
    setSearchError("");
    try {
      const results = await searchPlaces(query);
      setSuggestions(results);
      setShowSuggestions(true);

      if (results.length === 0) {
        setSearchError("No places found. Try a more specific name.");
        return;
      }

      applyPlace(results[0]);
    } catch (error) {
      console.error("Location search failed:", error);
      setSearchError("Could not search locations. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void runSearch();
  };

  const handleMapClick = (lat: number, lng: number) => {
    applyCoordinates(lat, lng);
    const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setConfirmedLabel(`${label} (map)`);
    setSearchQuery(label);
    setShowSuggestions(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyCoordinates(position.coords.latitude, position.coords.longitude);
        setSearchQuery("Current location");
        setConfirmedLabel("Current location");
        setLocating(false);
      },
      () => {
        setSearchError(
          "Unable to get your location. Check browser permissions.",
        );
        setLocating(false);
      },
    );
  };

  const confirmSelection = () => {
    if (!marker) {
      setSearchError("Select a place from search or click on the map first.");
      return;
    }
    const label = searchQuery.trim() || confirmedLabel || `${Number(marker[0]).toFixed(5)}, ${Number(marker[1]).toFixed(5)}`;
    setConfirmedLabel(label);
    setShowSuggestions(false);
    setSearchError("");

    // Propagate selection to the parent form to ensure values are captured
    onLocationSelect(marker[0], marker[1]);
    if (onPlaceSelect) {
      onPlaceSelect({
        venue: label.split(",")[0].trim(),
        display_name: label,
        lat: marker[0],
        lng: marker[1],
        city: "",
        country: ""
      });
    }
  };

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-100"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative w-full z-[10002]">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Search location (e.g. Addis Ababa Bole Medhanealem)"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setSearchError("");
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full right-0 left-0 z-[10003] mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                {suggestions.map((place) => {
                  let subAddress = place.display_name;
                  if (subAddress.startsWith(place.venue)) {
                    subAddress = subAddress.substring(place.venue.length).replace(/^[,\s]+/, "");
                  }

                  return (
                    <button
                      key={`${place.lat}-${place.lng}-${place.display_name}`}
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition flex flex-col gap-0.5"
                      onClick={() => applyPlace(place)}
                    >
                      <span className="font-semibold text-slate-800">{place.venue}</span>
                      {subAddress && (
                        <span className="text-xs text-slate-400 truncate max-w-full">{subAddress}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={searching}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </form>
      </div>

      {searchError && <p className="text-sm text-red-600">{searchError}</p>}

      <div className="relative overflow-hidden rounded-lg border border-gray-200">
        <LocationPickerMap
          center={mapCenter}
          marker={marker}
          flyTo={flyTo}
          height={height}
          onMapClick={handleMapClick}
        />

        <div className="absolute top-3 left-3 z-[1000] rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-md">
          <MapPin className="mr-1 inline h-3 w-3" />
          Search above or click the map to pin
        </div>

        <div className="absolute top-3 right-3 z-[1000]">
          <Button
            type="button"
            size="sm"
            onClick={handleLocateMe}
            disabled={locating}
            className="border border-gray-300 bg-white text-gray-700 shadow-md hover:bg-gray-50"
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

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-slate-50 px-3 py-2 text-sm">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800">
            {marker ? "Selected location" : "No location selected"}
          </p>
          <p className="truncate text-gray-600">
            {confirmedLabel ||
              (marker
                ? `${Number(marker[0]).toFixed(5)}, ${Number(marker[1]).toFixed(5)}`
                : "Search or click the map to choose a venue")}
          </p>
          {marker && (
            <p className="text-xs text-gray-500">
              {Number(marker[0]).toFixed(6)}, {Number(marker[1]).toFixed(6)}
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={confirmSelection}
          disabled={!marker}
          className="shrink-0 bg-green-600 text-white hover:bg-green-700"
        >
          <Check className="mr-1 h-4 w-4" />
          Confirm location
        </Button>
      </div>
    </div>
  );
}
