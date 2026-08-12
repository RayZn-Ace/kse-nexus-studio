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
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a">
<div style="max-width:600px;margin:0 auto;padding:28px 24px">
  <div style="display:inline-block;background:#ff5722;color:#fff;font-size:10px;font-weight:bold;letter-spacing:3px;padding:5px 9px;text-transform:uppercase">KSE GROUP</div>
  <h1 style="font-size:24px;margin:20px 0 12px;line-height:1.2">${esc(i.linkTitle)}</h1>
  <div style="font-size:15px;line-height:1.6;color:#222">${body}</div>
  <div style="margin:28px 0">
    <a href="${esc(i.bookingUrl)}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:14px 22px">Termin auswählen</a>
  </div>
  <p style="font-size:12px;color:#666;margin:0 0 24px">Oder Link kopieren: <a href="${esc(i.bookingUrl)}" style="color:#ff5722">${esc(i.bookingUrl)}</a></p>
  <hr style="border:none;border-top:1px solid #e5e2da;margin:24px 0"/>
  <table cellpadding="0" cellspacing="0"><tr>
    ${s.photo_url ? `<td style="padding-right:14px" valign="top"><img src="${esc(s.photo_url)}" width="64" height="64" alt="${esc(s.name)}" style="border-radius:50%;display:block"/></td>` : ""}
    <td valign="top" style="font-size:13px;line-height:1.5;color:#0a0a0a">
      <strong>${esc(s.name)}</strong><br/>
      <span style="color:#666">${esc(s.role)}</span><br/>
      <a href="mailto:${esc(s.email)}" style="color:#ff5722;text-decoration:none">${esc(s.email)}</a>
      ${s.phone ? `<br/><span style="color:#666">${esc(s.phone)}</span>` : ""}
      <br/><a href="https://ksegroup.eu" style="color:#0a0a0a;text-decoration:none">ksegroup.eu</a>
    </td>
  </tr></table>
</div></body></html>`;
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
