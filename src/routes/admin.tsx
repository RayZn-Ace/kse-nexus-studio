import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Inbox, Video, Instagram, MessageCircle, LogOut, Loader2, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — KSE Group" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <main className="min-h-screen grid place-items-center px-6">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <h1 className="font-display text-2xl font-semibold mb-2">Kein Admin-Zugriff</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Dein Account ({user.email}) hat noch keine Admin-Rolle. Bitte einen bestehenden Admin, dich freizuschalten.
          </p>
          <button onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
            className="text-sm text-accent hover:underline">Logout</button>
        </div>
      </main>
    );
  }

  const nav = [
    { to: "/admin", label: "Inbox", icon: Inbox, exact: true },
    { to: "/admin/tutorials", label: "Tutorials", icon: Video },
    { to: "/admin/instagram", label: "Instagram", icon: Instagram },
    { to: "/admin/chatbot", label: "Chatbot", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border bg-card/30 flex flex-col p-4 sticky top-0 h-screen">
        <Link to="/" className="font-display font-semibold text-base px-2 mb-8">
          <span className="text-gradient">KSE</span><span className="text-muted-foreground font-light">Admin</span>
        </Link>
        <nav className="space-y-1 flex-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                }`}>
                <n.icon className="w-4 h-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-3 mt-3 space-y-1">
          <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground">
            <ArrowUpRight className="w-3.5 h-3.5" /> Zur Website
          </Link>
          <button onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
          <p className="px-3 pt-2 text-[10px] text-muted-foreground/60 truncate">{user.email}</p>
        </div>
      </aside>
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}