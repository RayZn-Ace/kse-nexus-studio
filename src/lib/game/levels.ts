export type VillainKind = "grunt" | "runner" | "tank" | "boss";

export type VillainSpec = {
  hp: number;
  speed: number;
  radius: number;
  color: string;
  points: number;
  label: string;
};

export const VILLAINS: Record<VillainKind, VillainSpec> = {
  grunt: { hp: 1, speed: 1.1, radius: 26, color: "#f97316", points: 10, label: "Schläger" },
  runner: { hp: 1, speed: 2.1, radius: 20, color: "#22d3ee", points: 20, label: "Sprinter" },
  tank: { hp: 3, speed: 0.6, radius: 36, color: "#a855f7", points: 35, label: "Panzer" },
  boss: { hp: 18, speed: 0.45, radius: 54, color: "#ef4444", points: 200, label: "Netzbrecher" },
};

export type Level = {
  id: number;
  name: string;
  intro: string;
  outro: string;
  target: number;
  lives: number;
  speedMul: number;
  spawnBase: number;
  kinds: VillainKind[];
  boss?: boolean;
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Erster Schwung",
    intro:
      "Hannover, 23:14 Uhr. Über den Dächern hängt Rauch — und drei Gestalten prügeln sich durch die Bahnhofspassage. Zeit, das Netz anzuwerfen.",
    outro: "Die Passage ist sauber. Aber im Funk knistert es: „Sie kommen aus dem Hafen.“",
    target: 8,
    lives: 3,
    speedMul: 1,
    spawnBase: 70,
    kinds: ["grunt"],
  },
  {
    id: 2,
    name: "Nachtschicht",
    intro:
      "Am Hafenbecken laufen die Kräne noch. Die Bande hat Verstärkung geholt — schnelle Läufer, die sich nicht aufhalten lassen wollen.",
    outro: "Ein Läufer entkommt und funkt: „Der Chef schickt die schweren Jungs.“",
    target: 12,
    lives: 3,
    speedMul: 1.15,
    spawnBase: 62,
    kinds: ["grunt", "runner"],
  },
  {
    id: 3,
    name: "Panzer im Hafen",
    intro:
      "Gepanzerte Schläger walzen die Containerreihe entlang. Ein Netzschuss reicht hier nicht — bleib dran, bis die Rüstung reißt.",
    outro: "Der letzte Panzer geht zu Boden. Auf seinem Rücken: ein Logo, das du kennst.",
    target: 14,
    lives: 3,
    speedMul: 1.25,
    spawnBase: 58,
    kinds: ["grunt", "tank"],
  },
  {
    id: 4,
    name: "Sirenen über Hannover",
    intro:
      "Halb Linden steht unter Strom. Alles, was die Bande hat, ist unterwegs — Schläger, Sprinter und Panzer gleichzeitig.",
    outro: "Die Sirenen verstummen. Über der Skyline leuchtet ein rotes Signal auf.",
    target: 18,
    lives: 3,
    speedMul: 1.4,
    spawnBase: 52,
    kinds: ["grunt", "runner", "tank"],
  },
  {
    id: 5,
    name: "Der Hinterhalt",
    intro:
      "Das Signal war eine Falle. Sie kommen aus allen Richtungen — und sie sind schneller geworden. Nur zwei Leben. Kein Fehler erlaubt.",
    outro: "Du hältst stand. Und ganz oben auf dem Turm wartet er bereits.",
    target: 22,
    lives: 2,
    speedMul: 1.55,
    spawnBase: 46,
    kinds: ["grunt", "runner", "tank"],
  },
  {
    id: 6,
    name: "Boss: Der Netzbrecher",
    intro:
      "Auf dem Dach des Hochhauses steht er: Der Netzbrecher. Panzerhaut, kein Humor, eine Armee im Rücken. Treffer für Treffer — dann fällt er.",
    outro:
      "Der Netzbrecher stürzt ins Netz. Die Stadt atmet auf — aber die Nacht endet nie wirklich. Endlosmodus freigeschaltet.",
    target: 1,
    lives: 3,
    speedMul: 1.6,
    spawnBase: 70,
    kinds: ["grunt", "runner"],
    boss: true,
  },
];

export const ENDLESS_LEVEL: Level = {
  id: 99,
  name: "Endlosmodus",
  intro:
    "Kein Skript, kein Ende. Die Stadt schickt Welle um Welle — und sie werden mit jeder Sekunde schneller. Wie lange hältst du durch?",
  outro: "",
  target: Number.POSITIVE_INFINITY,
  lives: 3,
  speedMul: 1.1,
  spawnBase: 60,
  kinds: ["grunt", "runner", "tank"],
};