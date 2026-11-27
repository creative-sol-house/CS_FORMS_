// lib/auditDiff.ts

// Fields the user can actually edit on the form
export const EDITABLE_FIELDS: Record<string, string> = {
  // Core
  fullName: "Name",
  email: "Email",
  phone: "Phone",
  clientType: "Client Type",
  serviceCategory: "Service Category",
  companyName: "Company",
  designation: "Designation",
  jobTitle: "Job Title",
  location: "Location",
  country: "Country",
  clientRegion: "Client Region",
  isInternationalClient: "International Client",
  companyWebsite: "Website",
  socialLinks: "Social Links",
  existingWebsite: "Existing Website",

  // Project
  requirementType: "Requirement Type",
  projectTitle: "Project Title",
  projectGoals: "Project Goals",
  targetAudience: "Target Audience",
  additionalNotes: "Additional Notes",
  timeline: "Timeline",
  launchDate: "Launch Date",
  preferredContactMethod: "Preferred Contact Method",
  preferredContactTime: "Preferred Contact Time",
  consultantName: "Consultant",
  source: "Source",

  // Status / assignment / scheduling (handled specially, but listed for safety)
  status: "Status",
  assignedTo: "Assigned To",
  communicationMode: "Communication Mode",
  onsiteAddress: "Onsite Address",
  leadCreatedAt: "Lead Created Date",

  // Notes handled separately
  notes: "Notes",
};

// Fields never to diff (system / internal)
const IGNORED_FIELDS = new Set([
  "_id", "__v", "createdAt", "updatedAt",
  "auditLogs", "messages", "attachments",
  "createdBy", "createdById", "consultantId",
  "submissionLocation", "followUps",
  "newMessage", "markRead",
]);

const MAX_VALUE_LEN = 60;

function truncate(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    // socialLinks: [{name, url}]
    if (typeof v[0] === "object" && v[0]?.name) {
      return v.map((x: any) => x.name).join(", ").slice(0, MAX_VALUE_LEN);
    }
    return v.join(", ").slice(0, MAX_VALUE_LEN);
  }
  if (typeof v === "object") return JSON.stringify(v).slice(0, MAX_VALUE_LEN);
  const s = String(v);
  return s.length > MAX_VALUE_LEN ? s.slice(0, MAX_VALUE_LEN) + "…" : s;
}

function normalize(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v.trim();
  return v as any;
}

function sameValue(a: unknown, b: unknown): boolean {
  // Treat undefined / null / "" as equal
  const na = normalize(a);
  const nb = normalize(b);
  if (na === "" && nb === "") return true;
  if (a instanceof Date || b instanceof Date) {
    const ta = a ? new Date(a as any).getTime() : 0;
    const tb = b ? new Date(b as any).getTime() : 0;
    return ta === tb;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return na === nb;
}

/**
 * Returns a list of human-readable change strings, e.g.:
 *   ["Name: John → Johnny", "Phone: 0300… → 0321…"]
 */
export function buildFieldDiffs(
  before: Record<string, any>,
  updates: Record<string, any>
): string[] {
  const diffs: string[] = [];

  for (const key of Object.keys(updates)) {
    if (IGNORED_FIELDS.has(key)) continue;

    const label = EDITABLE_FIELDS[key];
    if (!label) continue; // unknown field → skip (prevents noise)

    const prev = before[key];
    const next = updates[key];

    if (sameValue(prev, next)) continue;

    diffs.push(`${label}: ${truncate(prev)} → ${truncate(next)}`);
  }

  return diffs;
}

export function diffAttachments(
  oldAtt: any[] = [],
  newAtt: any[] = []
): string | null {
  // Ignore entries with no publicId (partial/broken uploads, drafts)
  const clean = (arr: any[]) =>
    arr.filter((a) => a && typeof a.publicId === "string" && a.publicId.length > 0);

  const oldList = clean(oldAtt);
  const newList = clean(newAtt);

  // If lengths AND ids match → nothing changed, no log
  if (oldList.length === newList.length) {
    const oldSet = new Set(oldList.map((a) => a.publicId));
    const allMatch = newList.every((a) => oldSet.has(a.publicId));
    if (allMatch) return null;
  }

  const oldIds = new Set(oldList.map((a) => a.publicId));
  const newIds = new Set(newList.map((a) => a.publicId));

  const added = [...newIds].filter((id) => !oldIds.has(id));
  const removed = [...oldIds].filter((id) => !newIds.has(id));

  if (added.length === 0 && removed.length === 0) return null;

  const parts: string[] = [];
  if (added.length) parts.push(`+${added.length} added`);
  if (removed.length) parts.push(`-${removed.length} removed`);
  return `Files: ${parts.join(", ")}`;
}