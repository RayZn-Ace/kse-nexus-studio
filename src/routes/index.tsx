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
    <div className="relative overflow-hidden border-y border-border py-8 bg-card/30">
      <motion.div
        className="flex gap-16 whitespace-nowrap text-5xl md:text-7xl font-bold"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className={i % 2 === 0 ? "text-foreground/90" : "text-gradient"}>
            {t} <span className="text-accent">✦</span>
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
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1200px,calc(100%-2rem))]"
    >
      <div className="glass rounded-full px-6 py-3 flex items-center justify-between">
        <a href="#top" className="font-display font-bold text-xl tracking-tight">
          <span className="text-gradient">KSE</span><span className="text-muted-foreground font-light">Group</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#services" className="hover:text-foreground transition-colors">Services</a>
          <a href="#founder" className="hover:text-foreground transition-colors">Founder</a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">Bewertungen</a>
        </nav>
        <a href="#contact" className="group inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-5 py-2 text-sm font-semibold hover:scale-105 transition-transform">
          Kontakt <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
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
          className="inline-flex items-center gap-2 text-accent font-medium tracking-widest uppercase text-sm mb-6"
        >
          <span className="w-8 h-px bg-accent" /> Fange niemals an aufzuhören <span className="w-8 h-px bg-accent" />
        </motion.p>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-8">
          <span className="block text-muted-foreground/80 text-2xl md:text-3xl font-light mb-4">Ihre Experten für</span>
          {titleWords.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`inline-block mr-4 ${i === 0 ? "text-gradient" : ""}`}
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Ob Social Media, Webdesign oder Content Management — mit uns erreichen Sie Ihre digitalen Ziele.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <a href="#contact"
            className="group inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-full font-semibold glow-orange hover:scale-105 transition-transform">
            Jetzt durchstarten
            <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
          </a>
          <a href="#services" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold glass hover:bg-white/10 transition-colors">
            Services entdecken
          </a>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="mt-20 inline-flex flex-col items-center gap-2 text-muted-foreground text-xs tracking-widest uppercase"
        >
          <MousePointer2 className="w-4 h-4" /> Scroll
        </motion.div>
      </motion.div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
          className="mb-20 max-w-3xl"
        >
          <p className="text-accent uppercase tracking-widest text-sm mb-4">Services</p>
          <h2 className="text-5xl md:text-7xl font-bold leading-tight">
            Was wir<br /><span className="text-gradient">richtig gut</span> können.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="group relative glass rounded-3xl p-8 md:p-10 overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-flex w-14 h-14 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <s.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{s.desc}</p>
                <a href="#contact" className="inline-flex items-center gap-2 text-accent font-medium group/link">
                  Tell me more
                  <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
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
    <section id="founder" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden glass">
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
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-accent/40 flex items-center justify-center text-accent text-xs tracking-widest"
          >
            ✦ MEET • THE • FOUNDER •
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <p className="text-accent uppercase tracking-widest text-sm mb-4">Wer ist das denn?</p>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Kay <span className="text-gradient">Engelmann</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Studierter Medien- und Kommunikationswissenschaftler. Nach Stationen bei verschiedenen Fernsehsendern in Köln machte er sich in Hannover selbstständig. Sein Ziel: Musiker, Influencer und Unternehmen dabei zu unterstützen, ihre Reichweite zu vergrößern — und besonders talentierten Newcomern zum Durchbruch zu verhelfen.
          </p>
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Was der alles so kann:</p>
          <div className="grid grid-cols-2 gap-3">
            {skills.map((sk, i) => (
              <motion.div
                key={sk.label}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 glass rounded-xl px-4 py-3"
              >
                <sk.icon className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm font-medium">{sk.label}</span>
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
    <section id="testimonials" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-16 text-center">
          <p className="text-accent uppercase tracking-widest text-sm mb-4">Bewertungen</p>
          <h2 className="text-5xl md:text-7xl font-bold">Was sagen unsere <span className="text-gradient">Kunden?</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="glass rounded-3xl p-8 flex flex-col justify-between"
            >
              <div>
                <div className="text-5xl text-accent leading-none mb-4 font-display">„</div>
                <p className="text-foreground/90 leading-relaxed">{t.quote}</p>
              </div>
              <footer className="mt-8 pt-6 border-t border-border">
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.role}</div>
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
    <section id="contact" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div className="max-w-5xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="text-7xl md:text-[12rem] font-bold leading-none mb-8"
        >
          Let's <span className="text-gradient italic">Talk</span>
        </motion.h2>
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12"
        >
          Haben wir Ihr Interesse geweckt? Entfesseln Sie Ihr Potenzial und werden Sie mit unserer Unterstützung zum nächsten Star.
        </motion.p>
        <motion.a
          href="mailto:info@ksegroup.eu"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-3 bg-accent text-accent-foreground px-10 py-5 rounded-full text-lg font-semibold glow-orange"
        >
          <Mail className="w-5 h-5" />
          <span>info@ksegroup.eu</span>
          <ArrowUpRight className="w-5 h-5" />
        </motion.a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="font-display font-bold text-xl">
          <span className="text-gradient">KSE</span><span className="text-muted-foreground font-light">Group</span>
        </div>
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} KSE Group. Fange niemals an aufzuhören.</p>
        <div className="flex items-center gap-4 text-muted-foreground">
          <a href="mailto:info@ksegroup.eu" aria-label="Email" className="hover:text-foreground transition-colors"><Mail className="w-5 h-5" /></a>
          <a href="https://instagram.com" aria-label="Instagram" className="hover:text-foreground transition-colors"><Instagram className="w-5 h-5" /></a>
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
