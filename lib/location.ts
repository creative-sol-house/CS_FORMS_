import { SubmissionLocation } from "./types";

export async function resolveLocation(req: Request): Promise<SubmissionLocation> {
  const headers = req.headers;

  // 1. Try Vercel-provided geo headers first (fast, no extra API call)
  const vCity = headers.get("x-vercel-ip-city");
  const vRegion = headers.get("x-vercel-ip-country-region");
  const vCountry = headers.get("x-vercel-ip-country");
  const vLat = headers.get("x-vercel-ip-latitude");
  const vLon = headers.get("x-vercel-ip-longitude");

  // 2. Get the IP (works behind proxies)
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headers.get("x-real-ip") || "";

  const base: SubmissionLocation = {
    ip,
    userAgent: headers.get("user-agent") || "",
    referer: headers.get("referer") || "",
  };

  if (vCity || vCountry) {
    return {
      ...base,
      city: vCity ? decodeURIComponent(vCity) : "",
      region: vRegion ? decodeURIComponent(vRegion) : "",
      country: vCountry ? decodeURIComponent(vCountry) : "",
      latitude: vLat || "",
      longitude: vLon || "",
    };
  }

  // 3. Fallback: ip-api.com (free, no key, 45 req/min limit)
  //    Skipped for local/private IPs.
  const isPrivate =
    !ip ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);

  if (isPrivate) {
    return { ...base, city: "Local / Private IP" };
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (data.status === "success") {
      return {
        ...base,
        city: data.city || "",
        region: data.regionName || "",
        country: data.country || "",
        latitude: data.lat != null ? String(data.lat) : "",
        longitude: data.lon != null ? String(data.lon) : "",
      };
    }
  } catch {
    // ignore — location is best-effort
  }

  return base;
}