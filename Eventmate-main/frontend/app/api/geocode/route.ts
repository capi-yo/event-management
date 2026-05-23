import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";

/**
 * Fetch results from OpenStreetMap Nominatim API
 */
async function fetchFromNominatim(query: string) {
  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("q", query);

  // Set viewbox to prioritize Ethiopia / East Africa region
  // Left: 32.9, Top: 15.0, Right: 48.0, Bottom: 3.0
  url.searchParams.set("viewbox", "32.9,15.0,48.0,3.0");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Eventmate/1.0 (location picker; contact@eventmate.local)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`);
  }

  return response.json();
}

/**
 * Generates robust fallback search queries for misspelled or over-specified queries
 */
function getAlternativeQueries(query: string): string[] {
  const list: string[] = [];
  const current = query.trim();

  // 1. Handle common compound names like "Medhanealem" / "Medhanialem"
  if (/medhanealem/i.test(current)) {
    list.push(current.replace(/medhanealem/i, "Medhane Alem"));
  }
  if (/medhanialem/i.test(current)) {
    list.push(current.replace(/medhanialem/i, "Medhane Alem"));
  }

  // 2. Try swapping common city spelling "Addis Ababa" with "Addis Abeba"
  if (/addis ababa/i.test(current)) {
    list.push(current.replace(/addis ababa/i, "Addis Abeba"));
  }

  // 3. Handle over-specified search queries (e.g. "Addis Ababa Bole Medhanealem")
  // Nominatim often fails when the city name and subcity are placed adjacent to specific landmarks.
  // We strip the generic city name to focus strictly on the landmark.
  if (/addis ababa\s+/i.test(current)) {
    const cleaned = current.replace(/addis ababa\s+/i, "");
    if (cleaned.length >= 3) {
      list.push(cleaned);
      if (/medhanealem/i.test(cleaned)) {
        list.push(cleaned.replace(/medhanealem/i, "Medhane Alem"));
      }
    }
  }

  // 4. Try splitting by common separators and using the most specific part
  if (current.includes(",")) {
    const parts = current.split(",");
    if (parts[0].trim().length >= 3) {
      list.push(parts[0].trim());
    }
  }

  // 5. Try a simpler fallback by taking the last two/three words of the query
  const words = current.split(/\s+/);
  if (words.length > 2) {
    const lastTwo = words.slice(-2).join(" ");
    const lastThree = words.slice(-3).join(" ");
    list.push(lastTwo);
    list.push(lastThree);
  }

  return [...new Set(list)];
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json([]);
  }

  try {
    // 1. Try the primary query
    let data = await fetchFromNominatim(q);

    // 2. Fallback Chain: If no results found, try alternative query representations
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`[Geocoding] No results found for primary query "${q}". Initiating fallback chain...`);
      const alternatives = getAlternativeQueries(q);

      for (const alt of alternatives) {
        try {
          console.log(`[Geocoding] Trying fallback: "${alt}"`);
          const fallbackData = await fetchFromNominatim(alt);
          
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            data = fallbackData;
            console.log(`[Geocoding] Success! Found ${fallbackData.length} results using fallback query: "${alt}"`);
            break;
          }
        } catch (fallbackError) {
          console.warn(`[Geocoding] Fallback query failed for "${alt}":`, fallbackError);
        }
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Geocoding] Request failed completely:", error);
    return NextResponse.json(
      { error: "Geocoding request failed" },
      { status: 502 },
    );
  }
}
