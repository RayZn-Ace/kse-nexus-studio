import { createFileRoute } from "@tanstack/react-router";
import { Video } from "lucide-react";

export const Route = createFileRoute("/admin/tutorials")({ component: Tutorials });

function Tutorials() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-2xl font-semibold mb-2">Tutorials</h1>
      <p className="text-sm text-muted-foreground mb-8">Bildschirmaufnahmen mit Facecam — Bibliothek & Recorder.</p>
      <div className="glass rounded-2xl p-10 text-center">
        <Video className="w-10 h-10 text-accent mx-auto mb-3" />
        <h2 className="font-semibold mb-1">Recorder kommt im nächsten Schritt</h2>
        <p className="text-sm text-muted-foreground">
          Im nächsten Prompt baue ich den vollständigen Screen-Recorder mit Facecam-Maske
          (Form, Position, Hintergrund) und KI-Personenfreistellung via MediaPipe — speichert
          direkt in deine Cloud-Bibliothek.
        </p>
      </div>
    </div>
  );
}