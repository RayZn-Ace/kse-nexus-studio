import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Phone, MapPin, Clock, CalendarDays, ArrowLeft, ArrowRight, Loader2,
  CheckCircle2, Copy, Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SIGNATURE_PEOPLE } from "@/lib/signature-people";
import {
  DEFAULT_AVAILABILITY, bookableDays, slotsForDay, buildRoomUrl, formatDateLong,
  formatTime, icsFor, daysFromSlots, fixedSlotsForDay,
  fieldConfig, type FieldKey,
  type Availability, type BookingLink, type MeetingType,
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
        const ff = (data as BookingLink).form_fields ?? {};
        setForm((f) => ({
          ...f,
          name: ff.name?.value || "",
          email: ff.email?.value || "",
          phone: ff.phone?.value || "",
          company: ff.company?.value || "",
          message: ff.message?.value || "",
        }));
        const { data: bs } = await db.rpc("taken_slots", { _link_id: data.id });
        setTaken(((bs ?? []) as { starts_at: string }[]).map((b) => new Date(b.starts_at).toISOString()));
      }
      setLoading(false);
    })();
  }, [slug]);

  const av: Availability = useMemo(
    () => ({ ...DEFAULT_AVAILABILITY, ...(link?.availability || {}) }),
    [link],
  );
  const oneTime = link?.mode === "onetime";
  const days = useMemo(() => {
    if (!link) return [];
    if (oneTime) {
      const now = new Date();
      return daysFromSlots(link.fixed_slots ?? []).filter(
        (d) => fixedSlotsForDay(d, link.fixed_slots ?? [], taken, now).length > 0,
      );
    }
    return bookableDays(av);
  }, [link, av, oneTime, taken]);
  const slots = useMemo(
    () =>
      link && day
        ? oneTime
          ? fixedSlotsForDay(day, link.fixed_slots ?? [], taken)
          : slotsForDay(day, av, link.duration_minutes, taken)
        : [],
    [link, day, av, taken, oneTime],
  );

  useEffect(() => {
    if (!day && days.length) setDay(days[0]);
  }, [days, day]);

  const Icon = link ? TYPE_ICON[link.meeting_type] ?? Video : Video;
  const host = link?.host_key ? SIGNATURE_PEOPLE.find((p) => p.id === link.host_key) ?? null : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link || !slot) return;
    const cfg = (k: FieldKey) => fieldConfig(link.form_fields, k);
    if (cfg("name").mode !== "hidden" && !form.name.trim()) return toast.error("Bitte gib deinen Namen an.");
    if (cfg("email").mode !== "hidden" && !form.email.trim()) return toast.error("Bitte gib deine E-Mail an.");
    if (link.meeting_type === "phone" && cfg("phone").mode !== "hidden" && !form.phone.trim())
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
      <main className="grid min-h-screen place-items-center bg-[#f4f4f4]">
        <Loader2 className="h-6 w-6 animate-spin text-[#ff5722]" />
      </main>
    );
  }

  if (!link) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f4f4] px-6 text-center text-[#0a0a0a]">
        <div className="border-4 border-[#0a0a0a] bg-white p-10 shadow-[10px_10px_0_0_#0a0a0a]">
          <h1 className="text-3xl font-black uppercase tracking-tight">Termin nicht verfügbar</h1>
          <p className="mt-2 text-sm text-[#0a0a0a]/60">Dieser Terminlink existiert nicht oder ist deaktiviert.</p>
          <Link to="/" className="mt-6 inline-block border-2 border-[#0a0a0a] bg-[#ffeb3b] px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em]">Zur Startseite</Link>
        </div>
      </main>
    );
  }

  const inputCls =
    "w-full border-2 border-[#0a0a0a] bg-white px-4 py-3 text-sm text-[#0a0a0a] placeholder:text-[#0a0a0a]/40 focus:bg-[#ffeb3b]/20 focus:outline-none transition-colors";

  return (
    <main className="relative min-h-screen bg-[#f4f4f4] px-4 py-10 text-[#0a0a0a] sm:px-6 md:py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(#0a0a0a 1px,transparent 1px),linear-gradient(90deg,#0a0a0a 1px,transparent 1px)", backgroundSize: "48px 48px" }}
      />

      <div className="relative mx-auto max-w-5xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 border-2 border-[#0a0a0a] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#ffeb3b]">
          <ArrowLeft className="h-3.5 w-3.5" /> ksegroup.eu
        </Link>

        <div className="grid border-4 border-[#0a0a0a] bg-white shadow-[12px_12px_0_0_#0a0a0a] md:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <aside className="border-b-4 border-[#0a0a0a] bg-[#0a0a0a] p-7 text-white md:border-b-0 md:border-r-4">
            <div className="inline-flex items-center gap-2 bg-[#ff5722] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-white">
              <Icon className="h-3 w-3" /> {TYPE_LABEL[link.meeting_type]}
            </div>
            <h1 className="mt-5 text-4xl font-black uppercase leading-[0.95] tracking-tight">{link.title}</h1>
            <div className="mt-3 h-2 w-24 bg-[#ffeb3b]" />
            {link.description && <p className="mt-4 text-sm leading-relaxed text-white/70">{link.description}</p>}

            {host && (
              <div className="mt-7 border-2 border-white/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffeb3b]">/ Dein Ansprechpartner</div>
                <div className="mt-3 flex items-center gap-3">
                  {host.photo_url ? (
                    <img src={host.photo_url} alt={host.name} className="h-16 w-16 rounded-full border-2 border-[#ff5722] object-cover" />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#ff5722] text-lg font-black">
                      {host.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="text-lg font-black uppercase leading-tight">{host.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">{host.role}</div>
                  </div>
                </div>
              </div>
            )}

            <ul className="mt-7 space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-white/70">
                <Clock className="h-4 w-4 text-[#ff5722]" /> {link.duration_minutes} Minuten
              </li>
              <li className="flex items-center gap-2.5 text-white/70">
                <Icon className="h-4 w-4 text-[#ff5722]" />
                {link.meeting_type === "video" && "Video-Raum wird automatisch erstellt"}
                {link.meeting_type === "phone" && "Wir rufen dich an"}
                {link.meeting_type === "onsite" && (link.location || "Vor Ort")}
              </li>
              <li className="flex items-center gap-2.5 text-white/70">
                <CalendarDays className="h-4 w-4 text-[#ff5722]" /> {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </li>
            </ul>

            {link.info && (
              <div className="mt-6 border-2 border-[#ffeb3b] bg-[#ffeb3b]/10 p-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#ffeb3b]">
                  <Info className="h-3 w-3" /> Infos
                </div>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/70">{link.info}</p>
              </div>
            )}

            <div className="mt-8 border-t-2 border-white/15 pt-4 text-[11px] leading-snug">
              Wir bauen keine Marken. <span className="text-[#ff5722]">Wir bauen Charakter.</span>
            </div>
          </aside>

          {/* Main */}
          <section className="p-7">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-6 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-[#ff5722]" />
                  <h2 className="mt-4 text-3xl font-black uppercase tracking-tight">Termin bestätigt</h2>
                  <p className="mt-2 text-sm text-[#0a0a0a]/60">
                    {formatDateLong(new Date(done.starts_at))} um {formatTime(new Date(done.starts_at))} Uhr
                  </p>
                  {host && (
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-[#ff5722]">mit {host.name}</p>
                  )}
                  {done.room_url && (
                    <div className="mx-auto mt-5 flex max-w-md items-center gap-2 border-2 border-[#0a0a0a] bg-white px-3 py-2">
                      <span className="truncate font-mono text-xs">{done.room_url}</span>
                      <button onClick={() => { navigator.clipboard.writeText(done.room_url!); toast.success("Link kopiert"); }} className="ml-auto text-[#ff5722]">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {done.room_url && (
                      <a href={done.room_url} target="_blank" rel="noreferrer" className="border-2 border-[#0a0a0a] bg-[#ff5722] px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[5px_5px_0_0_#0a0a0a]">
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
                      className="border-2 border-[#0a0a0a] bg-[#ffeb3b] px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] shadow-[5px_5px_0_0_#0a0a0a]"
                    >
                      Zum Kalender hinzufügen
                    </button>
                  </div>
                </motion.div>
              ) : !slot ? (
                <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/40">/ Schritt 01</div>
                  <h2 className="mt-1 text-2xl font-black uppercase tracking-tight">Wähle deinen Termin</h2>
                  <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                    {days.map((d) => {
                      const active = day && d.toDateString() === day.toDateString();
                      return (
                        <button
                          key={d.toISOString()}
                          onClick={() => setDay(d)}
                          className={`min-w-[78px] shrink-0 border-2 border-[#0a0a0a] px-3 py-2.5 text-center transition-all ${
                            active ? "bg-[#ff5722] text-white shadow-[5px_5px_0_0_#0a0a0a]" : "bg-white hover:bg-[#ffeb3b]"
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-[0.2em]">{d.toLocaleDateString("de-DE", { weekday: "short" })}</div>
                          <div className="text-2xl font-black leading-none">{d.getDate()}</div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em]">{d.toLocaleDateString("de-DE", { month: "short" })}</div>
                        </button>
                      );
                    })}
                    {days.length === 0 && <p className="text-sm text-[#0a0a0a]/50">Aktuell keine freien Tage.</p>}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s.toISOString()}
                        onClick={() => setSlot(s)}
                        className="group border-2 border-[#0a0a0a] bg-white px-3 py-3 text-sm font-black uppercase tracking-widest transition-all hover:-translate-y-0.5 hover:bg-[#ffeb3b] hover:shadow-[5px_5px_0_0_#0a0a0a]"
                      >
                        {formatTime(s)}
                        <ArrowRight className="ml-1 inline h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    ))}
                    {day && slots.length === 0 && (
                      <p className="col-span-full text-sm text-[#0a0a0a]/50">An diesem Tag ist nichts mehr frei.</p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="space-y-3">
                  <button type="button" onClick={() => setSlot(null)} className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#0a0a0a]/50 hover:text-[#ff5722]">
                    <ArrowLeft className="h-3.5 w-3.5" /> anderen Zeitpunkt wählen
                  </button>
                  <div className="border-2 border-[#0a0a0a] bg-[#ffeb3b] px-4 py-3 text-sm font-black uppercase tracking-wide">
                    {formatDateLong(slot)} · {formatTime(slot)} Uhr · {link.duration_minutes} Min
                    {host && <span className="block text-[10px] tracking-[0.2em] text-[#0a0a0a]/60">mit {host.name}</span>}
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
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-6 py-4 text-xs font-black uppercase tracking-[0.25em] text-white shadow-[6px_6px_0_0_#0a0a0a] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
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