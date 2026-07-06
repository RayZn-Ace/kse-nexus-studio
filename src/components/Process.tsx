import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MaskedLines } from "@/components/Sections";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    n: "01",
    title: "Erstgespräch",
    body:
      "Unverbindlich, 30 Minuten. Wir hören zu und sagen ehrlich, ob und wie wir helfen können.",
  },
  {
    n: "02",
    title: "Konzept & Fahrplan",
    body:
      "Du bekommst einen klaren Plan mit Timeline und Festpreis — keine versteckten Kosten.",
  },
  {
    n: "03",
    title: "Umsetzung & Betreuung",
    body:
      "Wir liefern, messen und optimieren. Du wirst nie im Unklaren gelassen.",
  },
];

export function Process() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const targets = ref.current.querySelectorAll<HTMLElement>("[data-reveal]");
    const ctx = gsap.context(() => {
      targets.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            delay: i * 0.05,
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          },
        );
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="relative px-6 md:px-12 lg:px-20 py-32 md:py-48">
      <div className="max-w-7xl mx-auto">
        <span
          data-reveal
          className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-6"
        >
          / 05 — Ablauf
        </span>
        <h2
          className="font-black leading-[0.9] mb-20"
          style={{ fontSize: "clamp(2rem, 7vw, 6rem)", letterSpacing: "-0.04em" }}
        >
          <MaskedLines lines={[{ text: "Von Anfrage bis Ergebnis." }]} />
        </h2>

        <ol className="flex flex-col">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              data-reveal
              className={`grid grid-cols-12 gap-6 md:gap-12 py-10 md:py-14 ${
                i > 0 ? "border-t border-white/10" : ""
              }`}
            >
              <div className="col-span-12 md:col-span-3">
                <span
                  className="block font-black leading-[0.9]"
                  style={{
                    fontSize: "clamp(3rem, 8vw, 6rem)",
                    letterSpacing: "-0.03em",
                    color: "transparent",
                    WebkitTextStroke: "1px rgba(255,255,255,0.25)",
                  }}
                >
                  {s.n}
                </span>
              </div>
              <div className="col-span-12 md:col-span-9 md:pt-4">
                <h3
                  className="font-black text-2xl md:text-4xl mb-4"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  {s.title}
                </h3>
                <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-32">
          <blockquote
            className="max-w-4xl mx-auto text-center font-medium leading-snug"
            style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.75rem)", letterSpacing: "-0.02em" }}
          >
            <MaskedLines
              lines={[
                {
                  text:
                    "„KSE hat unsere Erwartungen nicht erfüllt — sie hat sie neu definiert.“",
                },
              ]}
            />
          </blockquote>
          <div
            data-reveal
            className="mt-8 text-center text-[10px] uppercase tracking-[0.4em] text-white/40"
          >
            — Name, Position, Unternehmen (PLATZHALTER)
          </div>
        </div>
      </div>
    </section>
  );
}