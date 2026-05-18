export type GeocodedPlace = {
  display_name: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    country?: string;
  };
};

function parsePlace(result: NominatimResult): GeocodedPlace {
  const city =
    result.address?.city ||
    result.address?.town ||
    result.address?.village ||
    result.address?.suburb ||
    result.address?.state ||
    "";

  return {
    display_name: result.display_name,
    lat: Number.parseFloat(result.lat),
    lng: Number.parseFloat(result.lon),
    city,
    country: result.address?.country || "",
  };
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const response = await fetch(
    `/api/geocode?q=${encodeURIComponent(trimmed)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }

  const data = (await response.json()) as NominatimResult[];
  if (!Array.isArray(data)) return [];

  return data.map(parsePlace);
}
