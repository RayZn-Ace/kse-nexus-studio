import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path) return new Response("Not found", { status: 404 });
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const ext = path.split(".").pop()?.toLowerCase() ?? "";
        const types: Record<string, string> = {
          png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
          gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
          avif: "image/avif", ico: "image/x-icon", pdf: "application/pdf",
          mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg",
        };
        const contentType = (data as Blob).type || types[ext] || "application/octet-stream";
        return new Response(data, {
          status: 200,
          headers: {
            "content-type": contentType,
            "cache-control": "public, max-age=31536000, immutable",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});