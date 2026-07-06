import { useEffect, useState } from "react";

const PHONE = "4915757971457";
const MESSAGE = "Hi KSE Group! Ich hätte Interesse an einem Projekt.";

export function WhatsAppButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(t);
  }, []);

  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Kontakt via WhatsApp"
      className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[70] grid place-items-center h-14 w-14 md:h-16 md:w-16 rounded-full bg-[#25D366] border-4 border-[#0a0a0a] shadow-[6px_6px_0_#0a0a0a] hover:shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-150 ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      style={{ transitionProperty: "transform, box-shadow, opacity" }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 md:h-8 md:w-8 text-white" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 01-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 01-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.907 2.717.907.517 0 1.032-.13 1.462-.402.63-.4 1.055-.986 1.16-1.72 0-.014.014-.017.014-.03 0-.402-.616-.616-.906-.746-.216-.115-1.63-.86-1.803-.86zM16.1 3.001C9.435 3 4 8.435 4 15.1c0 2.35.688 4.575 1.877 6.505L4.1 27.5c-.086.286.043.601.315.744.115.058.244.086.373.086.086 0 .186-.014.272-.043l6.086-1.977c1.85 1.017 3.95 1.59 6.1 1.59 6.664 0 12.1-5.434 12.1-12.1S22.764 3 16.1 3zm0 21.87c-1.977 0-3.926-.53-5.618-1.548a.72.72 0 00-.372-.1c-.086 0-.158.014-.244.043l-4.55 1.474 1.5-4.44a.68.68 0 00-.086-.63A9.807 9.807 0 015.463 15.1c0-5.877 4.775-10.65 10.652-10.65 5.878 0 10.652 4.773 10.652 10.65s-4.775 10.77-10.667 10.77z" />
      </svg>
    </a>
  );
}