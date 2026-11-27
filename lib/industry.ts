// lib/industry.ts
import { connectDB } from "@/lib/mongodb";
import Inquiry from "@/lib/Inquiry";
import type { IndustrySuggestion } from "@/lib/types";

/** Canonical form used for comparisons (does NOT change what the user typed). */
export function normalizeIndustry(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")   // strip punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance — used for "close match" warnings. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const prev = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    let cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = cur[j];
  }
  return prev[n];
}

/** True if two industry strings are "the same concept" (typo / singular / substring). */
export function isSimilarIndustry(a: string, b: string): boolean {
  const na = normalizeIndustry(a);
  const nb = normalizeIndustry(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  // singular/plural tolerance
  const stripS = (s: string) => s.replace(/s$/, "");
  if (stripS(na) === stripS(nb)) return true;

  // token containment: "power" vs "powers" vs "electricity and power"
  const ta = na.split(" "), tb = nb.split(" ");
  const aInB = ta.every((t) => tb.includes(t) || stripS(t) === stripS("x"));
  const bInA = tb.every((t) => ta.includes(t) || stripS(t) === stripS("x"));
  if (ta.length >= 1 && tb.length >= 1 && (aInB || bInA)) return true;

  // edit-distance tolerance for typos
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return dist / maxLen <= 0.2; // ≤ 20% different
}

/**
 * Fetch industry suggestions for an autocomplete input.
 * Returns exact matches first, then close matches (flagged), then popular others.
 */
export async function getIndustrySuggestions(
  query: string,
  limit = 15
): Promise<IndustrySuggestion[]> {
  await connectDB();

  const q = normalizeIndustry(query);

  // Aggregate distinct industries + counts from existing leads
  const agg = await Inquiry.aggregate<{ _id: string; count: number }>([
    { $match: { industry: { $exists: true, $ne: "" } } },
    { $group: { _id: "$industry", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 300 },
  ]);

  const all = agg.map((r) => ({ name: r._id, count: r.count }));

  if (!q) {
    return all.slice(0, limit).map((x) => ({ ...x, exact: false }));
  }

  const exact: IndustrySuggestion[] = [];
  const similar: IndustrySuggestion[] = [];
  const rest: IndustrySuggestion[] = [];

  for (const item of all) {
    const n = normalizeIndustry(item.name);
    if (n === q) exact.push({ ...item, exact: true });
    else if (isSimilarIndustry(n, q)) similar.push({ ...item, exact: false });
    else if (n.includes(q) || q.includes(n)) similar.push({ ...item, exact: false });
    else rest.push({ ...item, exact: false });
  }

  return [...exact, ...similar, ...rest].slice(0, limit);
}

/** Does an industry already exist (exact or similar)? Used server-side on save. */
export async function findIndustryConflict(
  value: string,
  opts: { allowExact?: boolean } = {}
): Promise<{ exact: string | null; similar: string[] }> {
  await connectDB();
  const q = normalizeIndustry(value);
  const agg = await Inquiry.aggregate<{ _id: string }>([
    { $match: { industry: { $exists: true, $ne: "" } } },
    { $group: { _id: "$industry" } },
    { $limit: 500 },
  ]);
  const names = agg.map((r) => r._id);

  const exactMatch = names.find((n) => normalizeIndustry(n) === q) || null;
  const similar = names.filter(
    (n) => normalizeIndustry(n) !== q && isSimilarIndustry(n, q)
  );
  return { exact: opts.allowExact ? null : exactMatch, similar };
}