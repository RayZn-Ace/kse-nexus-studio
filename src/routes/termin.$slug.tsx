import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Phone, MapPin, Clock, CalendarDays, ArrowLeft, ArrowRight, Loader2,
  CheckCircle2, Copy, Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_AVAILABILITY, bookableDays, slotsForDay, buildRoomUrl, formatDateLong,
  formatTime, icsFor, type Availability, type BookingLink, type MeetingType,
} from "@/lib/booking";

export const Route = createFileRoute("/termin/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Termin buchen — KSE GROUP` },
      { name: "description", content: "Buche deinen Termin mit KSE GROUP — Video-Call, Telefon oder vor Ort." },
      { property: "og:title", content: "Termin buchen — KSE GROUP" },
      { property: "og:description", content: `Wähle deinen Wunschtermin (${params.slug}).` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BookingPage,
});

const db = supabase as any;
const TYPE_ICON: Record<MeetingType, typeof Video> = { video: Video, phone: Phone, onsite: MapPin };
const TYPE_LABEL: Record<MeetingType, string> = {
  video: "Online Video-Call",
  phone: "Telefon-Call",
  onsite: "Vor Ort",
};

function BookingPage() {
  const { slug } = Route.useParams();
  const [link, setLink] = useState<BookingLink | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<Date | null>(null);
  const [slot, setSlot] = useState<Date | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ starts_at: string; room_url: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await db.from("booking_links").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (data) {
        setLink(data as BookingLink);
        const { data: bs } = await db
          .from("bookings").select("starts_at").eq("link_id", data.id).neq("status", "cancelled");
        setTaken(((bs ?? []) as { starts_at: string }[]).map((b) => new Date(b.starts_at).toISOString()));
      }
      setLoading(false);
    })();
  }, [slug]);

  const av: Availability = useMemo(
    () => ({ ...DEFAULT_AVAILABILITY, ...(link?.availability || {}) }),
    [link],
  );
  const days = useMemo(() => (link ? bookableDays(av) : []), [link, av]);
  const slots = useMemo(
    () => (link && day ? slotsForDay(day, av, link.duration_minutes, taken) : []),
    [link, day, av, taken],
  );

  useEffect(() => {
    if (!day && days.length) setDay(days[0]);
  }, [days, day]);

  const Icon = link ? TYPE_ICON[link.meeting_type] ?? Video : Video;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link || !slot) return;
    if (!form.name.trim() || !form.email.trim()) return toast.error("Name und E-Mail sind Pflicht.");
    if (link.meeting_type === "phone" && !form.phone.trim())
      return toast.error("Bitte gib eine Telefonnummer an, unter der wir dich erreichen.");
    setSubmitting(true);
    const room_url = link.meeting_type === "video" ? buildRoomUrl(link.slug) : null;
    const { error } = await db.from("bookings").insert({
      link_id: link.id,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      message: form.message.trim() || null,
      starts_at: slot.toISOString(),
      duration_minutes: link.duration_minutes,
      meeting_type: link.meeting_type,
      room_url,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setDone({ starts_at: slot.toISOString(), room_url });
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </main>
    );
  }

  if (!link) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">Termin nicht verfügbar</h1>
          <p className="mt-2 text-sm text-muted-foreground">Dieser Terminlink existiert nicht oder ist deaktiviert.</p>
          <Link to="/" className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm text-accent-foreground">Zur Startseite</Link>
        </div>
      </main>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-card/40 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-accent/60 focus:outline-none transition-colors";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 md:py-16">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />

      <div className="mx-auto max-w-5xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> ksegroup.eu
        </Link>

        <div className="glass grid overflow-hidden rounded-3xl md:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside className="border-b border-border/60 p-7 md:border-b-0 md:border-r">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
              <Icon className="h-3 w-3" /> {TYPE_LABEL[link.meeting_type]}
            </div>
            <h1 className="font-display mt-4 text-3xl font-semibold leading-tight">{link.title}</h1>
            {link.description && <p className="mt-3 text-sm text-muted-foreground">{link.description}</p>}

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <Clock className="h-4 w-4 text-accent" /> {link.duration_minutes} Minuten
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <Icon className="h-4 w-4 text-accent" />
                {link.meeting_type === "video" && "Video-Raum wird automatisch erstellt"}
                {link.meeting_type === "phone" && "Wir rufen dich an"}
                {link.meeting_type === "onsite" && (link.location || "Vor Ort")}
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-accent" /> Zeitzone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </li>
            </ul>

            {link.info && (
              <div className="mt-6 rounded-2xl border border-border/60 bg-card/30 p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
                  <Info className="h-3 w-3" /> Infos
                </div>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{link.info}</p>
              </div>
            )}
          </aside>

          {/* Main */}
          <section className="p-7">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-6 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
                  <h2 className="font-display mt-4 text-2xl font-semibold">Termin bestätigt</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDateLong(new Date(done.starts_at))} um {formatTime(new Date(done.starts_at))} Uhr
                  </p>
                  {done.room_url && (
                    <div className="mx-auto mt-5 flex max-w-md items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2">
                      <span className="truncate font-mono text-xs">{done.room_url}</span>
                      <button onClick={() => { navigator.clipboard.writeText(done.room_url!); toast.success("Link kopiert"); }} className="ml-auto text-accent">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {done.room_url && (
                      <a href={done.room_url} target="_blank" rel="noreferrer" className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
                        Raum öffnen
                      </a>
                    )}
                    <button
                      onClick={() => {
                        const ics = icsFor({
                          title: `${link.title} — KSE GROUP`,
                          starts_at: done.starts_at,
                          duration_minutes: link.duration_minutes,
                          description: done.room_url || link.info || "",
                          location: done.room_url || link.location || "",
                        });
                        const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
                        const a = document.createElement("a");
                        a.href = url; a.download = "kse-termin.ics"; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="rounded-full border border-border px-5 py-2.5 text-sm"
                    >
                      Zum Kalender hinzufügen
                    </button>
                  </div>
                </motion.div>
              ) : !slot ? (
                <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="font-display text-xl font-semibold">Wähle deinen Termin</h2>
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {days.map((d) => {
                      const active = day && d.toDateString() === day.toDateString();
                      return (
                        <button
                          key={d.toISOString()}
                          onClick={() => setDay(d)}
                          className={`min-w-[74px] shrink-0 rounded-2xl border px-3 py-2.5 text-center transition-colors ${
                            active ? "border-accent bg-accent/15 text-foreground" : "border-border bg-card/30 text-muted-foreground hover:border-accent/50"
                          }`}
                        >
                          <div className="text-[10px] uppercase tracking-widest">{d.toLocaleDateString("de-DE", { weekday: "short" })}</div>
                          <div className="text-lg font-semibold">{d.getDate()}</div>
                          <div className="text-[10px] uppercase">{d.toLocaleDateString("de-DE", { month: "short" })}</div>
                        </button>
                      );
                    })}
                    {days.length === 0 && <p className="text-sm text-muted-foreground">Aktuell keine freien Tage.</p>}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s.toISOString()}
                        onClick={() => setSlot(s)}
                        className="group rounded-xl border border-border bg-card/30 px-3 py-3 text-sm font-medium transition-all hover:border-accent hover:bg-accent/10"
                      >
                        {formatTime(s)}
                        <ArrowRight className="ml-1 inline h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    ))}
                    {day && slots.length === 0 && (
                      <p className="col-span-full text-sm text-muted-foreground">An diesem Tag ist nichts mehr frei.</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="space-y-3">
                  <button type="button" onClick={() => setSlot(null)} className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-3.5 w-3.5" /> anderen Zeitpunkt wählen
                  </button>
                  <div className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
                    <strong className="font-semibold">{formatDateLong(slot)}</strong> · {formatTime(slot)} Uhr · {link.duration_minutes} Min
                  </div>
                  <input className={inputCls} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
                  <input className={inputCls} type="email" placeholder="E-Mail *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
                  <input
                    className={inputCls}
                    type="tel"
                    placeholder={link.meeting_type === "phone" ? "Telefonnummer für den Rückruf *" : "Telefon (optional)"}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required={link.meeting_type === "phone"}
                    maxLength={40}
                  />
                  <input className={inputCls} placeholder="Unternehmen (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={120} />
                  <textarea className={inputCls} rows={4} placeholder="Worum geht's? (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={1000} />
                  <button type="submit" disabled={submitting}
                    className="glow-orange inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.01] disabled:opacity-60">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Termin verbindlich buchen"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </main>
  );
}