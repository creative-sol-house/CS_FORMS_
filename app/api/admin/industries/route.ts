import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { verifySession } from "@/lib/auth";
import GlobalIndustry from "@/lib/GlobalIndustry";
import Inquiry from "@/lib/Inquiry";
import { normalizeIndustry, isSimilarIndustry } from "@/lib/industry";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

// ─────────────────────────────────────────────────────────────
// GET — ?q=<query>   → suggestions (exact first, similar flagged)
//       ?q=          → all industries (popularity-sorted)
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    // 1) Master list from GlobalIndustry
    const masters = await GlobalIndustry.find({})
      .sort({ usageCount: -1, name: 1 })
      .limit(500)
      .lean();

    // 2) Usage counts from leads (so legacy/derived names still surface)
    const agg = await Inquiry.aggregate<{ _id: string; count: number }>([
      { $match: { industry: { $exists: true, $ne: "" } } },
      { $group: { _id: "$industry", count: { $sum: 1 } } },
    ]);
    const leadCounts = new Map(agg.map((r) => [r._id, r.count]));

    // Merge — master list + lead-derived, deduped by normalized name
    type Item = { name: string; normalized: string; count: number };
    const merged = new Map<string, Item>();

    for (const m of masters) {
      merged.set(m.normalized, {
        name: m.name,
        normalized: m.normalized,
        count: leadCounts.get(m.name) || m.usageCount || 0,
      });
    }
    for (const [name, count] of leadCounts) {
      const norm = normalizeIndustry(name);
      if (!merged.has(norm)) {
        merged.set(norm, { name, normalized: norm, count });
      } else {
        const existing = merged.get(norm)!;
        if (count > existing.count) existing.count = count;
      }
    }

    let items = Array.from(merged.values());

    if (!q) {
      // no query — just return popular
      items.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      return NextResponse.json({
        success: true,
        suggestions: items.slice(0, 50).map((i) => ({ name: i.name, count: i.count, exact: false })),
      });
    }

    const nq = normalizeIndustry(q);
    const exact: typeof items = [];
    const similar: typeof items = [];

    for (const i of items) {
      if (i.normalized === nq) exact.push(i);
      else if (isSimilarIndustry(i.name, q)) similar.push(i);
      else if (i.normalized.includes(nq) || nq.includes(i.normalized)) similar.push(i);
      // NOTE: no `rest` bucket — unrelated items are NOT returned when searching
    }

    const ordered = [...exact, ...similar].slice(0, 20);

    return NextResponse.json({
      success: true,
      suggestions: ordered.map((i) => ({
        name: i.name,
        count: i.count,
        exact: i.normalized === nq,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// POST — create a global industry. Returns 409 if similar exists unless force=true.
//   body: { name: string, force?: boolean }
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session)
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const body = await req.json();
    const raw = (body.name || "").toString().trim();
    const force = !!body.force;

    if (!raw)
      return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
    if (raw.length > 120)
      return NextResponse.json({ success: false, error: "Name too long (max 120)" }, { status: 400 });

    const normalized = normalizeIndustry(raw);

    // Exact match? Return it silently (idempotent)
    const existingExact = await GlobalIndustry.findOne({ normalized }).lean();
    if (existingExact) {
      return NextResponse.json({
        success: true,
        industry: { name: existingExact.name, normalized: existingExact.normalized },
        existed: true,
      });
    }

    // Similar match? Warn unless force
    if (!force) {
      const all = await GlobalIndustry.find({}).limit(500).lean();
      const similar = all
        .filter((g) => isSimilarIndustry(g.name, raw))
        .map((g) => g.name);

      // also check lead-derived
      const agg = await Inquiry.aggregate<{ _id: string }>([
        { $match: { industry: { $exists: true, $ne: "" } } },
        { $group: { _id: "$industry" } },
        { $limit: 500 },
      ]);
      for (const r of agg) {
        if (isSimilarIndustry(r._id, raw) && !similar.includes(r._id)) {
          similar.push(r._id);
        }
      }

      if (similar.length > 0) {
        return NextResponse.json(
          {
            success: false,
            needsConfirmation: true,
            error: `Similar industries already exist: ${similar.slice(0, 3).join(", ")}. Add anyway?`,
            similar,
          },
          { status: 409 }
        );
      }
    }

    const created = await GlobalIndustry.create({
      name: raw,
      normalized,
      usageCount: 0,
      createdBy: session.name,
      createdById: session.userId,
    });

    return NextResponse.json({
      success: true,
      industry: { name: created.name, normalized: created.normalized },
    });
  } catch (err: any) {
    // handle unique-violation race
    if (err?.code === 11000) {
      const dup = await GlobalIndustry.findOne({ normalized: normalizeIndustry((await req.json().catch(() => ({}))).name || "") }).lean();
      return NextResponse.json({ success: true, industry: dup ? { name: dup.name } : null, existed: true });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}