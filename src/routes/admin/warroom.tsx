import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Radio, TrendingUp, Users, MousePointer2, Zap } from "lucide-react";

export const Route = createFileRoute("/admin/warroom")({ component: WarRoom });

type Stats = { online: number; today: number; week: number; conversions: number; topPath: string; topCount: number; series: number[]; lastEvents: Array<{ id: string; event_type: string; path: string | null; created_at: string }> };

function WarRoom() {
  const [s, setS] = useState<Stats | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const now = new Date();
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [onlineR, todayR, weekR, convR, lastR] = await Promise.all([
        supabase.from("visitor_events").select("session_id").gte("created_at", fiveMinAgo),
        supabase.from("visitor_events").select("path", { count: "exact", head: false }).eq("event_type", "pageview").gte("created_at", dayAgo).limit(1000),
        supabase.from("visitor_events").select("created_at").eq("event_type", "pageview").gte("created_at", weekAgo).limit(5000),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
        supabase.from("visitor_events").select("id,event_type,path,created_at").order("created_at", { ascending: false }).limit(15),
      ]);

      const online = new Set((((onlineR.data as Array<{ session_id: string }> | null) ?? []).map((r) => r.session_id))).size;
      const paths = ((todayR.data as Array<{ path: string | null }> | null) ?? []).map((p) => p.path || "/");
      const today = paths.length;
      const counts: Record<string, number> = {};
      paths.forEach((p) => { counts[p] = (counts[p] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      const weekRows = ((weekR.data as Array<{ created_at: string }> | null) ?? []);
      const buckets = Array(7).fill(0);
      weekRows.forEach((r) => {
        const d = Math.floor((now.getTime() - new Date(r.created_at).getTime()) / (24 * 60 * 60 * 1000));
        if (d >= 0 && d < 7) buckets[6 - d]++;
      });

      if (cancelled) return;
      setS({
        online,
        today,
        week: weekRows.length,
        conversions: convR.count || 0,
        topPath: top?.[0] || "—",
        topCount: top?.[1] || 0,
        series: buckets,
        lastEvents: ((lastR.data as Stats["lastEvents"] | null) ?? []),
      });
    };
    load();
    const t = setInterval(() => { setTick((n) => n + 1); load(); }, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const max = s ? Math.max(1, ...s.series) : 1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f2ea]">
      <header className="border-b-2 border-[#f5f2ea]/20 px-6 py-5 flex items-center gap-3">
        <div className="relative w-10 h-10 bg-[#ff5722] border-2 border-[#f5f2ea] grid place-items-center">
          <Radio className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
        </div>
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722]">/ Mission Control</div>
          <h1 className="font-black text-2xl uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>War Room</h1>
        </div>
        <div className="ml-auto text-[10px] font-mono text-[#f5f2ea]/50">TICK #{tick} · Auto-Refresh 10s</div>
      </header>

      {!s ? (
        <div className="p-12 text-center text-[#f5f2ea]/40 font-mono text-sm">Booting sensors…</div>
      ) : (
        <div className="p-6 grid grid-cols-4 gap-4">
          <Big label="Online JETZT" value={s.online} sub="letzte 5 min" accent="#22c55e" pulse />
          <Big label="Views heute" value={s.today} sub="24h" accent="#ff5722" />
          <Big label="Views 7T" value={s.week} sub="Woche" accent="#0066ff" />
          <Big label="Conversions" value={s.conversions} sub="Nachrichten 24h" accent="#eab308" />

          <div className="col-span-3 border-2 border-[#f5f2ea]/20 p-6 bg-[#f5f2ea]/[0.02]">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722] mb-4">/ 7-Tage-Verlauf</div>
            <div className="flex items-end gap-2 h-40">
              {s.series.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[#ff5722]" style={{ height: `${(v / max) * 100}%`, minHeight: 2, boxShadow: "0 0 20px rgba(255,87,34,0.3)" }} />
                  <div className="text-[9px] font-mono text-[#f5f2ea]/50">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-[#f5f2ea]/20 p-6 bg-[#f5f2ea]/[0.02]">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722] mb-2">/ Top Ziel</div>
            <div className="font-black text-2xl truncate" style={{ fontFamily: "var(--font-display)" }}>{s.topPath}</div>
            <div className="mt-2 text-[10px] font-mono text-[#f5f2ea]/60">{s.topCount} Views heute</div>
          </div>

          <div className="col-span-4 border-2 border-[#f5f2ea]/20 p-6 bg-[#f5f2ea]/[0.02]">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722] mb-3">/ Live Signal Feed</div>
            <div className="space-y-1 font-mono text-xs max-h-64 overflow-auto">
              {s.lastEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-1 border-b border-[#f5f2ea]/5">
                  <span className="text-[#f5f2ea]/40 shrink-0">{new Date(e.created_at).toLocaleTimeString("de-DE")}</span>
                  <span className="text-[#ff5722] font-black uppercase w-32 shrink-0 truncate">{e.event_type}</span>
                  <span className="text-[#f5f2ea]/70 truncate">{e.path || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Big({ label, value, sub, accent, pulse }: { label: string; value: number; sub: string; accent: string; pulse?: boolean }) {
  return (
    <div className="border-2 border-[#f5f2ea]/20 p-6 bg-[#f5f2ea]/[0.02] relative overflow-hidden">
      {pulse && <div className="absolute top-3 right-3 w-2 h-2 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />}
      <div className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: accent }}>{label}</div>
      <div className="font-black text-6xl mt-2 tabular-nums" style={{ fontFamily: "var(--font-display)", color: accent, textShadow: `0 0 30px ${accent}40` }}>{value}</div>
      <div className="mt-1 text-[10px] font-mono text-[#f5f2ea]/40 uppercase tracking-wider">{sub}</div>
    </div>
  );
}