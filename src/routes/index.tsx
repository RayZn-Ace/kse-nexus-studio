import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { InkCollision } from "@/components/InkCollision";
import {
  Instagram, Mail, ArrowUpRight, Sparkles, Code2, Film, Rocket,
  Users, MessageSquare, Brain, Palette, ShieldAlert, MousePointer2,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

const services = [
  { icon: Sparkles, title: "Social Media Marketing", desc: "Erstellung, Planung, Analyse & Verwaltung. Wir etablieren Ihre Marke, erreichen Ihre Zielgruppe und steigern Engagement." },
  { icon: Code2, title: "Web Development", desc: "Maßgeschneiderte Websites, perfekt auf Marke und Zielgruppe zugeschnitten — performant, modern, skalierbar." },
  { icon: Film, title: "Werbefilme", desc: "Professionelle, fesselnde Werbevideos, die Ihre Botschaft effektiv vermitteln und Ihr Publikum begeistern." },
  { icon: Rocket, title: "Web & Social Boost", desc: "Gezielte Kampagnen für maximale Reichweite, mehr Traffic und stärkere Online-Sichtbarkeit." },
];

const skills = [
  { icon: Sparkles, label: "Social Media Marketing" },
  { icon: MessageSquare, label: "Content Management" },
  { icon: Users, label: "Artist Consulting" },
  { icon: Palette, label: "Web Design" },
  { icon: ShieldAlert, label: "Krisenmanagement" },
  { icon: Brain, label: "ChatGPT befragen" },
];

const testimonials = [
  { name: "Alexander Falke", role: "Restaurant 993 Hannover",
    quote: "Selten habe ich ein Team erlebt, das so effizient und kundenorientiert agiert wie KSE Management. Jedes Problem wird blitzschnell behoben — kreativ, professionell, unverzichtbar." },
  { name: "Marcus Dyck", role: "Büro & System Montagen",
    quote: "Seit KSE an unserer Seite ist, gibt es kein Problem mehr ohne Lösung. Die Webseite spiegelt Professionalität wider, Kay Engelmann gibt niemals auf — Kundenservice auf höchstem Niveau!" },
  { name: "Alexander Falke", role: "Restaurant 993 Hannover",
    quote: "Die Zusammenarbeit ist herausragend. Unsere Online-Präsenz wurde komplett transformiert — moderne Designs, smarte Strategien und messbare Ergebnisse." },
];

function Marquee() {
  const items = ["NEW MEDIA", "SOCIAL MEDIA", "MARKETING", "ARTISTS MANAGEMENT", "WEBDESIGN", "WERBEFILME"];
  return (
    <div className="relative overflow-hidden border-y border-border py-5 bg-card/20">
      <motion.div
        className="flex gap-10 whitespace-nowrap text-xl md:text-2xl font-medium tracking-tight"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-10 text-foreground/70">
            {t} <span className="text-accent text-sm">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1080px,calc(100%-2rem))]"
    >
      <div className="glass rounded-full px-5 py-2.5 flex items-center justify-between">
        <a href="#top" className="font-display font-semibold text-base tracking-tight">
          <span className="text-gradient">KSE</span><span className="text-muted-foreground font-light">Group</span>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
          <a href="#services" className="hover:text-foreground transition-colors">Services</a>
          <a href="#founder" className="hover:text-foreground transition-colors">Founder</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Bewertungen</a>
        </nav>
        <a href="#contact" className="group inline-flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full px-4 py-1.5 text-[13px] font-medium hover:scale-105 transition-transform">
          Kontakt <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
        </a>
      </div>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  const titleWords = ["New", "Media.", "Social.", "Marketing."];

  return (
    <section ref={ref} id="top" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div style={{ y, scale }} className="absolute inset-0 -z-10">
        <InkCollision />
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 text-center px-6 max-w-5xl pt-32">
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="inline-flex items-center gap-2 text-accent font-medium tracking-[0.3em] uppercase text-[11px] mb-6"
        >
          <span className="w-6 h-px bg-accent/60" /> Fange niemals an aufzuhören <span className="w-6 h-px bg-accent/60" />
        </motion.p>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] mb-6 tracking-tight">
          <span className="block text-muted-foreground/80 text-base md:text-lg font-light mb-3 tracking-normal">Ihre Experten für</span>
          {titleWords.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`inline-block mr-3 ${i === 0 ? "text-gradient" : ""}`}
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
          className="text-base text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
        >
          Ob Social Media, Webdesign oder Content Management — mit uns erreichen Sie Ihre digitalen Ziele.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <a href="#contact"
            className="group inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-full text-sm font-medium glow-orange hover:scale-105 transition-transform">
            Jetzt durchstarten
            <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </a>
          <a href="#services" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium glass hover:bg-white/10 transition-colors">
            Services entdecken
          </a>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="mt-16 inline-flex flex-col items-center gap-2 text-muted-foreground/70 text-[10px] tracking-[0.3em] uppercase"
        >
          <MousePointer2 className="w-3.5 h-3.5" /> Scroll
        </motion.div>
      </motion.div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
          className="mb-14 max-w-2xl"
        >
          <p className="text-accent uppercase tracking-[0.3em] text-[11px] mb-3">Services</p>
          <h2 className="text-3xl md:text-5xl font-semibold leading-[1.1] tracking-tight">
            Was wir <span className="text-gradient">richtig gut</span> können.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group relative glass rounded-2xl p-7 overflow-hidden"
            >
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-flex w-10 h-10 items-center justify-center rounded-xl bg-primary/15 text-primary mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 tracking-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{s.desc}</p>
                <a href="#contact" className="inline-flex items-center gap-1.5 text-accent text-sm font-medium group/link">
                  Tell me more
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Founder() {
  return (
    <section id="founder" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[0.9fr_1.1fr] gap-12 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative max-w-sm"
        >
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden glass">
            <img
              src="https://ksegroup.eu/wp-content/uploads/2024/06/meet-me-768x1024.png"
              alt="Kay Engelmann — Founder KSE Group"
              loading="lazy" width={768} height={1024}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
          <motion.div
            animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -top-5 -right-5 w-24 h-24 rounded-full border border-accent/40 flex items-center justify-center text-accent text-[10px] tracking-[0.2em]"
          >
            ✦ MEET • THE • FOUNDER •
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <p className="text-accent uppercase tracking-[0.3em] text-[11px] mb-3">Wer ist das denn?</p>
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-5 tracking-tight">
            Kay <span className="text-gradient">Engelmann</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-7">
            Studierter Medien- und Kommunikationswissenschaftler. Nach Stationen bei verschiedenen Fernsehsendern in Köln machte er sich in Hannover selbstständig. Sein Ziel: Musiker, Influencer und Unternehmen dabei zu unterstützen, ihre Reichweite zu vergrößern — und besonders talentierten Newcomern zum Durchbruch zu verhelfen.
          </p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Was der alles so kann</p>
          <div className="grid grid-cols-2 gap-2">
            {skills.map((sk, i) => (
              <motion.div
                key={sk.label}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2.5 glass rounded-lg px-3 py-2.5"
              >
                <sk.icon className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-xs font-medium">{sk.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-12 text-center">
          <p className="text-accent uppercase tracking-[0.3em] text-[11px] mb-3">Bewertungen</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Was sagen unsere <span className="text-gradient">Kunden?</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl text-accent/80 leading-none mb-3 font-display">„</div>
                <p className="text-sm text-foreground/85 leading-relaxed">{t.quote}</p>
              </div>
              <footer className="mt-6 pt-4 border-t border-border">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contact" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="text-5xl md:text-8xl font-semibold leading-none mb-6 tracking-tight"
        >
          Let's <span className="text-gradient italic">Talk</span>
        </motion.h2>
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
        >
          Haben wir Ihr Interesse geweckt? Entfesseln Sie Ihr Potenzial und werden Sie mit unserer Unterstützung zum nächsten Star.
        </motion.p>
        <motion.a
          href="mailto:info@ksegroup.eu"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-7 py-3.5 rounded-full text-sm font-medium glow-orange"
        >
          <Mail className="w-4 h-4" />
          <span>info@ksegroup.eu</span>
          <ArrowUpRight className="w-4 h-4" />
        </motion.a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display font-semibold text-base">
          <span className="text-gradient">KSE</span><span className="text-muted-foreground font-light">Group</span>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} KSE Group. Fange niemals an aufzuhören.</p>
        <div className="flex items-center gap-4 text-muted-foreground">
          <a href="mailto:info@ksegroup.eu" aria-label="Email" className="hover:text-foreground transition-colors"><Mail className="w-4 h-4" /></a>
          <a href="https://instagram.com" aria-label="Instagram" className="hover:text-foreground transition-colors"><Instagram className="w-4 h-4" /></a>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <main className="grain relative">
      <Header />
      <Hero />
      <Marquee />
      <Services />
      <Founder />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
