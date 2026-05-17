import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function MobileAnimationFallback() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(MOBILE_QUERY);
    const elements = () => Array.from(document.querySelectorAll<HTMLElement>("[data-mobile-reveal]"));

    const revealNow = () => {
      elements().forEach((el) => el.classList.add("is-visible"));
    };

    const revealVisible = () => {
      if (!media.matches) {
        revealNow();
        return;
      }

      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      elements().forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < viewportH * 0.92 && rect.bottom > viewportH * -0.12) {
          el.classList.add("is-visible");
        }
      });
    };

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          });
        },
        { root: null, threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
      );
      elements().forEach((el) => observer?.observe(el));
    }

    const onScrollOrResize = () => requestAnimationFrame(revealVisible);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("orientationchange", onScrollOrResize);

    requestAnimationFrame(revealVisible);
    const safety = window.setTimeout(revealVisible, 450);

    return () => {
      observer?.disconnect();
      window.clearTimeout(safety);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("orientationchange", onScrollOrResize);
    };
  }, []);

  return null;
}