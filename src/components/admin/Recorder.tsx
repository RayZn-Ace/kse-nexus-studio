import { useEffect, useRef, useState } from "react";
import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Circle, Square, Sparkles, Play, Square as Stop, Upload, Loader2, Camera, Monitor } from "lucide-react";

type Shape = "circle" | "square" | "blob";
type BgMode = "transparent" | "blur" | "color" | "brand";
type Position = "br" | "bl" | "tr" | "tl";

const POS: Record<Position, string> = { br: "Unten Rechts", bl: "Unten Links", tr: "Oben Rechts", tl: "Oben Links" };

export function Recorder() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const offCamRef = useRef<HTMLCanvasElement | null>(null);

  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);

  const [shape, setShape] = useState<Shape>("circle");
  const [position, setPosition] = useState<Position>("br");
  const [bgMode, setBgMode] = useState<BgMode>("transparent");
  const [size, setSize] = useState(260);
  const [title, setTitle] = useState("");

  // Init MediaPipe segmenter
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        const seg = await ImageSegmenter.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
        if (!cancelled) segmenterRef.current = seg;
      } catch (e) {
        console.error("Segmenter init failed", e);
        toast.error("KI-Freistellung konnte nicht geladen werden");
      }
    })();
    return () => {
      cancelled = true;
      segmenterRef.current?.close();
    };
  }, []);

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setCamStream(s);
      const v = document.createElement("video");
      v.srcObject = s;
      v.muted = true;
      v.playsInline = true;
      await v.play();
      camVideoRef.current = v;
    } catch (e) {
      toast.error("Kamera-Zugriff verweigert");
    }
  };

  const startScreen = async () => {
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      setScreenStream(s);
      const v = document.createElement("video");
      v.srcObject = s;
      v.muted = true;
      v.playsInline = true;
      await v.play();
      screenVideoRef.current = v;
      s.getVideoTracks()[0].onended = () => stopAll();
    } catch (e) {
      toast.error("Bildschirmfreigabe abgebrochen");
    }
  };

  const stopAll = () => {
    if (recording) stopRecording();
    screenStream?.getTracks().forEach((t) => t.stop());
    camStream?.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    setCamStream(null);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  // Compose loop
  useEffect(() => {
    if (!screenStream || !camStream) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const off = (offCamRef.current ||= document.createElement("canvas"));
    const offCtx = off.getContext("2d", { willReadFrequently: true })!;

    const render = () => {
      const sv = screenVideoRef.current;
      const cv = camVideoRef.current;
      if (!sv || !cv) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      const sw = sv.videoWidth || 1920;
      const sh = sv.videoHeight || 1080;
      if (canvas.width !== sw) canvas.width = sw;
      if (canvas.height !== sh) canvas.height = sh;

      // Background = screen
      ctx.drawImage(sv, 0, 0, sw, sh);

      // Camera framing
      const cw = cv.videoWidth || 640;
      const ch = cv.videoHeight || 480;
      const camW = size * (sw / 1920);
      const camH = camW * (ch / cw);
      const margin = 40 * (sw / 1920);
      let x = sw - camW - margin;
      let y = sh - camH - margin;
      if (position === "bl") x = margin;
      if (position === "tr") y = margin;
      if (position === "tl") {
        x = margin;
        y = margin;
      }

      // Render cam to offscreen with segmentation
      off.width = cw;
      off.height = ch;

      const drawCamFrame = () => {
        if (bgMode === "transparent" && segmenterRef.current) {
          // mirror cam
          offCtx.save();
          offCtx.translate(cw, 0);
          offCtx.scale(-1, 1);
          offCtx.drawImage(cv, 0, 0, cw, ch);
          offCtx.restore();

          try {
            const result = segmenterRef.current.segmentForVideo(off, performance.now());
            const mask = result.categoryMask?.getAsUint8Array();
            if (mask) {
              const img = offCtx.getImageData(0, 0, cw, ch);
              for (let i = 0; i < mask.length; i++) {
                // category 0 = background in selfie segmenter
                if (mask[i] === 0) img.data[i * 4 + 3] = 0;
              }
              offCtx.putImageData(img, 0, 0);
            }
            result.close();
          } catch {}
        } else if (bgMode === "blur") {
          offCtx.save();
          offCtx.filter = "blur(20px)";
          offCtx.translate(cw, 0);
          offCtx.scale(-1, 1);
          offCtx.drawImage(cv, 0, 0, cw, ch);
          offCtx.restore();
          // Foreground person on top (segmented)
          if (segmenterRef.current) {
            const tmp = document.createElement("canvas");
            tmp.width = cw;
            tmp.height = ch;
            const tctx = tmp.getContext("2d")!;
            tctx.save();
            tctx.translate(cw, 0);
            tctx.scale(-1, 1);
            tctx.drawImage(cv, 0, 0, cw, ch);
            tctx.restore();
            try {
              const result = segmenterRef.current.segmentForVideo(tmp, performance.now());
              const mask = result.categoryMask?.getAsUint8Array();
              if (mask) {
                const img = tctx.getImageData(0, 0, cw, ch);
                for (let i = 0; i < mask.length; i++) {
                  if (mask[i] === 0) img.data[i * 4 + 3] = 0;
                }
                tctx.putImageData(img, 0, 0);
                offCtx.drawImage(tmp, 0, 0);
              }
              result.close();
            } catch {}
          }
        } else {
          // color / brand fill background, person on top
          const fill = bgMode === "brand" ? "#ff5722" : "#0a0a0a";
          offCtx.fillStyle = fill;
          offCtx.fillRect(0, 0, cw, ch);
          if (segmenterRef.current) {
            const tmp = document.createElement("canvas");
            tmp.width = cw;
            tmp.height = ch;
            const tctx = tmp.getContext("2d")!;
            tctx.save();
            tctx.translate(cw, 0);
            tctx.scale(-1, 1);
            tctx.drawImage(cv, 0, 0, cw, ch);
            tctx.restore();
            try {
              const result = segmenterRef.current.segmentForVideo(tmp, performance.now());
              const mask = result.categoryMask?.getAsUint8Array();
              if (mask) {
                const img = tctx.getImageData(0, 0, cw, ch);
                for (let i = 0; i < mask.length; i++) {
                  if (mask[i] === 0) img.data[i * 4 + 3] = 0;
                }
                tctx.putImageData(img, 0, 0);
                offCtx.drawImage(tmp, 0, 0);
              }
              result.close();
            } catch {}
          } else {
            offCtx.save();
            offCtx.translate(cw, 0);
            offCtx.scale(-1, 1);
            offCtx.drawImage(cv, 0, 0, cw, ch);
            offCtx.restore();
          }
        }
      };

      drawCamFrame();

      // Apply shape clip when drawing onto main canvas
      ctx.save();
      ctx.beginPath();
      if (shape === "circle") {
        ctx.ellipse(x + camW / 2, y + camH / 2, camW / 2, camH / 2, 0, 0, Math.PI * 2);
      } else if (shape === "square") {
        const r = 24 * (sw / 1920);
        roundRect(ctx, x, y, camW, camH, r);
      } else {
        // blob
        blobPath(ctx, x, y, camW, camH);
      }
      ctx.closePath();
      // soft shadow
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "rgba(0,0,0,0.001)";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.clip();
      ctx.drawImage(off, x, y, camW, camH);
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [screenStream, camStream, shape, position, bgMode, size]);

  const startRecording = () => {
    if (!canvasRef.current || !screenStream || !camStream) {
      toast.error("Bitte zuerst Kamera und Bildschirm starten");
      return;
    }
    const canvasStream = canvasRef.current.captureStream(30);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    const sysAudio = screenStream.getAudioTracks()[0];
    const micAudio = camStream.getAudioTracks()[0];
    if (sysAudio) tracks.push(sysAudio);
    if (micAudio) tracks.push(micAudio);
    const merged = new MediaStream(tracks);

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const rec = new MediaRecorder(merged, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setLastBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    };
    rec.start(1000);
    recorderRef.current = rec;
    setRecording(true);
    setDuration(0);
    const start = Date.now();
    const tick = setInterval(() => {
      if (rec.state !== "recording") return clearInterval(tick);
      setDuration(Math.floor((Date.now() - start) / 1000));
    }, 500);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const upload = async () => {
    if (!lastBlob || !user) return;
    if (!title.trim()) {
      toast.error("Bitte Titel angeben");
      return;
    }
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${slug(title)}.webm`;
      const { error: upErr } = await supabase.storage.from("tutorials").upload(path, lastBlob, {
        contentType: "video/webm",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("tutorials").insert({
        title: title.trim(),
        video_path: path,
        duration_seconds: duration || null,
        created_by: user.id,
      });
      if (insErr) throw insErr;
      toast.success("Tutorial gespeichert");
      setLastBlob(null);
      setPreviewUrl(null);
      setTitle("");
      window.dispatchEvent(new Event("tutorials:refresh"));
    } catch (e: any) {
      toast.error(e.message ?? "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const ready = screenStream && camStream;

  return (
    <section className="space-y-5">
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <div className="glass rounded-2xl overflow-hidden aspect-video relative bg-black/60">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {!ready && (
            <div className="absolute inset-0 grid place-items-center text-center px-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Starte zuerst Kamera & Bildschirm — dann erscheint hier die Live-Vorschau mit Maske.
                </p>
                <div className="flex justify-center gap-2">
                  <button onClick={startCam} className="text-xs px-3 py-2 rounded-lg bg-card hover:bg-card/80 border border-border inline-flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Kamera
                  </button>
                  <button onClick={startScreen} className="text-xs px-3 py-2 rounded-lg bg-card hover:bg-card/80 border border-border inline-flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" /> Bildschirm
                  </button>
                </div>
              </div>
            </div>
          )}
          {recording && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[11px] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC {formatTime(duration)}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5 space-y-5 text-sm">
          <Group label="Form">
            <div className="grid grid-cols-3 gap-1.5">
              <Pill active={shape === "circle"} onClick={() => setShape("circle")}><Circle className="w-3.5 h-3.5" />Rund</Pill>
              <Pill active={shape === "square"} onClick={() => setShape("square")}><Square className="w-3.5 h-3.5" />Eckig</Pill>
              <Pill active={shape === "blob"} onClick={() => setShape("blob")}><Sparkles className="w-3.5 h-3.5" />Blob</Pill>
            </div>
          </Group>
          <Group label="Position">
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(POS) as Position[]).map((p) => (
                <Pill key={p} active={position === p} onClick={() => setPosition(p)}>{POS[p]}</Pill>
              ))}
            </div>
          </Group>
          <Group label="Hintergrund">
            <div className="grid grid-cols-2 gap-1.5">
              <Pill active={bgMode === "transparent"} onClick={() => setBgMode("transparent")}>Freigestellt</Pill>
              <Pill active={bgMode === "blur"} onClick={() => setBgMode("blur")}>Blur</Pill>
              <Pill active={bgMode === "color"} onClick={() => setBgMode("color")}>Schwarz</Pill>
              <Pill active={bgMode === "brand"} onClick={() => setBgMode("brand")}>KSE Orange</Pill>
            </div>
          </Group>
          <Group label={`Größe (${size}px)`}>
            <input type="range" min={160} max={500} step={10} value={size} onChange={(e) => setSize(+e.target.value)}
              className="w-full accent-accent" />
          </Group>

          <div className="pt-2 border-t border-border space-y-2">
            {!recording ? (
              <button onClick={startRecording} disabled={!ready}
                className="w-full px-3 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-40">
                <Play className="w-3.5 h-3.5" /> Aufnahme starten
              </button>
            ) : (
              <button onClick={stopRecording}
                className="w-full px-3 py-2.5 rounded-lg bg-red-500 text-white font-medium text-xs inline-flex items-center justify-center gap-1.5">
                <Stop className="w-3.5 h-3.5" /> Stop
              </button>
            )}
            {(screenStream || camStream) && !recording && (
              <button onClick={stopAll} className="w-full px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground">
                Streams beenden
              </button>
            )}
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Vorschau & Speichern</h3>
          <video src={previewUrl} controls className="w-full rounded-lg max-h-[400px] bg-black" />
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel des Tutorials"
              className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm" />
            <button onClick={upload} disabled={uploading || !title.trim()}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              In Bibliothek speichern
            </button>
            <a href={previewUrl} download={`${slug(title || "tutorial")}.webm`}
              className="px-4 py-2 rounded-lg border border-border text-xs hover:bg-card">Download</a>
          </div>
        </div>
      )}
    </section>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-2 py-1.5 rounded-md text-[11px] inline-flex items-center justify-center gap-1 border transition-colors ${
        active ? "bg-accent text-accent-foreground border-accent" : "border-border bg-card/40 text-muted-foreground hover:text-foreground"
      }`}>{children}</button>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function blobPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  // Organic blob via bezier
  ctx.moveTo(cx, y);
  ctx.bezierCurveTo(cx + rx * 0.9, y, x + w, cy - ry * 0.6, x + w, cy);
  ctx.bezierCurveTo(x + w, cy + ry * 0.9, cx + rx * 0.6, y + h, cx, y + h);
  ctx.bezierCurveTo(cx - rx * 0.9, y + h, x, cy + ry * 0.6, x, cy);
  ctx.bezierCurveTo(x, cy - ry * 0.9, cx - rx * 0.6, y, cx, y);
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "tutorial";
}