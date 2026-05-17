import { useEffect, useRef } from "react";
import videoAsset from "@/../public/villa-build.mp4.asset.json";

export default function VillaBuilder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number>(0);
  const targetTimeRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const isMobileSafariSafeMode = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isMobileSafariSafeMode || reduceMotion) {
      video.removeAttribute("src");
      video.load();
      return;
    }

    video.pause();
    let currentTime = 0;
    let lastApplied = -1;

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const duration = video.duration || 10;
      targetTimeRef.current = p * duration;
      // Fade the electric overlay out across the first ~5% of scroll
      const op = Math.max(0, 1 - p / 0.05);
      if (overlayRef.current) overlayRef.current.style.opacity = String(op);
    };

    const tick = () => {
      if (video.readyState >= 2) {
        const target = targetTimeRef.current;
        currentTime += (target - currentTime) * 0.18;
        if (Math.abs(currentTime - lastApplied) > 0.033) {
          if (typeof (video as HTMLVideoElement & { fastSeek?: (time: number) => void }).fastSeek === "function") {
            (video as HTMLVideoElement & { fastSeek: (time: number) => void }).fastSeek(currentTime);
          } else {
            video.currentTime = currentTime;
          }
          lastApplied = currentTime;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const onLoaded = () => {
      readScroll();
      currentTime = targetTimeRef.current;
      video.currentTime = currentTime;
      lastApplied = currentTime;
    };

    video.addEventListener("loadedmetadata", onLoaded);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    readScroll();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      video.removeEventListener("loadedmetadata", onLoaded);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <video
        ref={videoRef}
        src={videoAsset.url}
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.85,
        }}
      />

      {/* Electric current overlay — only visible at the start, fades on scroll */}
      <svg
        ref={overlayRef}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 1,
          transition: 'opacity 0.2s linear',
          mixBlendMode: 'screen',
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Several electric paths zipping across — staggered */}
        {[
          { d: 'M-50,180 Q200,140 380,230 T780,200 T1100,260', dur: 2.2, delay: 0 },
          { d: 'M-50,360 Q220,420 420,340 T820,400 T1100,330', dur: 2.6, delay: 0.4 },
          { d: 'M-50,480 Q260,520 460,440 T880,510 T1100,470', dur: 3.1, delay: 0.9 },
          { d: 'M-50,90  Q180,40  360,140 T760,80  T1100,140', dur: 2.4, delay: 1.3 },
          { d: 'M-50,540 Q240,470 440,560 T840,500 T1100,560', dur: 2.8, delay: 1.7 },
        ].map((p, i) => (
          <g key={i} filter="url(#glow)">
            {/* faint base trace */}
            <path
              d={p.d}
              fill="none"
              stroke="#e8ff00"
              strokeOpacity="0.18"
              strokeWidth="1.2"
            />
            {/* travelling electric pulse */}
            <path
              d={p.d}
              fill="none"
              stroke="#e8ff00"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="60 1800"
              strokeDashoffset="1860"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="1860"
                to="0"
                dur={`${p.dur}s`}
                begin={`${p.delay}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        ))}
        {/* glowing nodes pulsing */}
        {[
          [220, 180], [520, 230], [780, 200],
          [180, 360], [580, 340], [820, 400],
          [320, 90], [680, 140],
          [400, 540], [760, 510],
        ].map(([cx, cy], i) => (
          <circle
            key={`n-${i}`}
            cx={cx}
            cy={cy}
            r="3"
            fill="#e8ff00"
            filter="url(#glow)"
          >
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur={`${1.6 + (i % 4) * 0.4}s`}
              repeatCount="indefinite"
              begin={`${(i * 0.13) % 1.5}s`}
            />
          </circle>
        ))}
      </svg>

      {/* subtle dark overlay so foreground text stays readable */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.7) 100%)',
        }}
      />
    </div>
  );
}
