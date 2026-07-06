import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useSpring, type MotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { Intro } from "@/components/Intro";
import { WebGLBackground } from "@/components/WebGLBackground";
import { Hero, TrailedSections, ContactCTA } from "@/components/Sections";
import { Manifest } from "@/components/Manifest";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KSE / GROUP — Creative Tech Studio aus Hannover" },
      {
        name: "description",
        content:
          "Unabhängiges Studio für Social Media, Web Design, Werbefilm und Branding. Wir bauen Marken, an die man sich erinnert — aus Hannover.",
      },
      { property: "og:title", content: "KSE / GROUP — Creative Tech Studio" },
      {
        property: "og:description",
        content:
          "Social · Web · Film · Branding — unabhängiges Studio aus Hannover.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ───────────── chrome ───────────── */

function ScrollProgress({ progress }: { progress: MotionValue<number> }) {
  const scaleX = useSpring(progress, { stiffness: 140, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[150]"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #4f7dff 0%, #a855f7 50%, #ff4d5e 100%)",
      }}
    />
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed top-0 inset-x-0 z-[120] px-6 md:px-12 lg:px-20 py-6 transition-all duration-300 ${
        scrolled ? "backdrop-blur-md border-b border-white/5" : ""
      }`}
      style={{ background: scrolled ? "rgba(5,5,6,0.55)" : "transparent" }}
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em]">
        <a href="#top" className="font-black tracking-[0.12em]" style={{ letterSpacing: "0.12em" }}>
          KSE / GROUP
        </a>
        <nav className="hidden md:flex items-center gap-8 text-white/60">
          <a href="#work" className="hover:text-white transition-colors">
            Work
          </a>
          <a href="#about" className="hover:text-white transition-colors">
            About
          </a>
          <a href="#capabilities" className="hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="#contact" className="hover:text-white transition-colors">
            Kontakt
          </a>
        </nav>
        <a
          href="mailto:info@ksegroup.eu"
          className="hidden md:inline hover:opacity-60 transition-opacity"
        >
          info@ksegroup.eu →
        </a>
      </div>
    </header>
  );
}

function Footer() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Berlin",
      }).format(new Date());
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <footer className="relative px-6 md:px-12 lg:px-20 py-14 border-t border-white/10 text-[10px] uppercase tracking-[0.35em] text-white/40 flex flex-wrap gap-x-10 gap-y-3 justify-between">
      <span>© 2026 KSE Group</span>
      <span>Creative Tech Studio</span>
      <span>Built in Hannover · DE</span>
      <span>{time ? `Hannover · ${time} Uhr` : "\u00A0"}</span>
    </footer>
  );
}

/* ───────────── PAGE ───────────── */

function Index() {
  const { scrollYProgress } = useScroll();

  return (
    <div id="top" className="relative">
      <Intro />
      <WebGLBackground progress={scrollYProgress} />
      <ScrollProgress progress={scrollYProgress} />
      <Header />

      <main className="relative z-10">
        <Hero />
        <section id="work" className="relative z-10 -mt-[14vh]">
          <TrailedSections />
        </section>
        <Manifest />
        <section id="contact">
          <ContactCTA />
        </section>
      </main>

      <Footer />
    </div>
  );
}