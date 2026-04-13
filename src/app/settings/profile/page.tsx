"use client";

import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// ── Shared helpers ────────────────────────────────────────────────────────────

function fieldCls(disabled?: boolean) {
  return `w-full rounded-lg bg-surface-low border border-surface-variant px-3 py-2 text-sm text-on-surface placeholder-secondary/40 transition focus:outline-none focus:ring-1 focus:ring-primary${disabled ? " opacity-50 cursor-not-allowed" : ""}`;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-variant bg-surface shadow-card p-6">
      {children}
    </div>
  );
}

function ReadField({ label, value, pending }: { label: string; value?: string | null; pending?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-on-surface">{value || "—"}</span>
        {pending && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-2xs font-medium text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

// ── Timezone data ─────────────────────────────────────────────────────────────

type TzEntry = { label: string; value: string };
type TzGroup = { group: string; zones: TzEntry[] };

const TIMEZONE_GROUPS: TzGroup[] = [
  { group: "US/CANADA", zones: [
    { label: "Pacific Time - US & Canada", value: "America/Los_Angeles" },
    { label: "Mountain Time - US & Canada", value: "America/Denver" },
    { label: "Central Time - US & Canada",  value: "America/Chicago" },
    { label: "Eastern Time - US & Canada",  value: "America/New_York" },
    { label: "Alaska Time",                 value: "America/Anchorage" },
    { label: "Hawaii Time",                 value: "Pacific/Honolulu" },
    { label: "Atlantic Time - Canada",      value: "America/Halifax" },
    { label: "Newfoundland Time",           value: "America/St_Johns" },
  ]},
  { group: "LATIN AMERICA", zones: [
    { label: "Mexico City",                          value: "America/Mexico_City" },
    { label: "Bogota / Lima / Quito",                value: "America/Lima" },
    { label: "Caracas",                              value: "America/Caracas" },
    { label: "Santiago",                             value: "America/Santiago" },
    { label: "Buenos Aires",                         value: "America/Argentina/Buenos_Aires" },
    { label: "São Paulo / Brasilia",                 value: "America/Sao_Paulo" },
  ]},
  { group: "EUROPE", zones: [
    { label: "London / Dublin / Lisbon",             value: "Europe/London" },
    { label: "Madrid / Paris / Amsterdam / Berlin",  value: "Europe/Paris" },
    { label: "Rome / Stockholm / Oslo",              value: "Europe/Rome" },
    { label: "Athens / Helsinki / Bucharest",        value: "Europe/Helsinki" },
    { label: "Istanbul",                             value: "Europe/Istanbul" },
    { label: "Moscow / St. Petersburg",              value: "Europe/Moscow" },
  ]},
  { group: "AFRICA", zones: [
    { label: "Casablanca / Monrovia",                value: "Africa/Casablanca" },
    { label: "Cairo / Johannesburg / Harare",        value: "Africa/Cairo" },
    { label: "Nairobi",                              value: "Africa/Nairobi" },
  ]},
  { group: "MIDDLE EAST", zones: [
    { label: "Kuwait / Riyadh",                      value: "Asia/Riyadh" },
    { label: "Dubai / Abu Dhabi / Muscat",           value: "Asia/Dubai" },
    { label: "Tel Aviv / Jerusalem",                 value: "Asia/Jerusalem" },
  ]},
  { group: "ASIA", zones: [
    { label: "Karachi / Tashkent",                   value: "Asia/Karachi" },
    { label: "Kolkata / Chennai / Mumbai",           value: "Asia/Kolkata" },
    { label: "Dhaka",                                value: "Asia/Dhaka" },
    { label: "Bangkok / Jakarta / Vietnam",          value: "Asia/Bangkok" },
    { label: "Beijing / Shanghai / Singapore",       value: "Asia/Singapore" },
    { label: "Seoul",                                value: "Asia/Seoul" },
    { label: "Tokyo / Osaka / Sapporo",              value: "Asia/Tokyo" },
  ]},
  { group: "AUSTRALIA / PACIFIC", zones: [
    { label: "Perth",                                value: "Australia/Perth" },
    { label: "Adelaide",                             value: "Australia/Adelaide" },
    { label: "Darwin",                               value: "Australia/Darwin" },
    { label: "Brisbane",                             value: "Australia/Brisbane" },
    { label: "Sydney / Melbourne / Canberra",        value: "Australia/Sydney" },
    { label: "Auckland / Wellington",                value: "Pacific/Auckland" },
    { label: "Fiji / Marshall Islands",              value: "Pacific/Fiji" },
  ]},
];

const ALL_ZONES: TzEntry[] = TIMEZONE_GROUPS.flatMap((g) => g.zones);
function findLabel(v: string) { return ALL_ZONES.find((z) => z.value === v)?.label ?? v.replace(/_/g, " "); }
function fmtTime(tz: string, now: Date) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })
      .format(now).toLowerCase().replace(/\s/g, "");
  } catch { return ""; }
}

