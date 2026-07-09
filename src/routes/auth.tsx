import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login — KSE Group" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? sanitizeNext(search.next) : undefined,
  }),
  component: AuthPage,
});

function sanitizeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/admin";
  try {
    const url = new URL(next, "https://kse.local");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}

const schema = z.object({
  email: z.string().trim().email("Ungültige E-Mail").max(255),
  password: z.string().min(6, "Mindestens 6 Zeichen").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { next: rawNext } = Route.useSearch();
  const next = rawNext ?? "/admin";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = next;
    });
  }, [next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: `${window.location.origin}${next}` },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account erstellt — du wirst weitergeleitet.");
      window.location.href = next;
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      window.location.href = next;
    }
  };

  const inputCls = "w-full bg-card/40 border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent/60 transition-colors";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-3xl p-8"
      >
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> zurück zur Seite
        </Link>
        <h1 className="font-display text-2xl font-semibold mb-1">
          {mode === "login" ? "Admin Login" : "Account erstellen"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "login" ? "Willkommen zurück bei KSE." : "Lege deinen Admin-Zugang an."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={inputCls} type="email" placeholder="E-Mail" autoComplete="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className={inputCls} type="password" placeholder="Passwort" autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button type="submit" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-full text-sm font-medium glow-orange hover:scale-[1.02] transition-transform disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "login" ? "Login" : "Account anlegen"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-5 text-xs text-muted-foreground hover:text-foreground w-full text-center">
          {mode === "login" ? "Noch kein Account? Registrieren" : "Bereits Account? Login"}
        </button>
      </motion.div>
    </main>
  );
}