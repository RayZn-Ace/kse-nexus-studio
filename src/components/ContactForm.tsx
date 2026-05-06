import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { ArrowUpRight, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(120),
  email: z.string().trim().email("Ungültige E-Mail").max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Nachricht fehlt").max(5000),
});

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Senden fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    setDone(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("Nachricht gesendet — wir melden uns!");
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-10 text-center max-w-lg mx-auto"
      >
        <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Nachricht ist raus!</h3>
        <p className="text-sm text-muted-foreground mb-5">Wir melden uns so schnell wie möglich.</p>
        <button onClick={() => setDone(false)} className="text-sm text-accent hover:underline">
          Weitere Nachricht senden
        </button>
      </motion.div>
    );
  }

  const inputCls =
    "w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/60 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 md:p-8 max-w-xl mx-auto space-y-3 text-left">
      <div className="grid sm:grid-cols-2 gap-3">
        <input className={inputCls} placeholder="Name" maxLength={120}
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={inputCls} placeholder="E-Mail" type="email" maxLength={255}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <input className={inputCls} placeholder="Betreff (optional)" maxLength={200}
        value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
      <textarea className={`${inputCls} min-h-[140px] resize-y`} placeholder="Worum geht's?" maxLength={5000}
        value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
      <button type="submit" disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-full text-sm font-medium glow-orange hover:scale-[1.02] transition-transform disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Senden <ArrowUpRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}