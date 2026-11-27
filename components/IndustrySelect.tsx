"use client";
import { useEffect, useRef, useState } from "react";

interface Suggestion {
  name: string;
  count: number;
  exact: boolean;
}

interface Props {
  value: string;
  onChange: (v: string, force?: boolean) => void;
  disabled?: boolean;
}

const DEFAULT_INDUSTRIES = [
  "Textile & Garments",
  "Pharmaceuticals",
  "Agriculture",
  "Food",
  "Healthcare and Medical",
  "Education and Training",
  "Banking & Financial Services",
  "Retail & E-commerce",
  "Real Estate & Construction",
  "Hospitality & Hotels",
  "Cosmetics & Beauty",
  "Automotive & Engineering",
  "Energy & Power",
  "Telecommunications",
  "Travel & Tourism",
  "Professional Services",
];

export default function IndustrySelect({ value, onChange, disabled }: Props) {
  const [input, setInput] = useState(value || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [warn, setWarn] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingForce, setPendingForce] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ Tracks if the current value was explicitly picked or confirmed
  const [confirmedValue, setConfirmedValue] = useState(value || "");

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    setInput(value || ""); 
    setConfirmedValue(value || "");
  }, [value]);

  // Fetch suggestions
  useEffect(() => {
    const q = input.trim();

    if (!q) {
      if (!open) { setSuggestions([]); setLoading(false); return; }
      
      setSuggestions(
        DEFAULT_INDUSTRIES.map((name) => ({ name, count: 0, exact: false }))
      );
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/industries?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.suggestions || []);
        }
      } catch {}
      finally { setLoading(false); }
    }, 250);

    return () => clearTimeout(t);
  }, [input, open]);

  // Click outside → close
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPendingForce(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      if (wrapRef.current && e.target instanceof Node && wrapRef.current.contains(e.target)) return;
      setOpen(false);
      setPendingForce(null);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  const saveGlobal = async (rawName: string, force = false): Promise<boolean> => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/industries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rawName, force }),
      });
      const json = await res.json();

      if (!json.success && json.needsConfirmation) {
        setPendingForce(rawName);
        setWarn(json.similar || []);
        setSuggestions([]);
        setOpen(false);
        return false;
      }

      if (!json.success) {
        setError(json.error || "Failed to save industry");
        return false;
      }

      const finalName = json.industry?.name || rawName;
      setPendingForce(null);
      setWarn([]);
      setInput(finalName);
      setConfirmedValue(finalName); // ✅ Mark as confirmed
      onChange(finalName, true);
      setSuggestions([]);
      setOpen(false);
      return true;
    } catch (e: any) {
      setError(e.message || "Failed to save industry");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const pickSuggestion = (s: Suggestion) => {
    setInput(s.name);
    setConfirmedValue(s.name); // ✅ Mark as confirmed when clicked from dropdown
    onChange(s.name, true);
    setOpen(false);
    setPendingForce(null);
    setWarn([]);
    setSuggestions([]);
  };

  const commit = async (force = false) => {
    const trimmed = input.trim();
    if (!trimmed) { onChange(""); return; }

    const exact = suggestions.find((s) => s.exact || s.name.toLowerCase() === trimmed.toLowerCase());
    if (exact && !force) {
      pickSuggestion(exact);
      return;
    }

    await saveGlobal(trimmed, force);
  };

  const showDropdown =
    open && !pendingForce && !saving && (suggestions.length > 0 || loading);

  // ✅ Logic for Add button: Only show if text exists, it's not confirmed, and it doesn't perfectly match a suggestion.
  const trimmedInput = input.trim();
  const isSelectedFromDropdown = suggestions.some(
    (s) => s.name.toLowerCase() === trimmedInput.toLowerCase()
  );
  const showAddButton = !saving && trimmedInput.length > 0 && !isSelectedFromDropdown && trimmedInput !== confirmedValue;

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-sm font-medium mb-1">Industry</label>

      <div className="flex gap-2">
        <input
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:bg-stone-100"
          value={input}
          disabled={disabled || saving}
          placeholder="e.g. Electricity & Power"
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setError("");
            setPendingForce(null);
            setWarn([]); 
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { 
              e.preventDefault(); 
              if (showAddButton) commit(); 
            }
            else if (e.key === "Escape") { setOpen(false); setPendingForce(null); }
          }}
        />
        
        {/* ✅ Only shows if they typed something totally new */}
        {showAddButton && (
          <button
            type="button"
            onClick={() => commit()}
            disabled={disabled || saving}
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {saving ? "Saving…" : "Add"}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          data-industry-dropdown
          className="absolute z-30 mt-1 bg-white border border-stone-200 rounded-lg w-full max-h-56 overflow-auto shadow-lg"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-stone-400">Loading…</li>
          )}
          {suggestions.map((s) => (
            <li
              key={s.name}
              className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
            >
              <span className="text-stone-800">
                {s.name}
                {s.exact && (
                  <span className="ml-2 text-[10px] font-bold uppercase text-emerald-600">existing</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Warning Banner */}
      {pendingForce && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-semibold text-amber-900 mb-1">
            Similar industry already exists{pendingForce ? `: ${warn.join(", ")}` : ""}
          </p>
          <p className="text-amber-800 text-xs mb-2">
            You typed "<strong>{pendingForce}</strong>". Add it anyway as a new industry?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { const n = pendingForce!; setPendingForce(null); saveGlobal(n, true); }}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
            >
              Add anyway
            </button>
            <button
              type="button"
              onClick={() => { setPendingForce(null); setWarn([]); }}
              className="px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 rounded-lg"
            >
              Cancel
            </button>
            {warn.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const pick = warn[0];
                  pickSuggestion({ name: pick, count: 0, exact: false });
                }}
                className="ml-auto px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg"
              >
                Use "{warn[0]}"
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}