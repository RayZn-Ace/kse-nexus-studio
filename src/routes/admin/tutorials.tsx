import { createFileRoute } from "@tanstack/react-router";
import { Recorder } from "@/components/admin/Recorder";
import { TutorialLibrary } from "@/components/admin/TutorialLibrary";

export const Route = createFileRoute("/admin/tutorials")({ component: Tutorials });

function Tutorials() {
  return (
    <div className="p-8 max-w-6xl space-y-10">
      <header>
        <h1 className="font-display text-2xl font-semibold mb-1">Tutorials</h1>
        <p className="text-sm text-muted-foreground">
          Bildschirmaufnahme mit Facecam-Maske, Hintergrund-Freistellung und Cloud-Speicher.
        </p>
      </header>
      <Recorder />
      <TutorialLibrary />
    </div>
  );
}