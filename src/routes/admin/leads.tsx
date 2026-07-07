import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Target, ChevronRight, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/admin/leads")({ component: Leads });

type Lead = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  company: string | null;
  services: string[] | null;
  budget_range: string | null;
  timeline: string | null;
  created_at: string;
};

const STAGES = [
  { id: "neu", label: "Neu / Sichtung", color: "#0a0a0a" },
  { id: "qualifiziert", label: "Qualifiziert", color: "#ff5722" },
  { id: "angebot", label: "Angebot raus", color: "#0066ff" },
  { id: "gewonnen", label: "Gewonnen", color: "#16a34a" },
  { id: "verloren", label: "Verloren", color: "#71717a" },
] as const;

type StageId = (typeof STAGES)[number]["id"];
const KEY = "kse-lead-stages";

function loadStages(): Record<string, StageId> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<Record<string, StageId>>({});

  useEffect(() => {
    setStages(loadStages());
    supabase
      .from("contact_messages")
      .select("id,name,email,subject,message,company,services,budget_range,timeline,created_at")
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLeads((data as Lead[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const setStage = (id: string, stage: StageId) => {
    const next = { ...stages, [id]: stage };
    setStages(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const getStage = (id: string): StageId => stages[id] || "neu";

  return (
    <div className="min-h-screen bg-[#f5f2ea] text-[#0a0a0a]">
      <Header />
      {loading ? (
        <div className="p-12 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-[#ff5722]" /></div>
      ) : (
        <div className="p-6 grid grid-cols-5 gap-4 min-w-[1400px]">
          {STAGES.map((s) => {
            const items = leads.filter((l) => getStage(l.id) === s.id);
            return (
              <div key={s.id} className="flex flex-col">
                <div className="border-2 border-[#0a0a0a] bg-white p-3 mb-3" style={{ boxShadow: "4px 4px 0 0 #0a0a0a" }}>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: s.color }}>{s.label}</div>
                    <div className="text-lg font-black" style={{ fontFamily: "var(--font-display)" }}>{items.length}</div>
                  </div>
                  <div className="mt-2 h-1 w-full bg-[#f5f2ea] border border-[#0a0a0a]"><div className="h-full" style={{ background: s.color, width: `${Math.min(100, items.length * 10)}%` }} /></div>
                </div>
                <div className="space-y-2 flex-1">
                  {items.map((l) => (
                    <LeadCard key={l.id} lead={l} stage={getStage(l.id)} onChange={(st) => setStage(l.id, st)} />
                  ))}
                  {items.length === 0 && (
                    <div className="border-2 border-dashed border-[#0a0a0a]/20 p-4 text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/30 text-center">Leer</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="border-b-2 border-[#0a0a0a] bg-white px-6 py-5 flex items-center gap-3">
      <div className="w-10 h-10 bg-[#ff5722] border-2 border-[#0a0a0a] grid place-items-center" style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}>
        <Target className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#ff5722]">/ Taktik-Pipeline</div>
        <h1 className="font-black text-2xl uppercase tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Lead Radar</h1>
      </div>
      <div className="ml-auto text-[10px] font-mono text-[#0a0a0a]/50">Drag by button → move mission stage</div>
    </header>
  );
}

function LeadCard({ lead, stage, onChange }: { lead: Lead; stage: StageId; onChange: (s: StageId) => void }) {
  const [open, setOpen] = useState(false);
  const currentIdx = STAGES.findIndex((s) => s.id === stage);
  const next = STAGES[Math.min(STAGES.length - 1, currentIdx + 1)];
  return (
    <div className="border-2 border-[#0a0a0a] bg-white p-3" style={{ boxShadow: "3px 3px 0 0 #0a0a0a" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-black text-sm truncate">{lead.name}</div>
          <div className="text-[10px] font-mono text-[#0a0a0a]/60 truncate">{lead.email}</div>
        </div>
        {lead.budget_range && (
          <div className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-[#ff5722] text-white px-1.5 py-0.5">{lead.budget_range}</div>
        )}
      </div>
      {lead.subject && <div className="mt-2 text-xs font-bold line-clamp-2">{lead.subject}</div>}
      {lead.services && lead.services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.services.slice(0, 3).map((s) => (
            <span key={s} className="text-[9px] font-black uppercase tracking-wider border border-[#0a0a0a] px-1 py-0.5">{s}</span>
          ))}
        </div>
      )}
      {open && (
        <div className="mt-2 text-[11px] leading-snug text-[#0a0a0a]/80 whitespace-pre-wrap border-t border-[#0a0a0a]/10 pt-2">{lead.message}</div>
      )}
      <div className="mt-3 flex items-center gap-1.5">
        <a href={`mailto:${lead.email}`} className="border border-[#0a0a0a] p-1.5 hover:bg-[#0a0a0a] hover:text-white transition-colors"><Mail className="w-3 h-3" /></a>
        {lead.company && <a href={`tel:${lead.company}`} className="border border-[#0a0a0a] p-1.5 hover:bg-[#0a0a0a] hover:text-white transition-colors"><Phone className="w-3 h-3" /></a>}
        <button onClick={() => setOpen((v) => !v)} className="text-[9px] font-black uppercase tracking-widest hover:text-[#ff5722]">{open ? "Zu" : "Mehr"}</button>
        <select value={stage} onChange={(e) => onChange(e.target.value as StageId)} className="ml-auto border border-[#0a0a0a] bg-white text-[10px] font-black uppercase px-1 py-0.5">
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      {next.id !== stage && (
        <button onClick={() => onChange(next.id)} className="mt-2 w-full text-[9px] font-black uppercase tracking-widest bg-[#0a0a0a] text-white py-1.5 flex items-center justify-center gap-1 hover:bg-[#ff5722]">
          → {next.label} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}