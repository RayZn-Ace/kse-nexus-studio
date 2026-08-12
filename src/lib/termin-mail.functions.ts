import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MailSender = {
  name: string;
  role: string;
  email: string;
  phone?: string;
  photo_url?: string;
};

export type SendTerminMailInput = {
  to: string[];
  cc?: string[];
  subject: string;
  message: string;
  bookingUrl: string;
  linkTitle: string;
  sender: MailSender;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderHtml(i: SendTerminMailInput) {
  const body = esc(i.message).replace(/\n/g, "<br/>");
  const s = i.sender;
  const roleParts = s.role.split("·").map((p) => p.trim());
  const roleMain = esc((roleParts[0] ?? s.role).toUpperCase());
  const roleBrand = esc((roleParts[1] ?? "KSE GROUP").toUpperCase());

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:2px 14px 2px 0;font-size:14px;color:#ff5722;white-space:nowrap">${label}</td>
      <td style="padding:2px 0;font-size:14px;color:#0a0a0a">${value}</td>
    </tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;color:#0a0a0a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4"><tr><td align="center" style="padding:24px 12px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:4px solid #0a0a0a">

  <tr><td style="background:#0a0a0a;padding:14px 26px">
    <span style="display:inline-block;background:#ff5722;color:#ffffff;font-size:11px;font-weight:bold;letter-spacing:4px;padding:6px 10px">KSE GROUP</span>
    <span style="color:#ffeb3b;font-size:11px;font-weight:bold;letter-spacing:3px;padding-left:12px">TERMINVORSCHLAG</span>
  </td></tr>

  <tr><td style="padding:32px 26px 0">
    <h1 style="margin:0 0 6px;font-size:32px;line-height:1.05;font-weight:900;letter-spacing:-1px;text-transform:uppercase;color:#0a0a0a">${esc(i.linkTitle)}</h1>
    <div style="width:96px;height:8px;background:#ff5722"></div>
  </td></tr>

  <tr><td style="padding:22px 26px 0;font-size:15px;line-height:1.65;color:#222222">${body}</td></tr>

  <tr><td style="padding:28px 26px 0">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:#ffeb3b">
        <a href="${esc(i.bookingUrl)}" style="display:block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;padding:16px 26px;transform:translate(-5px,-5px)">Termin auswählen &nbsp;&rarr;</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:16px 26px 30px;font-size:12px;color:#666666">Oder Link kopieren: <a href="${esc(i.bookingUrl)}" style="color:#ff5722">${esc(i.bookingUrl)}</a></td></tr>

  <tr><td style="padding:0 26px"><div style="border-top:2px solid #0a0a0a"></div></td></tr>

  <tr><td style="padding:26px">
    <div style="font-size:14px;color:#666666;padding-bottom:18px">Mit kreativen Grüßen,</div>
    <table cellpadding="0" cellspacing="0" width="100%"><tr>
      ${s.photo_url ? `<td width="130" valign="top" style="padding-right:22px"><img src="${esc(s.photo_url)}" width="120" height="120" alt="${esc(s.name)}" style="display:block;border-radius:50%;border:3px solid #0a0a0a"/></td>` : ""}
      <td valign="top" style="border-left:3px solid #0a0a0a;padding-left:22px">
        <div style="font-size:26px;font-weight:900;letter-spacing:-0.5px;color:#0a0a0a">${esc(s.name)}</div>
        <div style="font-size:12px;letter-spacing:3px;color:#777777;padding:6px 0 10px">${roleMain} <span style="color:#c9a227">· ${roleBrand}</span></div>
        <div style="width:96px;height:4px;background:#ff5722"></div>
        <div style="font-size:14px;color:#555555;padding:14px 0 12px">Ihre Experten für New Media</div>
        <table cellpadding="0" cellspacing="0">
          ${row("Web", `<a href="https://ksegroup.eu" style="color:#0a0a0a;text-decoration:none">ksegroup.eu</a>`)}
          ${s.phone ? row("Mobil", esc(s.phone)) : ""}
          ${row("E-Mail", `<a href="mailto:${esc(s.email)}" style="color:#0a0a0a;text-decoration:none">${esc(s.email)}</a>`)}
        </table>
        <div style="border-top:1px solid #dddddd;margin:16px 0 12px"></div>
        <div style="font-size:13px;color:#0a0a0a">Wir bauen keine Marken. <span style="color:#ff5722">Wir bauen Charakter.</span></div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#0a0a0a;padding:12px 26px;font-size:10px;letter-spacing:3px;color:#ffffff;text-transform:uppercase">KSE GROUP · Hannover · ksegroup.eu</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export const sendTerminMail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SendTerminMailInput) => {
    if (!data?.to?.length) throw new Error("Empfänger fehlt");
    if (!data.subject?.trim()) throw new Error("Betreff fehlt");
    if (!data.bookingUrl?.startsWith("http")) throw new Error("Ungültiger Terminlink");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Nur Admins dürfen Termin-Mails versenden.");

    const key = process.env["RESEND_API_KEY"];
    if (!key) throw new Error("RESEND_API_KEY ist nicht konfiguriert.");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: `${data.sender.name} <${data.sender.email}>`,
        to: data.to,
        ...(data.cc?.length ? { cc: data.cc } : {}),
        reply_to: data.sender.email,
        subject: data.subject,
        html: renderHtml(data),
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Resend [${res.status}]: ${text}`);
    return { ok: true as const, id: (JSON.parse(text) as { id?: string }).id ?? null };
  });
