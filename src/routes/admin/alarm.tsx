import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Siren, AlertTriangle, Mail, Zap, Volume2, VolumeX } from "lucide-react";

export const Route = createFileRoute("/admin/alarm")({ component: Alarm });

type Alert = { id: string; kind: "message" | "event"; title: string; body: string; at: string; severity: "hoch" | "mittel" | "info" };

function Alarm() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sound, setSound] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  const load = async () => {
    const [msgs, evts] = await Promise.all([
      supabase.from("contact_messages").select("id,name,subject,message,is_read,created_at").eq("is_read", false).order("created_at", { ascending: false }).limit(20),
      supabase.from("visitor_events").select("id,event_type,path,created_at,meta").in("event_type", ["cta_click", "form_submit", "conversion", "audit_start"]).order("created_at", { ascending: false }).limit(20),
    ]);
    const list: Alert[] = [
      ...(((msgs.data as Array<{ id: string; name: string; subject: string | null; message: string; created_at: string }> | null) ?? []).map((m) => ({
        id: `m-${m.id}`, kind: "message" as const, title: `Neue Nachricht von ${m.name}`, body: m.subject || m.message.slice(0, 100), at: m.created_at, severity: "hoch" as const,
      }))),
      ...(((evts.data as Array<{ id: string; event_type: string; path: string | null; created_at: string }> | null) ?? []).map((e) => ({
        id: `e-${e.id}`, kind: "event" as const, title: e.event_type.replace(/_/g, " ").toUpperCase(), body: e.path || "—", at: e.created_at, severity: "mittel" as const,
      }))),
    ].sort((a, b) => b.at.localeCompare(a.at));
    setAlerts(list);
    if (sound && list.length > lastCount && lastCount > 0) {
      try { new Audio("data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQ4AAAAA/////////wAAAAA=").play(); } catch {}
    }
    setLastCount(list.length);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound]);

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      <header className="border-b-2 border-[#0a0a0a] bg-white px-6 py-5 flex items-center gap-3">
        <div className="relative w-10 h-10 bg-red-600 border-2 border-[#0a0a0a] grid place-items-center" style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}>
          <Siren className="w-5 h-5 text-white" />
          {alerts.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />}
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-red-600">/ Alarmzentrale</div>
          <h1 className="font-black text-2xl uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Sirenen-Kanal</h1>
        </div>
        <button onClick={() => setSound((v) => !v)} className="ml-auto border-2 border-[#0a0a0a] px-3 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-[#0a0a0a] hover:text-white">
          {sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} Ton {sound ? "an" : "aus"}
        </button>
      </header>

      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="border-2 border-dashed border-[#0a0a0a]/30 p-12 text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/50">Ruhezone</div>
            <div className="mt-2 text-sm text-[#0a0a0a]/50">Kein Alarm. Alle Kanäle friedlich.</div>
          </div>
        ) : (
          <div className="space-y-2 max-w-4xl">
            {alerts.map((a) => (
              <div key={a.id} className="border-2 border-[#0a0a0a] bg-white p-4 flex items-start gap-3" style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}>
                <div className={`w-10 h-10 shrink-0 border-2 border-[#0a0a0a] grid place-items-center ${a.severity === "hoch" ? "bg-red-600 text-white" : "bg-[#ff5722] text-white"}`}>
                  {a.kind === "message" ? <Mail className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border border-[#0a0a0a] ${a.severity === "hoch" ? "bg-red-600 text-white" : "bg-[#ff5722] text-white"}`}>{a.severity}</span>
                    <span className="text-[10px] font-mono text-[#0a0a0a]/50">{new Date(a.at).toLocaleString("de-DE")}</span>
                  </div>
                  <div className="mt-1 font-black text-sm">{a.title}</div>
                  <div className="text-xs text-[#0a0a0a]/70 line-clamp-2">{a.body}</div>
                </div>
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}