import { useEffect, useMemo, useRef, useState } from "react";
import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Circle, Square, Sparkles, Play, Square as Stop, Upload, Loader2,
  Camera, Monitor, Mic, RefreshCw,
} from "lucide-react";
import bgNeonStudio from "@/assets/recorder-bg-neon-studio.jpg";
import bgNeonLoft from "@/assets/recorder-bg-neon-loft.jpg";
import bgNeonPodcast from "@/assets/recorder-bg-neon-podcast.jpg";
import bgNeonLounge from "@/assets/recorder-bg-neon-lounge.jpg";

type Shape = "circle" | "square" | "blob";
type BgKey =
  | "transparent" | "blur"
  | "ember" | "grid" | "mesh" | "wall"
  | "studio" | "loft" | "podcast" | "lounge";
type Position = "br" | "bl" | "tr" | "tl";
type Mp4Recording = { stop: () => Promise<Blob> };

const POS: Record<Position, string> = { br: "Unten Rechts", bl: "Unten Links", tr: "Oben Rechts", tl: "Oben Links" };

const BG_LABELS: Record<BgKey, string> = {
  transparent: "Freigestellt",
  blur: "Blur",
  ember: "KSE Ember",
  grid: "Dark Grid",
  mesh: "Gradient Mesh",
  wall: "Logo Wall",
  studio: "Neon Studio",
  loft: "Neon Loft",
  podcast: "Neon Podcast",
  lounge: "Neon Lounge",
};

const PHOTO_BGS: Partial<Record<BgKey, string>> = {
  studio: bgNeonStudio,
  loft: bgNeonLoft,
  podcast: bgNeonPodcast,
  lounge: bgNeonLounge,
};

const photoImageCache: Record<string, HTMLImageElement> = {};
function loadPhoto(src: string) {
  if (photoImageCache[src]) return photoImageCache[src];
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  photoImageCache[src] = img;
  return img;
}

