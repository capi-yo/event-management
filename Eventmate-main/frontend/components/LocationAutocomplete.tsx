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
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      {query.length >= 3 && (loading || suggestions.length > 0) && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching locations...</div>
          )}
          {!loading &&
            suggestions.map((suggestion) => (
              <button
                key={`${suggestion.lat}-${suggestion.lng}-${suggestion.display_name}`}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onSelect({
                    name: suggestion.display_name,
                    lat: suggestion.lat,
                    lng: suggestion.lng,
                    city: suggestion.city,
                    country: suggestion.country,
                  });
                  setSuggestions([]);
                }}
              >
                {suggestion.display_name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
