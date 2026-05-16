import { useEffect, useRef } from 'react';
import videoAsset from '@/../public/villa-build.mp4.asset.json';

export default function VillaBuilder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const targetTimeRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let currentTime = 0;
    let lastApplied = -1;
    let intro = true;
    const INTRO_END = 1.8; // seconds — loop the "network" intro

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const duration = video.duration || 10;
      targetTimeRef.current = p * duration;
      // Once user scrolls past a small threshold, exit intro loop forever
      if (intro && p > 0.005) {
        intro = false;
        video.pause();
      }
    };

    const tick = () => {
      if (intro) {
        // Let the video play naturally and loop the intro segment
        if (video.readyState >= 2 && video.currentTime >= INTRO_END) {
          video.currentTime = 0;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (video.readyState >= 2) {
        const target = targetTimeRef.current;
        // Smooth ease toward target
        currentTime += (target - currentTime) * 0.18;
        // Only seek when diff is meaningful (~1 frame at 30fps = 0.033s)
        if (Math.abs(currentTime - lastApplied) > 0.033) {
          // fastSeek: skip to nearest keyframe, way smoother than currentTime
          if (typeof (video as any).fastSeek === 'function') {
            (video as any).fastSeek(currentTime);
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
      if (intro) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        currentTime = targetTimeRef.current;
        video.currentTime = currentTime;
        lastApplied = currentTime;
      }
    };

    video.addEventListener('loadedmetadata', onLoaded);
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('resize', readScroll);
    readScroll();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', readScroll);
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
