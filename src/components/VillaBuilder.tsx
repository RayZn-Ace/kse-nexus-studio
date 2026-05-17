import { useEffect, useRef, useState } from 'react';
import videoAsset from '@/../public/villa-build.mp4.asset.json';

export default function VillaBuilder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const targetTimeRef = useRef(0);
  const targetProgressRef = useRef(0);
  const [introOpacity, setIntroOpacity] = useState(1);
  const [useFrameSequence, setUseFrameSequence] = useState<boolean | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    video.pause();
    let currentTime = 0;
    let currentFrame = 0;
    let lastApplied = -1;
    let seeking = false;
    let primed = false;
    let frameSequence = window.matchMedia('(pointer: coarse), (max-width: 767px)').matches;
    setUseFrameSequence(frameSequence);
    const frameCount = 241;
    const frames: Array<HTMLImageElement | undefined> = [];
    const loadedFrames = new Set<number>();
    const queuedFrames = new Set<number>();
    const frameQueue: number[] = [];
    let loadingFrames = 0;
    let idleLoader = 0;
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);

    const frameUrl = (index: number) =>
      `/villa-frames/frame-${String(index + 1).padStart(3, '0')}.jpg`;

    const pumpFrameQueue = () => {
      while (loadingFrames < 4 && frameQueue.length > 0) {
        const index = frameQueue.shift();
        if (index === undefined || frames[index]) continue;
        queuedFrames.delete(index);
        loadingFrames += 1;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          loadedFrames.add(index);
          loadingFrames -= 1;
          pumpFrameQueue();
        };
        img.onerror = () => {
          loadingFrames -= 1;
          pumpFrameQueue();
        };
        img.src = frameUrl(index);
        frames[index] = img;
      }
    };

    const loadFrame = (index: number, priority = false) => {
      if (!frameSequence || index < 0 || index >= frameCount || frames[index] || queuedFrames.has(index)) return;
      queuedFrames.add(index);
      if (priority) frameQueue.unshift(index);
      else frameQueue.push(index);
      pumpFrameQueue();
    };

    const warmFrames = () => {
      for (let i = 0; i < frameCount; i += 10) loadFrame(i, true);
      let index = 1;
      const loadNext = () => {
        while (index < frameCount && frames[index]) index += 1;
        if (index >= frameCount) return;
        loadFrame(index);
        index += 1;
        idleLoader = window.setTimeout(loadNext, 28);
      };
      idleLoader = window.setTimeout(loadNext, 180);
    };

    const decodeFrame = (index: number) => {
      const img = frames[index];
      if (!img || loadedFrames.has(index) || typeof img.decode !== 'function') return;
      img.decode().then(() => loadedFrames.add(index)).catch(() => {});
    };

    const nearestLoadedFrame = (index: number) => {
      if (loadedFrames.has(index)) return index;
      for (let offset = 1; offset < 14; offset += 1) {
        const before = index - offset;
        const after = index + offset;
        if (after < frameCount && loadedFrames.has(after)) return after;
        if (before >= 0 && loadedFrames.has(before)) return before;
      }
      return loadedFrames.has(0) ? 0 : -1;
    };

    const drawFrame = (index: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(window.innerWidth * dpr));
      const height = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext('2d');
      const img = frames[index];
      if (!ctx || !img || !loadedFrames.has(index)) return;

      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const drawWidth = img.naturalWidth * scale;
      const drawHeight = img.naturalHeight * scale;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    };

    if (frameSequence) {
      loadFrame(0, true);
      warmFrames();
    }

    // iOS Safari quirk: a muted/playsInline video will not honor
    // currentTime assignments reliably until it has been "played" once
    // inside a user gesture. We prime it on the first touch/click.
    const prime = () => {
      if (primed) return;
      primed = true;
      video.muted = true;
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => video.pause()).catch(() => {});
      } else {
        video.pause();
      }
    };
    window.addEventListener('touchstart', prime, { passive: true, once: true });
    window.addEventListener('click', prime, { once: true });

    // Force load on mount — iOS often ignores preload="auto".
    try { video.load(); } catch {}

    // On iOS, seeking is asynchronous: setting currentTime while a previous
    // seek hasn't completed causes the pipeline to stall. We mark `seeking`
    // and only issue the next seek after `seeked` fires.
    const onSeeking = () => { seeking = true; };
    const onSeeked = () => { seeking = false; };
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('seeked', onSeeked);

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const duration = video.duration || 10;
      targetProgressRef.current = p;
      targetTimeRef.current = p * duration;
      // Fade the electric overlay out across the first ~5% of scroll
      const op = Math.max(0, 1 - p / 0.05);
      setIntroOpacity(op);
    };

    const tick = () => {
      if (frameSequence) {
        const targetFrame = targetProgressRef.current * (frameCount - 1);
        currentFrame += (targetFrame - currentFrame) * 0.22;
        const wantedFrame = Math.max(0, Math.min(frameCount - 1, Math.round(currentFrame)));
        for (let i = -4; i <= 6; i += 1) {
          const nearby = wantedFrame + i;
          if (nearby >= 0 && nearby < frameCount) loadFrame(nearby, Math.abs(i) <= 2);
        }
        const frameToDraw = nearestLoadedFrame(wantedFrame);
        if (frameToDraw >= 0) {
          decodeFrame(frameToDraw);
          drawFrame(frameToDraw);
        }
      } else if (video.readyState >= 2) {
        const target = targetTimeRef.current;
        // Smooth interpolation toward the scroll target.
        currentTime += (target - currentTime) * (isIOS ? 0.22 : 0.18);
        const threshold = isIOS ? 0.05 : 0.033;
        if (!seeking && Math.abs(currentTime - lastApplied) > threshold) {
          // Always use currentTime (NOT fastSeek): fastSeek snaps to the
          // nearest keyframe, which on iOS makes reverse scrolling look
          // like the animation "resets" because it jumps back to a sparse
          // keyframe instead of the exact frame.
          try {
            video.currentTime = currentTime;
            lastApplied = currentTime;
          } catch {}
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const onLoaded = () => {
      readScroll();
      currentTime = targetTimeRef.current;
      currentFrame = targetProgressRef.current * (frameCount - 1);
      video.currentTime = currentTime;
      lastApplied = currentTime;
    };

    const onMediaChange = (event: MediaQueryListEvent) => {
      frameSequence = event.matches;
      setUseFrameSequence(event.matches);
      if (event.matches) {
        loadFrame(Math.round(targetProgressRef.current * (frameCount - 1)), true);
        warmFrames();
      } else {
        window.clearTimeout(idleLoader);
      }
    };

    const mediaQuery = window.matchMedia('(pointer: coarse), (max-width: 767px)');
    mediaQuery.addEventListener('change', onMediaChange);

    video.addEventListener('loadedmetadata', onLoaded);
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);
    readScroll();
    currentFrame = targetProgressRef.current * (frameCount - 1);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(idleLoader);
      mediaQuery.removeEventListener('change', onMediaChange);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('seeked', onSeeked);
      window.removeEventListener('touchstart', prime);
      window.removeEventListener('click', prime);
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
        src={useFrameSequence === false ? videoAsset.url : undefined}
        muted
        playsInline
        {...({ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' } as Record<string, string>)}
        disableRemotePlayback
        disablePictureInPicture
        crossOrigin="anonymous"
        preload={useFrameSequence === false ? 'auto' : 'none'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: useFrameSequence === false ? 0.85 : 0,
          visibility: useFrameSequence === false ? 'visible' : 'hidden',
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: useFrameSequence === true ? 0.85 : 0,
          visibility: useFrameSequence === true ? 'visible' : 'hidden',
        }}
      />

      {/* Electric current overlay — only visible at the start, fades on scroll */}
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: introOpacity,
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
