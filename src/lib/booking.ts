export type MeetingType = "video" | "phone" | "onsite";

export type Availability = {
  weekdays: number[]; // 0=So .. 6=Sa
  start: string; // "09:00"
  end: string; // "17:00"
  slot: number; // minutes
  lead_hours: number;
  days_ahead: number;
};

export type BookingLink = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  meeting_type: MeetingType;
  duration_minutes: number;
  location: string | null;
  info: string | null;
  color: string;
  availability: Availability;
  mode?: "recurring" | "onetime";
  fixed_slots?: string[]; // ISO datetimes for one-off appointments
  is_active: boolean;
  created_at?: string;
};

export type Booking = {
  id: string;
  link_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  starts_at: string;
  duration_minutes: number;
  meeting_type: MeetingType;
  room_url: string | null;
  status: string;
  created_at?: string;
};

export const DEFAULT_AVAILABILITY: Availability = {
  weekdays: [1, 2, 3, 4, 5],
  start: "09:00",
  end: "17:00",
  slot: 30,
  lead_hours: 12,
  days_ahead: 21,
};

export const MEETING_TYPES: { id: MeetingType; label: string; hint: string }[] = [
  { id: "video", label: "Online Video-Call", hint: "Automatischer Meetingraum (Link wird erzeugt)" },
  { id: "phone", label: "Telefon-Call", hint: "Kunde hinterlässt seine Telefonnummer" },
  { id: "onsite", label: "Vor Ort / Persönlich", hint: "Adresse aus dem Feld „Ort“" },
];

export const WEEKDAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function randomRoomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export function buildRoomUrl(slug: string) {
  return `https://meet.jit.si/kse-${slug}-${randomRoomSuffix()}`;
}

export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** All bookable days (Date at 00:00 local) within the configured window. */
export function bookableDays(av: Availability, from = new Date()): Date[] {
  const days: Date[] = [];
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i <= (av.days_ahead ?? 21); i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    if ((av.weekdays ?? []).includes(d.getDay())) days.push(d);
  }
  return days;
}

/** Slot start times for a given day, excluding taken slots and lead time. */
export function slotsForDay(
  day: Date,
  av: Availability,
  durationMinutes: number,
  taken: string[] = [],
  now = new Date(),
): Date[] {
  const out: Date[] = [];
  const startM = toMinutes(av.start || "09:00");
  const endM = toMinutes(av.end || "17:00");
  const step = av.slot || 30;
  const leadMs = (av.lead_hours ?? 0) * 3600_000;
  const takenSet = new Set(taken);
  for (let m = startM; m + durationMinutes <= endM; m += step) {
    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60, 0, 0);
    if (d.getTime() < now.getTime() + leadMs) continue;
    if (takenSet.has(d.toISOString())) continue;
    out.push(d);
  }
  return out;
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

/** Distinct days (00:00 local) contained in a list of ISO slot strings. */
export function daysFromSlots(slots: string[]): Date[] {
  const map = new Map<string, Date>();
  for (const iso of slots) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) continue;
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    map.set(dateKey(day), day);
  }
  return [...map.values()].sort((a, b) => a.getTime() - b.getTime());
}

/** Fixed slots for a given day, excluding taken slots and past times. */
export function fixedSlotsForDay(day: Date, slots: string[], taken: string[] = [], now = new Date()): Date[] {
  const takenSet = new Set(taken);
  return slots
    .map((s) => new Date(s))
    .filter((d) => !isNaN(d.getTime()))
    .filter((d) => dateKey(d) === dateKey(day))
    .filter((d) => d.getTime() > now.getTime())
    .filter((d) => !takenSet.has(d.toISOString()))
    .sort((a, b) => a.getTime() - b.getTime());
}

/** Build candidate times (Date objects) for a day between two "HH:MM" bounds. */
export function timeGrid(day: Date, start: string, end: string, step: number): Date[] {
  const out: Date[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startM = sh * 60 + (sm || 0);
  const endM = eh * 60 + (em || 0);
  for (let m = startM; m <= endM - 1; m += Math.max(5, step)) {
    out.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60, 0, 0));
  }
  return out;
}

export function formatDateLong(d: Date) {
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export function icsFor(b: {
  title: string;
  starts_at: string;
  duration_minutes: number;
  description?: string;
  location?: string;
}) {
  const dt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const start = new Date(b.starts_at);
  const end = new Date(start.getTime() + b.duration_minutes * 60000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KSE GROUP//Termine//DE",
    "BEGIN:VEVENT",
    `UID:${start.getTime()}@ksegroup.eu`,
    `DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(start)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${b.title}`,
    `DESCRIPTION:${(b.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${b.location || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}