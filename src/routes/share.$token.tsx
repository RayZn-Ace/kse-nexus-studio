import { createFileRoute, Link } from "@tanstack/react-router";
import { getShare } from "@/server/shares.functions";
import { Download, Film } from "lucide-react";

export const Route = createFileRoute("/share/$token")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.ok
          ? `${loaderData.tutorial.title} — KSE Group`
          : "Tutorial — KSE Group",
      },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content:
          "Geteiltes Tutorial-Video von KSE Group. Sicher, privat, brandgesichert.",
      },
    ],
  }),
  loader: ({ params }) => getShare({ data: { token: params.token } }),
  component: SharePage,
});

function SharePage() {
  const data = Route.useLoaderData();
  const { token } = Route.useParams();

  if (!data.ok) {
    const msg =
      data.reason === "expired"
        ? "Dieser Link ist abgelaufen."
        : "Dieser Link ist ungültig oder wurde entfernt.";
    return (
      <Shell>
        <div className="glass rounded-2xl p-10 text-center max-w-md mx-auto">
          <Film className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <h1 className="font-display text-xl font-semibold mb-1">Nicht verfügbar</h1>
          <p className="text-sm text-muted-foreground">{msg}</p>
        </div>
      </Shell>
    );
  }

  const t = data.tutorial;
  const dl = `${slug(t.title)}.${t.ext}`;

  return (
    <Shell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent mb-1">
              KSE Group · Geteiltes Tutorial
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
              {t.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(t.created_at).toLocaleDateString("de-DE", {
                day: "2-digit", month: "long", year: "numeric",
              })}
              {t.duration_seconds
                ? ` · ${Math.floor(t.duration_seconds / 60)}:${String(t.duration_seconds % 60).padStart(2, "0")} min`
                : ""}
            </p>
          </div>
          <a
            href={t.video_url}
            download={dl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        </div>

        <div className="glass rounded-2xl overflow-hidden ring-1 ring-border">
          <video
            src={t.video_url}
            controls
            playsInline
            className="w-full aspect-video bg-black"
          />
        </div>

        <p className="text-[11px] text-muted-foreground/70 mt-4 text-center">
          Link-ID: {token.slice(0, 8)}… · Vertraulich — nur für autorisierte Empfänger.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-10 bg-background/70">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-display font-semibold">
            <span className="text-gradient">KSE</span>
            <span className="text-muted-foreground font-light"> Group</span>
          </Link>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Tutorials
          </span>
        </div>
      </header>
      <main className="px-6 py-10">{children}</main>
      <footer className="border-t border-border/60 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-5 text-[11px] text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} KSE Group</span>
          <Link to="/" className="hover:text-foreground">kse-group.de</Link>
        </div>
      </footer>
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "tutorial";
}