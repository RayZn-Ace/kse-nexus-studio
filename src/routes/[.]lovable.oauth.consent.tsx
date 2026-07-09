import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OAuthDetails = {
  client?: { name?: string };
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthResult = { data?: OAuthDetails; error?: { message: string } | null };
type OAuthDecisionResult = {
  data?: { redirect_url?: string; redirect_to?: string };
  error?: { message: string } | null;
};

const oauth = supabase.auth.oauth as unknown as {
  getAuthorizationDetails: (authorizationId: string) => Promise<OAuthResult>;
  approveAuthorization: (authorizationId: string) => Promise<OAuthDecisionResult>;
  denyAuthorization: (authorizationId: string) => Promise<OAuthDecisionResult>;
};

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id:
      typeof search.authorization_id === "string" ? search.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = `${location.pathname}${location.searchStr}`;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  pendingComponent: () => (
    <main className="min-h-screen grid place-items-center bg-[#05060a] text-white">
      <Loader2 className="h-6 w-6 animate-spin text-[#ff5722]" />
    </main>
  ),
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center bg-[#05060a] px-6 text-white">
      <section className="max-w-lg border-2 border-[#ff5722] bg-black p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ff5722]">
          KSEPI OAuth
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase">Verbindung nicht möglich</h1>
        <p className="mt-3 text-sm text-white/70">
          {String((error as Error)?.message ?? error)}
        </p>
      </section>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "dieses KI-Tool";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Der Auth-Server hat kein Redirect-Ziel zurückgegeben.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#f5f2ea] px-6 text-[#0a0a0a]">
      <section
        className="w-full max-w-xl border-2 border-[#0a0a0a] bg-white p-8"
        style={{ boxShadow: "8px 8px 0 0 #0a0a0a" }}
      >
        <div className="inline-flex items-center gap-2 bg-[#ff5722] px-2 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white">
          <ShieldCheck className="h-3.5 w-3.5" /> KSEPI Zugriff
        </div>
        <h1 className="mt-5 text-4xl font-black uppercase leading-none">
          {clientName} verbinden?
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#0a0a0a]/70">
          Dadurch darf das Tool die geschützten KSEPI-Debug-Werkzeuge mit deinem
          Admin-Account verwenden. Tokens und Secrets werden nicht ausgegeben.
        </p>
        {error && (
          <p role="alert" className="mt-4 border border-[#ff5722] bg-[#ff5722]/10 p-3 text-sm font-bold">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="border-2 border-[#0a0a0a] bg-[#0a0a0a] px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
          >
            Erlauben
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="border-2 border-[#0a0a0a] bg-white px-5 py-3 text-xs font-black uppercase tracking-widest disabled:opacity-60"
          >
            Ablehnen
          </button>
        </div>
      </section>
    </main>
  );
}