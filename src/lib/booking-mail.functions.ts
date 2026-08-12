import { createServerFn } from "@tanstack/react-start";

const ADMIN_MAIL = "marketing@smea.info";

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Ctx = {
  admin: boolean;
  title: string;
  when: string;
  duration: number;
  typeLabel: string;
  location: string;
  roomUrl: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string | null;
  host: { name: string; role: string; email: string; phone?: string | null; photo_url?: string | null } | null;
};

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 16px 6px 0;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#ff5722;white-space:nowrap;vertical-align:top">${label}</td>
    <td style="padding:6px 0;font-size:15px;color:#0a0a0a">${value}</td>
  </tr>`;
}

function renderHtml(c: Ctx) {
  const h = c.host;
  const badge = c.admin ? "NEUE BUCHUNG" : "TERMIN BESTÄTIGT";
  const headline = c.admin ? "Neue Terminbuchung" : "Dein Termin steht";
  const intro = c.admin
    ? `<strong>${esc(c.name)}</strong> hat gerade einen Termin gebucht.`
    : `Hi ${esc(c.name.split(" ")[0] || c.name)}, dein Termin ist fix eingetragen. Wir freuen uns auf dich.`;

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;color:#0a0a0a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4"><tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:4px solid #0a0a0a">

  <tr><td style="background:#0a0a0a;padding:14px 26px">
    <span style="display:inline-block;background:#ff5722;color:#ffffff;font-size:11px;font-weight:bold;letter-spacing:4px;padding:6px 10px">KSE GROUP</span>
    <span style="color:#ffeb3b;font-size:11px;font-weight:bold;letter-spacing:3px;padding-left:12px">${badge}</span>
  </td></tr>

  <tr><td style="padding:32px 26px 0">
    <h1 style="margin:0 0 6px;font-size:32px;line-height:1.05;font-weight:900;letter-spacing:-1px;text-transform:uppercase;color:#0a0a0a">${esc(headline)}</h1>
    <div style="width:96px;height:8px;background:#ff5722"></div>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.65;color:#222222">${intro}</p>
  </td></tr>

  <tr><td style="padding:24px 26px 0">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffeb3b;border:3px solid #0a0a0a">
      <tr><td style="padding:18px 20px">
        <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#0a0a0a">${esc(c.typeLabel)} · ${c.duration} Min</div>
        <div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;padding-top:6px;color:#0a0a0a">${esc(c.when)}</div>
        <div style="font-size:14px;padding-top:4px;color:#0a0a0a">${esc(c.title)}</div>
      </td></tr>
    </table>
  </td></tr>

  ${c.roomUrl ? `<tr><td style="padding:22px 26px 0">
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#ff5722">
      <a href="${esc(c.roomUrl)}" style="display:block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;padding:16px 26px;transform:translate(-5px,-5px)">Zum Video-Raum &nbsp;&rarr;</a>
    </td></tr></table>
    <div style="padding-top:12px;font-size:12px;color:#666666">Link: <a href="${esc(c.roomUrl)}" style="color:#ff5722">${esc(c.roomUrl)}</a></div>
  </td></tr>` : ""}

  <tr><td style="padding:26px 26px 0">
    <table cellpadding="0" cellspacing="0" width="100%">
      ${c.location ? row("Ort", esc(c.location)) : ""}
      ${row("Name", esc(c.name))}
      ${row("E-Mail", `<a href="mailto:${esc(c.email)}" style="color:#0a0a0a">${esc(c.email)}</a>`)}
      ${c.phone ? row("Telefon", esc(c.phone)) : ""}
      ${c.company ? row("Firma", esc(c.company)) : ""}
      ${c.message ? row("Nachricht", esc(c.message).replace(/\n/g, "<br/>")) : ""}
    </table>
  </td></tr>

  <tr><td style="padding:26px 26px 0"><div style="border-top:2px solid #0a0a0a"></div></td></tr>

  ${h ? `<tr><td style="padding:26px">
    <div style="font-size:14px;color:#666666;padding-bottom:18px">${c.admin ? "Zuständig:" : "Mit kreativen Grüßen,"}</div>
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      ${h.photo_url ? `<td width="130" valign="top" style="padding-right:22px"><img src="${esc(h.photo_url)}" width="120" height="120" alt="${esc(h.name)}" style="display:block;border-radius:50%;border:3px solid #0a0a0a"/></td>` : ""}
      <td valign="top" style="border-left:3px solid #0a0a0a;padding-left:22px">
        <div style="font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#0a0a0a">${esc(h.name)}</div>
        <div style="font-size:12px;letter-spacing:3px;color:#777777;padding:6px 0 10px">${esc(h.role.toUpperCase())}</div>
        <div style="width:96px;height:4px;background:#ff5722"></div>
        <table cellpadding="0" cellspacing="0" style="padding-top:12px">
          ${row("Web", `<a href="https://ksegroup.eu" style="color:#0a0a0a;text-decoration:none">ksegroup.eu</a>`)}
          ${h.phone ? row("Mobil", esc(h.phone)) : ""}
          ${row("E-Mail", `<a href="mailto:${esc(h.email)}" style="color:#0a0a0a;text-decoration:none">${esc(h.email)}</a>`)}
        </table>
        <div style="border-top:1px solid #dddddd;margin:16px 0 12px"></div>
        <div style="font-size:13px;color:#0a0a0a">Wir bauen keine Marken. <span style="color:#ff5722">Wir bauen Charakter.</span></div>
      </td>
    </tr></table>
  </td></tr>` : `<tr><td style="padding:26px;font-size:13px;color:#0a0a0a">Wir bauen keine Marken. <span style="color:#ff5722">Wir bauen Charakter.</span></td></tr>`}

  <tr><td style="background:#0a0a0a;padding:12px 26px;font-size:10px;letter-spacing:3px;color:#ffffff;text-transform:uppercase">KSE GROUP · Hannover · ksegroup.eu</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export const sendBookingConfirmation = createServerFn({ method: "POST" })
  .inputValidator((data: { bookingId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data?.bookingId ?? "")) throw new Error("Ungültige Buchung");
    return data;
  })
  .handler(async ({ data }) => {
    const key = process.env["RESEND_API_KEY"];
    if (!key) return { ok: false as const, error: "no_key" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: b } = await supabaseAdmin
      .from("bookings")
      .select("*, booking_links(title, location, info, host_key, meeting_type)")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (!b) return { ok: false as const, error: "not_found" };

    const { SIGNATURE_PEOPLE } = await import("@/lib/signature-people");
    const linkRow = (b as any).booking_links ?? {};
    const host = SIGNATURE_PEOPLE.find((p) => p.id === linkRow.host_key) ?? null;

    const start = new Date(b.starts_at as string);
    const when = start.toLocaleString("de-DE", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin",
    }) + " Uhr";
    const typeLabel =
      b.meeting_type === "video" ? "Online Video-Call" : b.meeting_type === "phone" ? "Telefon-Call" : "Vor Ort";

    const base: Omit<Ctx, "admin"> = {
      title: linkRow.title ?? "Termin",
      when,
      duration: b.duration_minutes as number,
      typeLabel,
      location: b.meeting_type === "onsite" ? (linkRow.location ?? "") : "",
      roomUrl: (b.room_url as string | null) ?? null,
      name: b.name as string,
      email: b.email as string,
      phone: (b.phone as string | null) ?? null,
      company: (b.company as string | null) ?? null,
      message: (b.message as string | null) ?? null,
      host: host ? { name: host.name, role: host.role, email: host.email, phone: host.phone, photo_url: host.photo_url } : null,
    };

    const from = `${host?.name ?? "KSE GROUP"} <${host?.email ?? "marketing@ksegroup.eu"}>`;
    const send = (to: string, subject: string, html: string) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ from, to: [to], reply_to: host?.email ?? ADMIN_MAIL, subject, html }),
      });

    const results = await Promise.allSettled([
      send(base.email, `Termin bestätigt · ${when} · ${base.title}`, renderHtml({ ...base, admin: false })),
      send(ADMIN_MAIL, `Neue Buchung · ${base.name} · ${when}`, renderHtml({ ...base, admin: true })),
    ]);
    return { ok: results.every((r) => r.status === "fulfilled" && r.value.ok) };
  });