export function Recorder() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mp4RecordingRef = useRef<Mp4Recording | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const tickWorkerRef = useRef<Worker | null>(null);

  // Reusable offscreen canvases
  const camCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const personCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCacheRef = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(null);
  // Mask pipeline canvases
  const maskRawCanvasRef = useRef<HTMLCanvasElement | null>(null);   // raw per-frame mask
  const maskSmoothCanvasRef = useRef<HTMLCanvasElement | null>(null); // temporally smoothed
  const maskSoftCanvasRef = useRef<HTMLCanvasElement | null>(null);   // blurred for soft edge
  const lastMaskTsRef = useRef(0);

  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);

  const [shape, setShape] = useState<Shape>("circle");
  const [position, setPosition] = useState<Position>("br");
  const [bg, setBg] = useState<BgKey>("transparent");
  const [size, setSize] = useState(260);
  const [title, setTitle] = useState("");

  // Devices
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoId, setVideoId] = useState<string>("");
  const [audioId, setAudioId] = useState<string>("");

  const refreshDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(list.filter((d) => d.kind === "videoinput"));
      setAudioDevices(list.filter((d) => d.kind === "audioinput"));
    } catch {}
  };

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
  }, []);

  // Init segmenter
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

  const stopCam = () => {
    camStream?.getTracks().forEach((t) => t.stop());
    setCamStream(null);
    camVideoRef.current = null;
  };

  const startCam = async (vId?: string, aId?: string) => {
    try {
      stopCam();
      const constraints: MediaStreamConstraints = {
        video: {
          width: 640,
          height: 480,
          deviceId: vId ? { exact: vId } : undefined,
        },
        audio: {
          deviceId: aId ? { exact: aId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
        },
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setCamStream(s);
      const v = document.createElement("video");
      v.srcObject = s;
      v.muted = true;
      v.playsInline = true;
      await v.play();
      camVideoRef.current = v;
      // Pull device IDs after permission so labels are populated
      const vt = s.getVideoTracks()[0]?.getSettings().deviceId ?? "";
      const at = s.getAudioTracks()[0]?.getSettings().deviceId ?? "";
      if (vt && !videoId) setVideoId(vt);
      if (at && !audioId) setAudioId(at);
      refreshDevices();
    } catch (e) {
      console.error(e);
      toast.error("Kamera/Mikro-Zugriff verweigert");
    }
  };

  // Switch when dropdown changes (only if cam already running)
  useEffect(() => {
    if (camStream && (videoId || audioId)) {
      startCam(videoId, audioId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, audioId]);

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
    } catch {
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

  // Render loop
  useEffect(() => {
    if (!screenStream || !camStream) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const camC = (camCanvasRef.current ||= document.createElement("canvas"));
    const personC = (personCanvasRef.current ||= document.createElement("canvas"));
    const bgC = (bgCanvasRef.current ||= document.createElement("canvas"));
    const maskRaw = (maskRawCanvasRef.current ||= document.createElement("canvas"));
    const maskSmooth = (maskSmoothCanvasRef.current ||= document.createElement("canvas"));
    const maskSoft = (maskSoftCanvasRef.current ||= document.createElement("canvas"));
    const camCtx = camC.getContext("2d")!;
    const personCtx = personC.getContext("2d")!;
    const maskRawCtx = maskRaw.getContext("2d", { willReadFrequently: true })!;
    const maskSmoothCtx = maskSmooth.getContext("2d")!;
    const maskSoftCtx = maskSoft.getContext("2d")!;
    let smoothInitialized = false;

    const render = () => {
      const sv = screenVideoRef.current;
      const cv = camVideoRef.current;
      if (!sv || !cv || cv.videoWidth === 0) {
        return;
      }
      const sw = sv.videoWidth || 1920;
      const sh = sv.videoHeight || 1080;
      if (canvas.width !== sw) canvas.width = sw;
      if (canvas.height !== sh) canvas.height = sh;

      // Screen as background
      ctx.drawImage(sv, 0, 0, sw, sh);

      // Cam framing
      const cw = cv.videoWidth || 640;
      const ch = cv.videoHeight || 480;
      if (camC.width !== cw || camC.height !== ch) {
        camC.width = cw; camC.height = ch;
        personC.width = cw; personC.height = ch;
        maskRaw.width = cw; maskRaw.height = ch;
        maskSmooth.width = cw; maskSmooth.height = ch;
        maskSoft.width = cw; maskSoft.height = ch;
        smoothInitialized = false;
      }

      // Mirror cam onto camC
      camCtx.save();
      camCtx.translate(cw, 0);
      camCtx.scale(-1, 1);
      camCtx.drawImage(cv, 0, 0, cw, ch);
      camCtx.restore();

      // ── Get person mask (throttled to ~30 fps to avoid jitter on fast frames)
      let haveMask = false;
      if (segmenterRef.current) {
        const now = performance.now();
        if (now - lastMaskTsRef.current >= 50) {
          lastMaskTsRef.current = now;
          try {
            const result = segmenterRef.current.segmentForVideo(camC, now);
            const cat = result.categoryMask?.getAsUint8Array();
            if (cat && cat.length === cw * ch) {
              // Build raw alpha mask: person → 255, bg → 0
              const id = maskRawCtx.createImageData(cw, ch);
              const d = id.data;
              for (let i = 0; i < cat.length; i++) {
                const a = cat[i] === 0 ? 255 : 0;
                const j = i * 4;
                d[j] = 255; d[j + 1] = 255; d[j + 2] = 255; d[j + 3] = a;
              }
              maskRawCtx.putImageData(id, 0, 0);
              haveMask = true;
            }
            result.close();
          } catch {}
        } else {
          haveMask = smoothInitialized;
        }
      }

      // ── Light temporal smoothing without trails:
      // Replace the smoothed mask each frame, then blend a small amount of the
      // previous mask in. This keeps edges stable but never leaves ghost trails.
      if (haveMask) {
        if (!smoothInitialized) {
          maskSmoothCtx.globalCompositeOperation = "source-over";
          maskSmoothCtx.globalAlpha = 1;
          maskSmoothCtx.clearRect(0, 0, cw, ch);
          maskSmoothCtx.drawImage(maskRaw, 0, 0);
          smoothInitialized = true;
        } else {
          // 1. Snapshot previous smoothed mask
          maskSoftCtx.globalCompositeOperation = "source-over";
          maskSoftCtx.globalAlpha = 1;
          maskSoftCtx.filter = "none";
          maskSoftCtx.clearRect(0, 0, cw, ch);
          maskSoftCtx.drawImage(maskSmooth, 0, 0);
          // 2. Reset smoothed to current raw mask
          maskSmoothCtx.globalCompositeOperation = "source-over";
          maskSmoothCtx.globalAlpha = 1;
          maskSmoothCtx.clearRect(0, 0, cw, ch);
          maskSmoothCtx.drawImage(maskRaw, 0, 0);
          // 3. Blend a small amount of previous on top to dampen jitter
          maskSmoothCtx.globalAlpha = 0.25;
          maskSmoothCtx.drawImage(maskSoft, 0, 0);
          maskSmoothCtx.globalAlpha = 1;
        }

        // Soft edge: blur the smoothed mask
        maskSoftCtx.save();
        maskSoftCtx.globalCompositeOperation = "source-over";
        maskSoftCtx.globalAlpha = 1;
        maskSoftCtx.clearRect(0, 0, cw, ch);
        maskSoftCtx.filter = "blur(2px)";
        maskSoftCtx.drawImage(maskSmooth, 0, 0);
        maskSoftCtx.restore();
      }

      // ── Build personC = camC clipped to mask via destination-in (no per-pixel JS)
      personCtx.save();
      personCtx.globalCompositeOperation = "source-over";
      personCtx.clearRect(0, 0, cw, ch);
      personCtx.drawImage(camC, 0, 0);
      if (smoothInitialized) {
        personCtx.globalCompositeOperation = "destination-in";
        personCtx.drawImage(maskSoft, 0, 0);
      }
      personCtx.restore();
      const mask = smoothInitialized; // truthy flag for downstream branches

      // Build the cam tile (background + person) into camC
      camCtx.clearRect(0, 0, cw, ch);
      if (bg === "transparent") {
        if (mask) {
          camCtx.drawImage(personC, 0, 0);
        } else {
          // fallback: original cam if no mask
          camCtx.save();
          camCtx.translate(cw, 0);
          camCtx.scale(-1, 1);
          camCtx.drawImage(cv, 0, 0, cw, ch);
          camCtx.restore();
        }
      } else if (bg === "blur") {
        // Blurred cam as bg, sharp person on top
        camCtx.save();
        camCtx.filter = "blur(18px) brightness(0.85)";
        camCtx.translate(cw, 0);
        camCtx.scale(-1, 1);
        camCtx.drawImage(cv, 0, 0, cw, ch);
        camCtx.restore();
        camCtx.filter = "none";
        if (mask) camCtx.drawImage(personC, 0, 0);
      } else {
        const cache = bgCacheRef.current;
        const key = `${bg}:${cw}x${ch}`;
        let bgCanvas = cache?.key === key ? cache.canvas : null;
        const photoSrc = PHOTO_BGS[bg];
        if (photoSrc) {
          const img = loadPhoto(photoSrc);
          if (img.complete && img.naturalWidth > 0) {
            if (!bgCanvas) {
              bgC.width = cw; bgC.height = ch;
              drawCover(bgC.getContext("2d")!, img, cw, ch);
              bgCanvas = bgC;
              bgCacheRef.current = { key, canvas: bgC };
            }
            camCtx.drawImage(bgCanvas, 0, 0);
          } else {
            camCtx.fillStyle = "#0a0a0a";
            camCtx.fillRect(0, 0, cw, ch);
          }
        } else {
          if (!bgCanvas) {
            bgC.width = cw; bgC.height = ch;
            drawBrandBg(bgC, bg);
            bgCanvas = bgC;
            bgCacheRef.current = { key, canvas: bgC };
          }
          camCtx.drawImage(bgCanvas, 0, 0);
        }
        if (mask) camCtx.drawImage(personC, 0, 0);
      }

      // Place onto main canvas with shape clip
      const camW = size * (sw / 1920);
      const camH = camW * (ch / cw);
      const margin = 40 * (sw / 1920);
      let x = sw - camW - margin;
      let y = sh - camH - margin;
      if (position === "bl") x = margin;
      if (position === "tr") y = margin;
      if (position === "tl") { x = margin; y = margin; }

      ctx.save();
      // Drop shadow
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      ctx.beginPath();
      if (shape === "circle") {
        ctx.ellipse(x + camW / 2, y + camH / 2, camW / 2, camH / 2, 0, 0, Math.PI * 2);
      } else if (shape === "square") {
        roundRect(ctx, x, y, camW, camH, 24 * (sw / 1920));
      } else {
        blobPath(ctx, x, y, camW, camH);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0.001)";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.clip();
      ctx.drawImage(camC, x, y, camW, camH);
      ctx.restore();
    };

    // Drive the render loop from a Web Worker setInterval so it keeps
    // running even when the tab is in the background (rAF freezes there,
    // which would stall canvas.captureStream and "hang" the recording).
    // ~60fps tick so screen capture stays smooth during scrolling / video
    // playback. Segmentation is independently throttled below to ~20fps.
    const workerSrc = `let id=null;onmessage=(e)=>{if(e.data==='start'){clearInterval(id);id=setInterval(()=>postMessage(0),16);}else{clearInterval(id);id=null;}};`;
    const blob = new Blob([workerSrc], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    tickWorkerRef.current = worker;
    worker.onmessage = () => render();
    worker.postMessage("start");
    // also kick once synchronously
    render();
    return () => {
      worker.postMessage("stop");
      worker.terminate();
      URL.revokeObjectURL(url);
      tickWorkerRef.current = null;
    };
  }, [screenStream, camStream, shape, position, bg, size]);

  // Reset bg cache when bg type changes
  useEffect(() => { bgCacheRef.current = null; }, [bg]);

  const startRecording = () => {
    if (!canvasRef.current || !screenStream || !camStream) {
      toast.error("Bitte zuerst Kamera und Bildschirm starten");
      return;
    }
    const canvasStream = canvasRef.current.captureStream(60);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    const sysAudio = screenStream.getAudioTracks()[0];
    const micAudio = camStream.getAudioTracks()[0];

    // Mix system audio + mic into ONE track via WebAudio.
    // MediaRecorder reliably encodes only the first audio track in many
    // browsers, so adding both separately causes silent recordings.
    if (sysAudio || micAudio) {
      try {
        const AC: typeof AudioContext =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const ac = new AC();
        audioCtxRef.current = ac;
        const dest = ac.createMediaStreamDestination();
        if (sysAudio) {
          ac.createMediaStreamSource(new MediaStream([sysAudio])).connect(dest);
        }
        if (micAudio) {
          const micSrc = ac.createMediaStreamSource(new MediaStream([micAudio]));
          const gain = ac.createGain();
          gain.gain.value = 1.0;
          micSrc.connect(gain).connect(dest);
        }
        const mixed = dest.stream.getAudioTracks()[0];
        if (mixed) tracks.push(mixed);
      } catch (e) {
        console.warn("Audio-Mixing fehlgeschlagen, fallback:", e);
        if (micAudio) tracks.push(micAudio);
        else if (sysAudio) tracks.push(sysAudio);
      }
    }
    const merged = new MediaStream(tracks);

    // Prefer MP4 (H.264 + AAC) so downloads / shares play everywhere
    // (QuickTime, iOS, WhatsApp, …). Fall back to WebM if the browser
    // can't encode MP4 directly.
    const mp4Candidates = [
      "video/mp4;codecs=h264,aac",
      "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
      "video/mp4",
    ];
    const webmCandidates = ["video/webm;codecs=vp9,opus", "video/webm"];
    const mime =
      mp4Candidates.find((m) => MediaRecorder.isTypeSupported(m)) ??
      webmCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ??
      "video/webm";
    const isMp4 = mime.startsWith("video/mp4");
    const rec = new MediaRecorder(merged, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: isMp4 ? "video/mp4" : "video/webm",
      });
      setLastBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
    rec.start(1000);
    recorderRef.current = rec;
    (recorderRef as any).mp4 = isMp4;
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
    if (!title.trim()) return toast.error("Bitte Titel angeben");
    setUploading(true);
    try {
      const ext = lastBlob.type.startsWith("video/mp4") ? "mp4" : "webm";
      const path = `${user.id}/${Date.now()}-${slug(title)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("tutorials").upload(path, lastBlob, {
        contentType: lastBlob.type || "video/webm", upsert: false,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("tutorials").insert({
        title: title.trim(), video_path: path, duration_seconds: duration || null, created_by: user.id,
      });
      if (insErr) throw insErr;
      toast.success("Tutorial gespeichert");
      setLastBlob(null); setPreviewUrl(null); setTitle("");
      window.dispatchEvent(new Event("tutorials:refresh"));
    } catch (e: any) {
      toast.error(e.message ?? "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const ready = screenStream && camStream;
  const bgPreviews = useMemo(() => buildBgPreviews(), []);

  return (
    <section className="space-y-5">
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="glass rounded-2xl overflow-hidden aspect-video relative bg-black/60">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {!ready && (
            <div className="absolute inset-0 grid place-items-center text-center px-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Starte zuerst Kamera & Bildschirm — dann erscheint hier die Live-Vorschau mit Maske.
                </p>
                <div className="flex justify-center gap-2">
                  <button onClick={() => startCam(videoId, audioId)} className="text-xs px-3 py-2 rounded-lg bg-card hover:bg-card/80 border border-border inline-flex items-center gap-1.5">
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

        <div className="glass rounded-2xl p-5 space-y-4 text-sm max-h-[640px] overflow-y-auto">
          <Group label={<><Camera className="w-3 h-3 inline mr-1" /> Kamera</>}>
            <div className="flex gap-1.5">
              <select value={videoId} onChange={(e) => setVideoId(e.target.value)}
                className="flex-1 bg-card border border-border rounded-md px-2 py-1.5 text-xs">
                {videoDevices.length === 0 && <option value="">Standard</option>}
                {videoDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${d.deviceId.slice(0, 4)}`}</option>)}
              </select>
              <button onClick={refreshDevices} title="Geräte neu laden" className="p-1.5 rounded-md border border-border hover:bg-card">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </Group>
          <Group label={<><Mic className="w-3 h-3 inline mr-1" /> Mikrofon</>}>
            <select value={audioId} onChange={(e) => setAudioId(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-2 py-1.5 text-xs">
              {audioDevices.length === 0 && <option value="">Standard</option>}
              {audioDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mikro ${d.deviceId.slice(0, 4)}`}</option>)}
            </select>
          </Group>

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
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(BG_LABELS) as BgKey[]).map((k) => (
                <button key={k} onClick={() => setBg(k)}
                  className={`relative rounded-md overflow-hidden border text-[10px] aspect-[4/3] ${
                    bg === k ? "border-accent ring-1 ring-accent" : "border-border"
                  }`}>
                  {k === "transparent" ? (
                    <div className="absolute inset-0 bg-[conic-gradient(at_50%_50%,_#1a1a1a_25%,_#2a2a2a_25%_50%,_#1a1a1a_50%_75%,_#2a2a2a_75%)] bg-[length:10px_10px]" />
                  ) : k === "blur" ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900 blur-sm" />
                  ) : PHOTO_BGS[k] ? (
                    <img src={PHOTO_BGS[k]!} alt={BG_LABELS[k]} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <img src={bgPreviews[k]} alt={BG_LABELS[k]} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <span className="absolute bottom-0.5 left-1 right-1 text-white drop-shadow truncate">{BG_LABELS[k]}</span>
                </button>
              ))}
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
            <a href={previewUrl}
              download={`${slug(title || "tutorial")}.${lastBlob?.type.startsWith("video/mp4") ? "mp4" : "webm"}`}
              className="px-4 py-2 rounded-lg border border-border text-xs hover:bg-card">Download</a>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─────────── Brand backgrounds (procedural canvas) ─────────── */

function drawBrandBg(canvas: HTMLCanvasElement, key: BgKey) {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (key === "ember") {
    // Deep charcoal with warm orange radial glow + KSE wordmark
    const g = ctx.createRadialGradient(w * 0.7, h * 0.4, 10, w * 0.5, h * 0.5, Math.max(w, h));
    g.addColorStop(0, "#ff6a3d");
    g.addColorStop(0.35, "#a8381a");
    g.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    drawNoise(ctx, w, h, 0.08);
    drawWordmark(ctx, w, h, "rgba(255,255,255,0.06)", "rgba(255,255,255,0.18)");
  } else if (key === "grid") {
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, w, h);
    const step = Math.max(28, Math.floor(w / 28));
    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // Vignette
    const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
    // Accent corner
    const ag = ctx.createLinearGradient(0, h, w * 0.6, h * 0.4);
    ag.addColorStop(0, "rgba(255,87,34,0.55)"); ag.addColorStop(1, "rgba(255,87,34,0)");
    ctx.fillStyle = ag; ctx.fillRect(0, 0, w, h);
    drawWordmark(ctx, w, h, "rgba(255,255,255,0.05)", "rgba(255,87,34,0.5)");
  } else if (key === "mesh") {
    // Smooth gradient mesh
    const blobs = [
      { x: 0.2, y: 0.3, c: "#ff5722", a: 0.85 },
      { x: 0.85, y: 0.2, c: "#7c3aed", a: 0.6 },
      { x: 0.7, y: 0.85, c: "#0ea5e9", a: 0.55 },
      { x: 0.1, y: 0.9, c: "#f59e0b", a: 0.5 },
    ];
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, w, h);
    blobs.forEach((b) => {
      const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, w * 0.55);
      g.addColorStop(0, hexAlpha(b.c, b.a));
      g.addColorStop(1, hexAlpha(b.c, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });
    drawNoise(ctx, w, h, 0.05);
    drawWordmark(ctx, w, h, "rgba(255,255,255,0.08)", "rgba(255,255,255,0.22)");
  } else if (key === "wall") {
    ctx.fillStyle = "#0d0d0d"; ctx.fillRect(0, 0, w, h);
    // Repeating diagonal "KSE" pattern
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 12);
    ctx.translate(-w / 2, -h / 2);
    ctx.font = `${Math.floor(h * 0.18)}px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    const txt = "KSE  GROUP  ";
    const lineH = Math.floor(h * 0.22);
    for (let y = -lineH; y < h + lineH * 2; y += lineH) {
      let row = "";
      while (ctx.measureText(row).width < w * 1.6) row += txt;
      ctx.fillText(row, -w * 0.2, y);
    }
    ctx.restore();
    // Brand glow
    const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.7);
    g.addColorStop(0, "rgba(255,87,34,0.3)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
}

function drawWordmark(ctx: CanvasRenderingContext2D, w: number, h: number, kseColor: string, groupColor: string) {
  ctx.save();
  ctx.font = `700 ${Math.floor(h * 0.22)}px "Space Grotesk", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = kseColor;
  ctx.fillText("KSE", w / 2 - w * 0.08, h / 2);
  ctx.font = `300 ${Math.floor(h * 0.16)}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = groupColor;
  ctx.fillText("GROUP", w / 2 + w * 0.13, h / 2 + h * 0.01);
  ctx.restore();
}

function drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * alpha;
    d[i] = clamp(d[i] + n);
    d[i + 1] = clamp(d[i + 1] + n);
    d[i + 2] = clamp(d[i + 2] + n);
  }
  ctx.putImageData(id, 0, 0);
}
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ir > cr) {
    sw = img.naturalHeight * cr;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / cr;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}
const clamp = (v: number) => Math.max(0, Math.min(255, v));
const hexAlpha = (hex: string, a: number) => {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

function buildBgPreviews(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const out: Record<string, string> = {};
  (["ember", "grid", "mesh", "wall"] as BgKey[]).forEach((k) => {
    const c = document.createElement("canvas");
    c.width = 160; c.height = 120;
    drawBrandBg(c, k);
    out[k] = c.toDataURL("image/png");
  });
  return out;
}

/* ─────────── UI bits ─────────── */

function Group({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
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
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
}
function blobPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
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