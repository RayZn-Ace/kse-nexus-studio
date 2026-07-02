import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

const STATEMENT = "Fange niemals an aufzuhören.";
const WORDS = STATEMENT.split(" ");
const COLOR: Record<string, string> = {
  niemals: "#ff4d5e",
  "aufzuhören.": "#a855f7",
};

/**
 * Pinned statement scene. Wrapper is 300vh tall; the inner block is CSS-sticky
 * (top:0, h-screen) so it stays in view while the user scrolls the wrapper's
 * range. Each word "ignites" one after another (opacity via scroll-scrub),
 * then the whole block scales up and fades out before release.
 */
export function Manifest() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });

  const blockScale = useTransform(scrollYProgress, [0.65, 1], [1, 1.08]);
  const blockOpacity = useTransform(scrollYProgress, [0.65, 1], [1, 0]);

  if (reduced) {
    return (
      <section className="relative px-6 md:px-12 lg:px-20 py-32 md:py-48">
        <div className="max-w-5xl mx-auto text-center">
          <span className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-6">
            / Manifest
          </span>
          <h2
            className="font-black leading-[0.9] mx-auto max-w-[14ch]"
            style={{ fontSize: "clamp(3rem, 11vw, 10rem)", letterSpacing: "-0.05em" }}
          >
            {WORDS.map((w, i) => (
              <span key={i} style={{ color: COLOR[w] }}>
                {w}
                {i < WORDS.length - 1 ? " " : ""}
              </span>
            ))}
          </h2>
        </div>
      </section>
    );
  }

  return (
    <section ref={wrapperRef} className="relative" style={{ height: "220vh" }}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center px-6 md:px-12 lg:px-20">
        <motion.div
          className="text-center"
          style={{ scale: blockScale, opacity: blockOpacity }}
        >
          <span className="block text-[10px] uppercase tracking-[0.4em] text-white/40 mb-6">
            / Manifest
          </span>
          <h2
            className="font-black leading-[0.9] mx-auto max-w-[14ch]"
            style={{ fontSize: "clamp(3rem, 11vw, 10rem)", letterSpacing: "-0.05em" }}
          >
            {WORDS.map((w, i) => (
              <Word key={i} word={w} index={i} total={WORDS.length} progress={scrollYProgress} />
            ))}
          </h2>
        </motion.div>
      </div>
    </section>
  );
}

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const start = (index / total) * 0.65;
  const end = ((index + 1) / total) * 0.65;
  const opacity = useTransform(progress, [start, end], [0.15, 1]);
  return (
    <>
      <motion.span style={{ opacity, color: COLOR[word] }} className="inline-block">
        {word}
      </motion.span>
      {index < total - 1 ? " " : ""}
    </>
  );
}