import { useEffect, useRef } from 'react';
import videoAsset from '@/../public/villa-build.mp4.asset.json';

export default function VillaBuilder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const targetTimeRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const duration = video.duration || 10;
      targetTimeRef.current = p * duration;
    };

    const tick = () => {
      if (video.readyState >= 2) {
        const current = video.currentTime;
        const target = targetTimeRef.current;
        // Smooth lerp toward target time
        const next = current + (target - current) * 0.12;
        if (Math.abs(target - current) > 0.005) {
          try {
            video.currentTime = next;
          } catch {}
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const onLoaded = () => {
      onScroll();
      video.currentTime = targetTimeRef.current;
    };

    video.addEventListener('loadedmetadata', onLoaded);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      video.removeEventListener('loadedmetadata', onLoaded);
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
