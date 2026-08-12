import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Plus, Loader2, Link2, Copy, Trash2, Save, Video, Phone, MapPin,
  Users, Check, X, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendTerminMail, type MailSender } from "@/lib/termin-mail.functions";
import { SIGNATURE_PEOPLE, abs, type SignaturePerson } from "@/lib/signature-people";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_AVAILABILITY, MEETING_TYPES, WEEKDAY_LABELS, slugify,
  type Availability, type Booking, type BookingLink, type MeetingType,
  formatDateLong, formatTime, dateKey, timeGrid, daysFromSlots,
  FORM_FIELDS, FIELD_MODES, fieldConfig, type FormFields, type FieldMode,
} from "@/lib/booking";

export const Route = createFileRoute("/admin/termine")({
  head: () => ({
    meta: [
      { title: "Termine — KSE Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TerminePage,
});

const db = supabase as any;

const TYPE_ICON: Record<MeetingType, typeof Video> = { video: Video, phone: Phone, onsite: MapPin };

const SENDERS: MailSender[] = SIGNATURE_PEOPLE.map(({ id: _id, ...p }) => p);

function TerminePage() {
  const [tab, setTab] = useState<"links" | "bookings">("links");
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<BookingLink> | null>(null);
  const [mailFor, setMailFor] = useState<BookingLink | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: l }, { data: b }] = await Promise.all([
      db.from("booking_links").select("*").order("created_at", { ascending: false }),
      db.from("bookings").select("*").order("starts_at", { ascending: true }),
    ]);
    setLinks((l ?? []) as BookingLink[]);
    setBookings((b ?? []) as Booking[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const save = async () => {
    if (!editing) return;
    const title = (editing.title || "").trim();
    if (!title) return toast.error("Titel fehlt");
    const payload = {
      slug: (editing.slug || slugify(title) || `termin-${Date.now()}`).trim(),
      title,
      description: editing.description || null,
      meeting_type: editing.meeting_type || "video",
      duration_minutes: Number(editing.duration_minutes) || 30,
      location: editing.location || null,
      info: editing.info || null,
      availability: editing.availability || DEFAULT_AVAILABILITY,
      mode: editing.mode || "recurring",
      fixed_slots: editing.fixed_slots || [],
      host_key: editing.host_key || null,
      form_fields: editing.form_fields || {},
      is_active: editing.is_active ?? true,
    };
    const res = editing.id
      ? await db.from("booking_links").update(payload).eq("id", editing.id)
      : await db.from("booking_links").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Gespeichert");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await db.from("booking_links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    load();
  };

  const upcoming = useMemo(
    () => bookings.filter((b) => new Date(b.starts_at).getTime() >= Date.now() - 3600_000),
    [bookings],
  );
  const past = useMemo(
    () => bookings.filter((b) => new Date(b.starts_at).getTime() < Date.now() - 3600_000).reverse(),
    [bookings],
  );

  return (
    <main className="min-h-screen bg-[#f5f2ea] p-4 sm:p-6 md:p-10 text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] pb-5">
        <div className="inline-flex items-center gap-2 bg-[#ff5722] px-2 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white">
          <CalendarDays className="h-3.5 w-3.5" /> Termin-Hub
        </div>
        <h1 className="mt-4 text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-none tracking-tight">
          Termine & Buchungslinks
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[#0a0a0a]/65">
          Erstelle stylische Terminlinks für Kunden — Video-Call mit eigenem Raum,
          Telefon-Call mit Rückrufnummer oder Vor-Ort-Termin.
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2">
        {([["links", "Terminarten", Link2], ["bookings", `Buchungen (${upcoming.length})`, Users]] as const).map(
          ([id, label, Icon]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id as any)}
                className={`inline-flex items-center gap-2 border-2 border-[#0a0a0a] px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                  active ? "bg-[#0a0a0a] text-white" : "bg-white hover:bg-[#0a0a0a] hover:text-white"
                }`}
                style={active ? { boxShadow: "5px 5px 0 0 #ff5722" } : undefined}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            );
          },
        )}
        <div className="ml-auto" />
        {tab === "links" && (
          <button
            onClick={() => setEditing({ meeting_type: "video", duration_minutes: 30, availability: DEFAULT_AVAILABILITY, is_active: true })}
            className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
            style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}
          >
            <Plus className="h-3.5 w-3.5" /> Neuer Terminlink
          </button>
        )}
      </nav>

      {loading ? (
        <div className="mt-16 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#ff5722]" /></div>
      ) : tab === "links" ? (
        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {links.length === 0 && (
            <p className="text-sm text-[#0a0a0a]/60">Noch keine Terminarten angelegt.</p>
          )}
          {links.map((l) => {
            const Icon = TYPE_ICON[l.meeting_type] ?? Video;
            const url = `${origin}/termin/${l.slug}`;
            const count = bookings.filter((b) => b.link_id === l.id).length;
            return (
              <article key={l.id} className="border-2 border-[#0a0a0a] bg-white p-5" style={{ boxShadow: "6px 6px 0 0 #0a0a0a" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2 bg-[#0a0a0a] px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    <Icon className="h-3 w-3" /> {MEETING_TYPES.find((t) => t.id === l.meeting_type)?.label}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${l.is_active ? "text-emerald-600" : "text-[#0a0a0a]/40"}`}>
                    {l.is_active ? "aktiv" : "inaktiv"}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-black uppercase leading-tight">{l.title}</h3>
                <p className="mt-1 text-xs text-[#0a0a0a]/60">
                  {l.duration_minutes} Min · {count} Buchungen
                  {l.mode === "onetime" && ` · ${(l.fixed_slots ?? []).length} feste Slots`}
                </p>
                {l.description && <p className="mt-2 text-sm text-[#0a0a0a]/70">{l.description}</p>}
                <div className="mt-4 flex items-center gap-2 border-2 border-dashed border-[#0a0a0a]/30 px-2 py-1.5">
                  <span className="truncate font-mono text-[11px]">{url}</span>
                  <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Link kopiert"); }} className="ml-auto shrink-0 text-[#ff5722]" title="Kopieren">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-[#0a0a0a]/60 hover:text-[#ff5722]"><ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setEditing(l)} className="border-2 border-[#0a0a0a] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest hover:bg-[#0a0a0a] hover:text-white">Bearbeiten</button>
                  <button onClick={() => setMailFor(l)} className="inline-flex items-center gap-1.5 border-2 border-[#0a0a0a] bg-[#ff5722] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-white">
                    <Mail className="h-3.5 w-3.5" /> Mailen
                  </button>
                  <button onClick={() => remove(l.id)} className="border-2 border-[#0a0a0a] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#ff5722] hover:bg-[#ff5722] hover:text-white">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-8 space-y-8">
          <BookingTable title="Kommende Termine" rows={upcoming} links={links} onChange={load} />
          <BookingTable title="Vergangen" rows={past} links={links} onChange={load} muted />
        </section>
      )}

      {editing && (
        <EditorModal
          value={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {mailFor && (
        <MailModal link={mailFor} url={`${origin}/termin/${mailFor.slug}`} onClose={() => setMailFor(null)} />
      )}
    </main>
  );
}

function MailModal({ link, url, onClose }: { link: BookingLink; url: string; onClose: () => void }) {
  const send = useServerFn(sendTerminMail);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(`Terminvorschlag: ${link.title}`);
  const [message, setMessage] = useState(
    `Guten Tag,\n\nanbei mein Terminvorschlag für "${link.title}" (${link.duration_minutes} Minuten).\nBitte wählen Sie einfach einen passenden Zeitpunkt aus.\n\nBeste Grüße`,
  );
  const [sender, setSender] = useState<MailSender>(SENDERS[0]);
  const [busy, setBusy] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);

  useEffect(() => {
    supabase.storage
      .from("media")
      .list("", { limit: 60, sortBy: { column: "created_at", order: "desc" } })
      .then(({ data }) => {
        const imgs = (data ?? [])
          .filter((f) => /\.(png|jpe?g|webp|gif|avif)$/i.test(f.name))
          .map((f) => `https://ksegroup.eu/api/public/media/${encodeURIComponent(f.name)}`);
        setGallery(imgs);
      });
  }, []);

  const input = "w-full border-2 border-[#0a0a0a] bg-white px-3 py-2 text-sm outline-none focus:border-[#ff5722]";
  const label = "block text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60 mb-1";
  const split = (s: string) => s.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);

  const submit = async () => {
    const toList = split(to);
    if (!toList.length) return toast.error("Empfänger fehlt");
    setBusy(true);
    try {
      await send({
        data: { to: toList, cc: split(cc), subject, message, bookingUrl: url, linkTitle: link.title, sender },
      });
      toast.success("Mail versendet");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Versand fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="my-8 w-full max-w-xl border-2 border-[#0a0a0a] bg-[#f5f2ea] p-6" style={{ boxShadow: "10px 10px 0 0 #ff5722" }}>
        <div className="flex items-center justify-between border-b-2 border-[#0a0a0a] pb-3">
          <h2 className="text-2xl font-black uppercase tracking-tight">Termin per Mail senden</h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>An (Komma-getrennt)</label>
              <input className={input} value={to} onChange={(e) => setTo(e.target.value)} placeholder="kunde@firma.de" />
            </div>
            <div>
              <label className={label}>CC (optional)</label>
              <input className={input} value={cc} onChange={(e) => setCc(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Betreff</label>
            <input className={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className={label}>Nachricht</label>
            <textarea rows={7} className={input} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="border-t-2 border-[#0a0a0a] pt-4">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50">/ Absender & Signatur</div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <input className={input} value={sender.name} onChange={(e) => setSender({ ...sender, name: e.target.value })} placeholder="Name" />
              <input className={input} value={sender.role} onChange={(e) => setSender({ ...sender, role: e.target.value })} placeholder="Position" />
              <input className={input} value={sender.email} onChange={(e) => setSender({ ...sender, email: e.target.value })} placeholder="absender@ksegroup.eu" />
              <input className={input} value={sender.phone ?? ""} onChange={(e) => setSender({ ...sender, phone: e.target.value })} placeholder="Telefon" />
            </div>

            <div className="mt-4">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60">Kollegen auswählen</div>
              <div className="flex flex-wrap gap-3">
                {SIGNATURE_PEOPLE.map((p: SignaturePerson) => {
                  const active = sender.email === p.email && sender.name === p.name;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSender({ name: p.name, role: p.role, email: p.email, phone: p.phone, photo_url: p.photo_url })}
                      className={`flex w-[124px] flex-col items-center gap-1 border-2 p-2 text-center ${active ? "border-[#ff5722] bg-white" : "border-[#0a0a0a]/20 hover:border-[#0a0a0a]"}`}
                    >
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} loading="lazy" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
                      ) : (
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-[#0a0a0a] text-sm font-black text-white">
                          {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </span>
                      )}
                      <span className="text-[10px] font-bold leading-tight">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60">Signaturfoto</div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSender({ ...sender, photo_url: "" })}
                  className={`grid h-12 w-12 place-items-center rounded-full border-2 text-[9px] font-black uppercase ${!sender.photo_url ? "border-[#ff5722]" : "border-[#0a0a0a]/20"}`}
                >
                  Kein
                </button>
                {[...SIGNATURE_PEOPLE.map((p) => p.photo_url).filter(Boolean) as string[], ...gallery].map((u) => (
                  <button key={u} type="button" onClick={() => setSender({ ...sender, photo_url: abs(u) })}
                    className={`rounded-full border-2 p-0.5 ${sender.photo_url === abs(u) ? "border-[#ff5722]" : "border-transparent hover:border-[#0a0a0a]/30"}`}>
                    <img src={u} alt="" loading="lazy" width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-[#0a0a0a]/50">Eigene Fotos kommen aus „Medien“ — dort hochladen, erscheint hier automatisch.</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-[#0a0a0a]/30 px-3 py-2 font-mono text-[11px]">{url}</div>
          <button onClick={submit} disabled={busy}
            className="inline-flex items-center justify-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-4 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Senden
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingTable({
  title, rows, links, onChange, muted,
}: { title: string; rows: Booking[]; links: BookingLink[]; onChange: () => void; muted?: boolean }) {
  const cancel = async (id: string) => {
    const { error } = await db.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Termin abgesagt");
    onChange();
  };
  return (
    <div>
      <h2 className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50">/ {title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#0a0a0a]/50">Keine Einträge.</p>
      ) : (
        <div className={`space-y-3 ${muted ? "opacity-70" : ""}`}>
          {rows.map((b) => {
            const link = links.find((l) => l.id === b.link_id);
            const Icon = TYPE_ICON[b.meeting_type] ?? Video;
            const d = new Date(b.starts_at);
            return (
              <div key={b.id} className="border-2 border-[#0a0a0a] bg-white p-4 md:flex md:items-center md:gap-5">
                <div className="min-w-[190px]">
                  <div className="text-[11px] font-black uppercase tracking-widest text-[#ff5722]">{formatDateLong(d)}</div>
                  <div className="text-2xl font-black">{formatTime(d)}</div>
                  <div className="text-[11px] text-[#0a0a0a]/50">{b.duration_minutes} Min</div>
                </div>
                <div className="mt-3 flex-1 md:mt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                      <Icon className="h-3 w-3" /> {link?.title ?? b.meeting_type}
                    </span>
                    {b.status === "cancelled" && (
                      <span className="bg-[#ff5722] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">Abgesagt</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-bold">{b.name}{b.company ? ` · ${b.company}` : ""}</div>
                  <div className="text-xs text-[#0a0a0a]/70">
                    {b.email}{b.phone ? ` · ☎ ${b.phone}` : ""}
                  </div>
                  {b.message && <p className="mt-1 text-xs text-[#0a0a0a]/60">„{b.message}"</p>}
                  {b.room_url && (
                    <a href={b.room_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[#ff5722]">
                      <Video className="h-3 w-3" /> Raum öffnen
                    </a>
                  )}
                </div>
                {b.status !== "cancelled" && (
                  <button onClick={() => cancel(b.id)} className="mt-3 border-2 border-[#0a0a0a] px-3 py-1.5 text-[11px] font-black uppercase tracking-widest hover:bg-[#ff5722] hover:text-white md:mt-0">
                    Absagen
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditorModal({
  value, onChange, onClose, onSave,
}: {
  value: Partial<BookingLink>;
  onChange: (v: Partial<BookingLink>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const av: Availability = { ...DEFAULT_AVAILABILITY, ...(value.availability || {}) };
  const setAv = (patch: Partial<Availability>) => onChange({ ...value, availability: { ...av, ...patch } });
  const input = "w-full border-2 border-[#0a0a0a] bg-white px-3 py-2 text-sm outline-none focus:border-[#ff5722]";
  const label = "block text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60 mb-1";
  const mode = value.mode || "recurring";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl border-2 border-[#0a0a0a] bg-[#f5f2ea] p-6 my-8" style={{ boxShadow: "10px 10px 0 0 #ff5722" }}>
        <div className="flex items-center justify-between border-b-2 border-[#0a0a0a] pb-3">
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {value.id ? "Terminart bearbeiten" : "Neue Terminart"}
          </h2>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={label}>Titel</label>
            <input className={input} value={value.title || ""} placeholder="Strategie-Call"
              onChange={(e) => onChange({ ...value, title: e.target.value, slug: value.id ? value.slug : slugify(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Link-Slug</label>
            <input className={input} value={value.slug || ""} onChange={(e) => onChange({ ...value, slug: slugify(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Art des Termins</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {MEETING_TYPES.map((t) => {
                const Icon = TYPE_ICON[t.id];
                const active = (value.meeting_type || "video") === t.id;
                return (
                  <button key={t.id} onClick={() => onChange({ ...value, meeting_type: t.id })}
                    className={`border-2 border-[#0a0a0a] p-3 text-left ${active ? "bg-[#0a0a0a] text-white" : "bg-white"}`}>
                    <Icon className="h-4 w-4" />
                    <div className="mt-1.5 text-[11px] font-black uppercase tracking-widest">{t.label}</div>
                    <div className={`text-[10px] ${active ? "text-white/60" : "text-[#0a0a0a]/50"}`}>{t.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={label}>Dauer (Minuten)</label>
            <input type="number" min={10} step={5} className={input} value={value.duration_minutes ?? 30}
              onChange={(e) => onChange({ ...value, duration_minutes: Number(e.target.value) })} />
          </div>
          <div>
            <label className={label}>Status</label>
            <button onClick={() => onChange({ ...value, is_active: !(value.is_active ?? true) })}
              className={`w-full border-2 border-[#0a0a0a] px-3 py-2 text-xs font-black uppercase tracking-widest ${value.is_active ?? true ? "bg-emerald-500 text-white" : "bg-white"}`}>
              {value.is_active ?? true ? "Aktiv" : "Inaktiv"}
            </button>
          </div>
          <div className="md:col-span-2">
            <label className={label}>Mit wem findet der Termin statt?</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {SIGNATURE_PEOPLE.map((p) => {
                const active = value.host_key === p.id;
                return (
                  <button key={p.id} onClick={() => onChange({ ...value, host_key: active ? null : p.id })}
                    className={`flex items-center gap-2.5 border-2 border-[#0a0a0a] p-2 text-left ${active ? "bg-[#0a0a0a] text-white" : "bg-white"}`}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt={p.name} className="h-9 w-9 rounded-full border-2 border-[#ff5722] object-cover" />
                      : <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#ff5722] text-[11px] font-black">{p.name.split(" ").map((n) => n[0]).join("")}</span>}
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-black uppercase tracking-widest">{p.name}</span>
                      <span className={`block truncate text-[10px] ${active ? "text-white/60" : "text-[#0a0a0a]/50"}`}>{p.role.split("·")[0]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={label}>Beschreibung (Kunde sieht das)</label>
            <textarea rows={2} className={input} value={value.description || ""}
              onChange={(e) => onChange({ ...value, description: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Infos / Hinweise für den Kunden</label>
            <textarea rows={3} className={input} value={value.info || ""} placeholder="Was der Kunde vorbereiten soll, Ablauf, etc."
              onChange={(e) => onChange({ ...value, info: e.target.value })} />
          </div>
          {(value.meeting_type || "video") === "onsite" && (
            <div className="md:col-span-2">
              <label className={label}>Ort / Adresse</label>
              <input className={input} value={value.location || ""} onChange={(e) => onChange({ ...value, location: e.target.value })} />
            </div>
          )}

          <div className="md:col-span-2 border-t-2 border-[#0a0a0a] pt-4">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50">/ Verfügbarkeit</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {([["recurring", "Wiederkehrend", "Wochentage + Zeitfenster"], ["onetime", "Einmalig", "Tage & Uhrzeiten einzeln antippen"]] as const).map(([id, t, hint]) => (
                <button key={id} onClick={() => onChange({ ...value, mode: id })}
                  className={`border-2 border-[#0a0a0a] p-3 text-left ${mode === id ? "bg-[#0a0a0a] text-white" : "bg-white"}`}>
                  <div className="text-[11px] font-black uppercase tracking-widest">{t}</div>
                  <div className={`text-[10px] ${mode === id ? "text-white/60" : "text-[#0a0a0a]/50"}`}>{hint}</div>
                </button>
              ))}
            </div>
          </div>

          {mode === "onetime" ? (
            <div className="md:col-span-2">
              <SlotPicker
                slots={value.fixed_slots ?? []}
                step={av.slot || 30}
                onChange={(fixed_slots) => onChange({ ...value, fixed_slots })}
              />
              <FieldConfigEditor
                value={value.form_fields ?? {}}
                onChange={(form_fields) => onChange({ ...value, form_fields })}
              />
            </div>
          ) : (
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_LABELS.map((w, i) => {
                const on = av.weekdays.includes(i);
                return (
                  <button key={w} onClick={() => setAv({ weekdays: on ? av.weekdays.filter((d) => d !== i) : [...av.weekdays, i].sort() })}
                    className={`border-2 border-[#0a0a0a] px-3 py-1.5 text-[11px] font-black uppercase ${on ? "bg-[#ff5722] text-white" : "bg-white"}`}>
                    {w}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div><label className={label}>Von</label><input type="time" className={input} value={av.start} onChange={(e) => setAv({ start: e.target.value })} /></div>
              <div><label className={label}>Bis</label><input type="time" className={input} value={av.end} onChange={(e) => setAv({ end: e.target.value })} /></div>
              <div><label className={label}>Raster (Min)</label><input type="number" min={5} step={5} className={input} value={av.slot} onChange={(e) => setAv({ slot: Number(e.target.value) })} /></div>
              <div><label className={label}>Vorlauf (Std)</label><input type="number" min={0} className={input} value={av.lead_hours} onChange={(e) => setAv({ lead_hours: Number(e.target.value) })} /></div>
              <div><label className={label}>Buchbar (Tage)</label><input type="number" min={1} className={input} value={av.days_ahead} onChange={(e) => setAv({ days_ahead: Number(e.target.value) })} /></div>
            </div>
          </div>
          )}
        </div>

        <div className="mt-6 flex gap-2 border-t-2 border-[#0a0a0a] pt-4">
          <button onClick={onSave} className="inline-flex items-center gap-2 border-2 border-[#0a0a0a] bg-[#ff5722] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white" style={{ boxShadow: "5px 5px 0 0 #0a0a0a" }}>
            <Save className="h-4 w-4" /> Speichern
          </button>
          <button onClick={onClose} className="border-2 border-[#0a0a0a] bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest">Abbrechen</button>
          <div className="ml-auto hidden items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/40 sm:flex">
            <Check className="h-3 w-3" /> Video-Räume werden automatisch erzeugt
          </div>
        </div>
      </div>
    </div>
  );
}
function SlotPicker({
  slots, step, onChange,
}: { slots: string[]; step: number; onChange: (slots: string[]) => void }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [range, setRange] = useState({ start: "08:00", end: "18:00", step });
  const set = new Set(slots);
  const selectedDays = daysFromSlots(slots);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const firstDow = (month.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const toggleSlot = (d: Date) => {
    const iso = d.toISOString();
    const next = set.has(iso) ? slots.filter((s) => s !== iso) : [...slots, iso];
    onChange(next.sort());
  };
  const toggleDay = (day: Date) => {
    const has = slots.some((s) => dateKey(new Date(s)) === dateKey(day));
    if (has) onChange(slots.filter((s) => dateKey(new Date(s)) !== dateKey(day)));
    else onChange([...slots, timeGrid(day, range.start, range.end, range.step)[0]?.toISOString()].filter(Boolean).sort() as string[]);
  };

  const cell = "border-2 border-[#0a0a0a] px-2 py-1.5 text-[11px] font-black uppercase";
  return (
    <div className="border-2 border-[#0a0a0a] bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/50">/ Tage & Uhrzeiten wählen</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className={cell}>‹</button>
          <span className="min-w-[130px] text-center text-[11px] font-black uppercase tracking-widest">
            {month.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className={cell}>›</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <div key={d} className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/40">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const active = slots.some((s) => dateKey(new Date(s)) === dateKey(d));
          const past = d < today;
          return (
            <button key={d.toISOString()} disabled={past} onClick={() => toggleDay(d)}
              className={`border-2 border-[#0a0a0a] py-1.5 text-[11px] font-black ${
                active ? "bg-[#ff5722] text-white" : past ? "border-[#0a0a0a]/20 text-[#0a0a0a]/25" : "bg-white hover:bg-[#0a0a0a] hover:text-white"
              }`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60">Zeitfenster von</label>
          <input type="time" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} className="w-full border-2 border-[#0a0a0a] px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60">bis</label>
          <input type="time" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} className="w-full border-2 border-[#0a0a0a] px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60">Raster (Min)</label>
          <input type="number" min={5} step={5} value={range.step} onChange={(e) => setRange({ ...range, step: Number(e.target.value) || 30 })} className="w-full border-2 border-[#0a0a0a] px-2 py-1.5 text-sm" />
        </div>
      </div>

      {selectedDays.length === 0 ? (
        <p className="mt-4 text-xs text-[#0a0a0a]/50">Tippe oben einen Tag an — danach wählst du hier die Uhrzeiten (Mehrfachauswahl).</p>
      ) : (
        <div className="mt-4 space-y-4">
          {selectedDays.map((day) => {
            const grid = timeGrid(day, range.start, range.end, range.step);
            const count = slots.filter((s) => dateKey(new Date(s)) === dateKey(day)).length;
            return (
              <div key={dateKey(day)} className="border-2 border-dashed border-[#0a0a0a]/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-widest">{formatDateLong(day)} · {count} Slots</div>
                  <div className="flex gap-1.5">
                    <button onClick={() => onChange([...new Set([...slots, ...grid.map((g) => g.toISOString())])].sort())} className={cell}>Alle</button>
                    <button onClick={() => onChange(slots.filter((s) => dateKey(new Date(s)) !== dateKey(day)))} className={cell}>Tag entfernen</button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {grid.map((g) => {
                    const on = set.has(g.toISOString());
                    return (
                      <button key={g.toISOString()} onClick={() => toggleSlot(g)}
                        className={`border-2 border-[#0a0a0a] px-2.5 py-1 text-[11px] font-black ${on ? "bg-[#0a0a0a] text-white" : "bg-white"}`}>
                        {formatTime(g)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