function TimezoneSelector({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);
  const selectedRef  = useRef<HTMLButtonElement>(null);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (!containerRef.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  useEffect(() => {
    if (open) { setSearch(""); setTimeout(() => { searchRef.current?.focus(); selectedRef.current?.scrollIntoView({ block: "nearest" }); }, 30); }
  }, [open]);

  const q = search.toLowerCase();
  const filtered = q
    ? TIMEZONE_GROUPS.map((g) => ({ ...g, zones: g.zones.filter((z) => z.label.toLowerCase().includes(q) || z.value.toLowerCase().includes(q)) })).filter((g) => g.zones.length > 0)
    : TIMEZONE_GROUPS;

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 w-full rounded-lg bg-surface-low border border-surface-variant px-3 py-2 text-sm text-on-surface hover:bg-surface-variant/40 transition-colors">
        <span>{findLabel(value)}</span>
        <svg className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 rounded-xl border border-surface-variant bg-surface shadow-xl overflow-hidden">
          <div className="p-2.5 border-b border-surface-variant">
            <input ref={searchRef} type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm bg-surface-low text-on-surface placeholder-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((g) => (
              <div key={g.group}>
                <div className="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-secondary">{g.group}</div>
                {g.zones.map((z) => {
                  const sel = z.value === value;
                  return (
                    <button key={z.value} ref={sel ? selectedRef : undefined} type="button"
                      onClick={() => { onChange(z.value); setOpen(false); }}
                      className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${sel ? "bg-primary text-white" : "text-on-surface hover:bg-surface-low"}`}>
                      <span>{z.label}</span>
                      <span className={`text-xs tabular-nums ${sel ? "text-white/80" : "text-secondary"}`}>{fmtTime(z.value, now)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && <div className="px-4 py-6 text-center text-sm text-secondary">No results for &ldquo;{search}&rdquo;</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function TimezoneCard() {
  const [timezone, setTimezone] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      try { const r = await fetch("/api/user/profile"); const d = await r.json(); if (d.timezone) { setTimezone(d.timezone); return; } } catch {}
      try { const r = await fetch("https://ipapi.co/timezone/", { signal: AbortSignal.timeout(3000) }); if (r.ok) { const tz = (await r.text()).trim(); if (tz?.includes("/")) { setTimezone(tz); return; } } } catch {}
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    init();
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timezone }) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-on-surface">Time Zone</h2>
          <p className="mt-0.5 text-xs text-secondary">Used for date/time display across the app.</p>
        </div>
        {saved && <span className="text-xs text-primary font-medium">Saved</span>}
      </div>
      {timezone ? (
        <div className="flex items-center gap-3">
          <div className="flex-1"><TimezoneSelector value={timezone} onChange={setTimezone} /></div>
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : <Skeleton className="h-10 w-full" />}
    </Card>
  );
}

// ── Personal Information card ─────────────────────────────────────────────────

function PersonalInfoCard({ initialName, currentEmail, sessionLoading }: {
  initialName: string; currentEmail?: string | null; sessionLoading: boolean;
}) {
  const nameParts = initialName.split(" ");
  const [editing, setEditing]     = useState(false);
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName]   = useState(nameParts.slice(1).join(" ") ?? "");
  const [email, setEmail]         = useState(currentEmail ?? "");
  const [emailPending, setEmailPending] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // reset draft when session changes
  useEffect(() => {
    if (!editing) {
      const parts = initialName.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
      setEmail(currentEmail ?? "");
      setEmailPending(false);
    }
  }, [initialName, currentEmail, editing]);

  function handleCancel() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const emailChanged = email.trim() !== (currentEmail ?? "").trim();

    try {
      const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");

      if (emailChanged) {
        // Email changes require verification — mark as pending, don't persist yet
        setEmailPending(true);
      }

      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const displayEmail = emailPending ? email : (currentEmail ?? "");

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-on-surface">Personal Information</h2>
        <div className="flex items-center gap-3">
          {saved && !editing && <span className="text-xs text-primary font-medium">Saved</span>}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-full border border-surface-variant px-3 py-1.5 text-xs text-secondary hover:border-primary/40 hover:text-primary transition-colors"
            >
              Edit
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" strokeLinejoin="round"/></svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={handleCancel} className="text-xs text-secondary hover:text-on-surface transition-colors px-2 py-1">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-error/10 border border-error/20 px-3 py-2 text-xs text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {sessionLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))
        ) : editing ? (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-secondary">First Name</label>
              <input className={fieldCls()} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-secondary">Last Name</label>
              <input className={fieldCls()} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
            </div>
            {/* Email — editable but pending authorization */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-secondary">Email Address</label>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-2xs font-medium text-amber-600 dark:text-amber-400">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1a1 1 0 011 1v.5A3.5 3.5 0 019.5 6v1.5l1 1.5H1.5L2.5 7.5V6A3.5 3.5 0 015 2.5V2a1 1 0 011-1zm0 10a1.5 1.5 0 01-1.5-1.5h3A1.5 1.5 0 016 11z"/></svg>
                  Requires authorization
                </span>
              </div>
              <input
                className={fieldCls()}
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailPending(false); }}
                placeholder="you@example.com"
                type="email"
              />
              <p className="text-2xs text-secondary/60 mt-0.5">
                A verification link will be sent to the new address before the change takes effect.
              </p>
            </div>
          </>
        ) : (
          <>
            <ReadField label="First Name" value={nameParts[0]} />
            <ReadField label="Last Name"  value={nameParts.slice(1).join(" ") || undefined} />
            <div className="sm:col-span-2">
              <ReadField label="Email Address" value={displayEmail} pending={emailPending} />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const sessionLoading = status === "loading";
  const user = session?.user;

  const nameParts = user?.name?.split(" ") ?? [];

  return (
    <div className="flex flex-col gap-4">

      {/* Header card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-surface-variant shrink-0">
            {sessionLoading ? null : user?.image ? (
              <Image src={user.image} alt="avatar" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-secondary">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="space-y-1">
            {sessionLoading ? (
              <><Skeleton className="h-4 w-36" /><Skeleton className="h-3.5 w-48" /></>
            ) : (
              <>
                <p className="text-base font-semibold text-on-surface">{user?.name ?? "—"}</p>
                <p className="text-sm text-secondary">{user?.email ?? "—"}</p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <PersonalInfoCard
        initialName={user?.name ?? ""}
        currentEmail={user?.email}
        sessionLoading={sessionLoading}
      />

      {/* Time Zone */}
      <TimezoneCard />

      {/* Security */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-on-surface">Security</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <ReadField label="Password" value="••••••••" />
          <ReadField label="Two-Factor Auth" value="Not enabled" />
        </div>
      </Card>

      {/* Danger zone */}
      <Card>
        <h2 className="text-sm font-semibold text-on-surface mb-1">Danger Zone</h2>
        <p className="text-xs text-secondary mb-4">Permanently delete your account and all associated data.</p>
        <button className="rounded-lg border border-error/30 px-3 py-1.5 text-sm text-error hover:bg-error/8 transition-colors">
          Delete Account
        </button>
      </Card>
    </div>
  );
}
