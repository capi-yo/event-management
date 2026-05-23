"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchPlaces, type GeocodedPlace } from "@/lib/geocoding";

type LocationSelection = {
  name: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
};

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (selection: LocationSelection) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Type location name",
  className,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchPlaces(query, controller.signal);
        setSuggestions(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Location autocomplete failed:", error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="relative z-[10004]">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      {query.length >= 3 && (loading || suggestions.length > 0) && (
        <div className="absolute z-[10005] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {loading && (
            <div className="px-4 py-3 text-sm text-slate-500">Searching locations...</div>
          )}
          {!loading &&
            suggestions.map((suggestion) => {
              // Strip the venue name from the start of display_name to show a clean sub-address
              let subAddress = suggestion.display_name;
              if (subAddress.startsWith(suggestion.venue)) {
                subAddress = subAddress.substring(suggestion.venue.length).replace(/^[,\s]+/, "");
              }
              
              return (
                <button
                  key={`${suggestion.lat}-${suggestion.lng}-${suggestion.display_name}`}
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition flex flex-col gap-0.5"
                  onClick={() => {
                    onSelect({
                      name: suggestion.venue,
                      lat: suggestion.lat,
                      lng: suggestion.lng,
                      city: suggestion.city,
                      country: suggestion.country,
                    });
                    setSuggestions([]);
                  }}
                >
                  <span className="font-semibold text-slate-800">{suggestion.venue}</span>
                  {subAddress && (
                    <span className="text-xs text-slate-400 truncate max-w-full">{subAddress}</span>
                  )}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
