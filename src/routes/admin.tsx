import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Inbox,
  Video,
  Instagram,
  MessageCircle,
  LogOut,
  Loader2,
  ArrowUpRight,
  Image as ImageIcon,
  Activity,
  Target,
  Siren,
  Wand2,
  Radio,
  FileText,
  FlaskConical,
  Eye,
  CalendarDays,
  Trophy,
  MessagesSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Kommandozentrale — KSE Group" },
      { name: "robots", content: "noindex" },
    ],
  }),
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
    return (
      <div className="min-h-screen grid place-items-center bg-[#f5f2ea]">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff5722]" />
      </div>
    );
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <main className="min-h-screen grid place-items-center px-6 bg-[#f5f2ea] text-[#0a0a0a]">
        <div
          className="border-2 border-[#0a0a0a] bg-white p-8 max-w-md text-center"
          style={{ boxShadow: "8px 8px 0 0 #0a0a0a" }}
        >
          <div className="inline-block bg-[#ff5722] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest mb-3">
            Zutritt verweigert
          </div>
          <h1
            className="font-black text-3xl uppercase tracking-tight mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kein Admin-Zugriff
          </h1>
          <p className="text-sm text-[#0a0a0a]/70 mb-5">
            Dein Account ({user.email}) hat noch keine Admin-Rolle.
          </p>
          <button
            onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
            className="text-xs font-black uppercase tracking-widest text-[#ff5722] hover:underline"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  const nav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/warroom", label: "War Room", icon: Radio },
    { to: "/admin/alarm", label: "Alarm", icon: Siren },
    { to: "/admin/leads", label: "Leads", icon: Target },
    { to: "/admin/inbox", label: "Inbox", icon: Inbox },
    { to: "/admin/chats", label: "Direktchats", icon: MessagesSquare },
    { to: "/admin/journey", label: "Journey", icon: Activity },
    { to: "/admin/planner", label: "Planner", icon: CalendarDays },
    { to: "/admin/copilot", label: "Copilot", icon: Wand2 },
    { to: "/admin/report", label: "Dossier", icon: FileText },
    { to: "/admin/spy", label: "Spy Radar", icon: Eye },
    { to: "/admin/abtest", label: "A/B Duelle", icon: FlaskConical },
    { to: "/admin/tutorials", label: "Tutorials", icon: Video },
    { to: "/admin/media", label: "Medien", icon: ImageIcon },
    { to: "/admin/instagram", label: "Instagram", icon: Instagram },
    { to: "/admin/chatbot", label: "Chatbot", icon: MessageCircle },
    { to: "/admin/achievements", label: "Achievements", icon: Trophy },
  ];

  return (
    <div className="min-h-screen flex bg-[#f5f2ea] text-[#0a0a0a]">
      <aside className="w-64 border-r-2 border-[#0a0a0a] bg-white flex flex-col p-4 sticky top-0 h-screen">
        {/* Brand */}
        <Link
          to="/"
          className="block mb-6 pb-4 border-b-2 border-[#0a0a0a] group"
        >
          <div className="inline-block bg-[#ff5722] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.3em] mb-2">
            ◆ KSE / v1
          </div>
          <div
            className="font-black uppercase tracking-tighter leading-[0.9] text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kommando-
            <br />
            <span className="text-[#ff5722]">zentrale</span>
          </div>
        </Link>

        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0a0a0a]/40 px-1 mb-2">
          / Navigation
        </div>
        <nav className="space-y-1 flex-1">
          {nav.map((n) => {
            const active = n.exact
              ? pathname === n.to
              : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group relative flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold uppercase tracking-wide border-2 transition-all ${
                  active
                    ? "bg-[#0a0a0a] text-white border-[#0a0a0a]"
                    : "border-transparent hover:border-[#0a0a0a] hover:bg-[#f5f2ea]"
                }`}
              >
                <n.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{n.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#ff5722]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t-2 border-[#0a0a0a] pt-3 mt-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-[#0a0a0a]/60 hover:text-[#ff5722]"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Zur Website
          </Link>
          <button
            onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-[#0a0a0a]/60 hover:text-[#ff5722]"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
          <div className="px-3 pt-2 flex items-center gap-2 text-[10px] font-mono text-[#0a0a0a]/40">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-70 animate-ping" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}