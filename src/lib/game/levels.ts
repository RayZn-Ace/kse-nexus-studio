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

/** Funk-Sprüche, die während des Levels bei bestimmten Abschüssen eingeblendet werden. */
export type Beat = { at: number; who: string; text: string };

export type Level = {
  id: number;
  name: string;
  place: string;
  intro: string[];
  outro: string[];
  beats: Beat[];
  target: number;
  lives: number;
  speedMul: number;
  spawnBase: number;
  kinds: VillainKind[];
  boss?: boolean;
};

export const PROLOGUE = [
  "Hannover, irgendwann nach Mitternacht. Über der Stadt hängt ein Netz aus Glasfaser, Neon und schlechten Entscheidungen.",
  "Seit drei Wochen fallen Server aus, Kassensysteme spucken Unsinn, ganze Firmen stehen still. Jemand zieht an den Fäden — und niemand sieht ihn.",
  "Du siehst ihn. Du hängst kopfüber am Kran über dem Hauptbahnhof, im Ohr die Stimme von KayI, der KI aus dem KSE-Studio.",
  "„Netz aufgeladen, Chief. Sechs Nächte. Ein Netzbrecher. Lass uns arbeiten.“",
];

export const EPILOGUE = [
  "Der Netzbrecher hängt im Netz, 140 Meter über der Stadt, und flucht in einer Sprache, die nur Rechenzentren verstehen.",
  "Unten gehen die Lichter wieder an. Kassen piepen, Server booten, ein Nachtbäcker schiebt Bleche in den Ofen, als wäre nie etwas gewesen.",
  "KayI im Ohr: „Fall geschlossen. Aber die Stadt schläft nie — und sie schickt immer Nachschub.“",
  "Du lässt dich fallen, greifst den nächsten Faden und schwingst zurück in die Nacht. Endlosmodus wartet.",
];

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Erster Schwung",
    place: "Bahnhofspassage · 23:14",
    intro: [
      "Die Passage riecht nach Regen und Currywurst. Drei Typen in Overalls reißen einen Serverschrank aus der Wand — mitten im Publikumsverkehr.",
      "KayI: „Handschrift kenne ich. Das sind Handlanger, keine Denker. Aber sie sind Boten — und Boten führen zum Absender.“",
      "Netz spannen. Schwung holen. Zeigen, wem diese Stadt gehört.",
    ],
    outro: [
      "Die Passage ist sauber, der Serverschrank bleibt, wo er hingehört.",
      "Im Funkgerät eines Handlangers knistert eine Stimme: „Ladung Zwei geht raus. Hafen. Jetzt.“",
    ],
    beats: [
      { at: 1, who: "KayI", text: "Sauber getroffen. Zielerfassung steht." },
      { at: 4, who: "Handlanger", text: "Der Spinner ist da! Ruft die Nachtschicht!" },
      { at: 7, who: "KayI", text: "Noch einer, dann sind wir hier durch." },
    ],
    target: 8,
    lives: 3,
    speedMul: 1,
    spawnBase: 70,
    kinds: ["grunt"],
  },
  {
    id: 2,
    name: "Nachtschicht",
    place: "Lindener Hafen · 01:02",
    intro: [
      "Am Hafenbecken laufen die Kräne noch, obwohl kein Schiff da ist. Container werden bewegt, in denen keine Ware liegt — nur Technik.",
      "KayI: „Sie verlegen Rechenleistung. Wer so viel Hardware versteckt, baut etwas Großes.“",
      "Und diesmal haben sie Sprinter dabei. Schnell, dünn, ohne jedes Zeitgefühl.",
    ],
    outro: [
      "Der letzte Sprinter geht zu Boden, sein Headset piept noch: „Chef, er ist im Hafen …“",
      "KayI: „Wir sind auf ihrem Radar. Gut. Radar heißt: sie machen Fehler.“",
    ],
    beats: [
      { at: 3, who: "Sprinter", text: "Du kriegst mich nicht, Netzheini!" },
      { at: 8, who: "KayI", text: "Sie werden schneller. Bleib in Bewegung." },
    ],
    target: 12,
    lives: 3,
    speedMul: 1.15,
    spawnBase: 62,
    kinds: ["grunt", "runner"],
  },
  {
    id: 3,
    name: "Panzer im Hafen",
    place: "Containerreihe C · 02:40",
    intro: [
      "Zwischen den Containern stampfen gepanzerte Schläger — Exoskelette aus Baustellentechnik und geklauten Akkus.",
      "KayI: „Ein Netzschuss reicht da nicht. Drei Treffer pro Panzer, mindestens. Und pass auf die Kleinen dazwischen auf.“",
    ],
    outro: [
      "Der letzte Panzer kippt in ein Hafenbecken. Auf der Rückenplatte klebt ein Logo: ein zerrissenes Netz.",
      "KayI: „Das Symbol taucht in jedem Angriff auf. Er nennt sich der Netzbrecher.“",
    ],
    beats: [
      { at: 2, who: "KayI", text: "Panzer brauchen drei Treffer. Dranbleiben." },
      { at: 9, who: "Panzer", text: "Der Chef zahlt extra für deine Maske." },
    ],
    target: 14,
    lives: 3,
    speedMul: 1.25,
    spawnBase: 58,
    kinds: ["grunt", "tank"],
  },
  {
    id: 4,
    name: "Sirenen über Hannover",
    place: "Linden-Nord · 03:15",
    intro: [
      "Halb Linden liegt im Dunkeln. Ampeln blinken orange, ein Straßenbahnzug steht quer, überall Sirenen.",
      "KayI: „Er testet die Stadt. Wenn er den Verteilerknoten kriegt, ist ganz Hannover offline.“",
      "Alles, was die Bande hat, ist unterwegs. Gleichzeitig.",
    ],
    outro: [
      "Die Sirenen verstummen, die Ampeln atmen wieder grün.",
      "Über der Skyline flackert ein rotes Signal auf — eine Einladung, die aussieht wie eine Falle.",
    ],
    beats: [
      { at: 5, who: "KayI", text: "Sie kommen aus allen Richtungen. Zielwechsel schnell halten." },
      { at: 12, who: "KayI", text: "Der Verteilerknoten hält. Weiter so." },
    ],
    target: 18,
    lives: 3,
    speedMul: 1.4,
    spawnBase: 52,
    kinds: ["grunt", "runner", "tank"],
  },
  {
    id: 5,
    name: "Der Hinterhalt",
    place: "Dach am Aegi · 04:04",
    intro: [
      "Das rote Signal war eine Falle. Kaum stehst du auf dem Dach, klappen die Lüftungsschächte auf.",
      "KayI: „Ich zähle zu viele Signaturen. Du hast heute nur zwei Leben, Chief — verhalt dich entsprechend.“",
      "Kein Fehler erlaubt.",
    ],
    outro: [
      "Du hältst stand. Der letzte Angreifer rutscht die Dachschräge hinunter und bleibt liegen.",
      "Am Horizont leuchtet das Hochhaus. Ganz oben, hinter der Antenne, wartet jemand auf dich.",
    ],
    beats: [
      { at: 6, who: "Netzbrecher", text: "Du bist zäh. Zäh ist nur langsam sterben." },
      { at: 15, who: "KayI", text: "Fast durch. Atmen. Zielen. Schießen." },
    ],
    target: 22,
    lives: 2,
    speedMul: 1.55,
    spawnBase: 46,
    kinds: ["grunt", "runner", "tank"],
  },
  {
    id: 6,
    name: "Boss: Der Netzbrecher",
    place: "Hochhausdach · 05:11",
    intro: [
      "Er steht am Antennenmast, Kabel wie Adern im Panzer, und lächelt, als hätte er dich selbst hergerufen.",
      "„Diese Stadt läuft auf Leitungen“, sagt er. „Und Leitungen gehören mir.“",
      "KayI: „Achtzehn Treffer, dann fällt seine Hülle. Seine Leute decken ihn — lass dich nicht ablenken.“",
    ],
    outro: [
      "Der Netzbrecher stürzt — und bleibt in deinem Netz hängen, drei Meter unter der Dachkante.",
      "Die Stadt atmet auf. Die Nacht endet trotzdem nie ganz.",
    ],
    beats: [
      { at: 1, who: "Netzbrecher", text: "Meine Leute halten dich auf. Ich halte die Stadt." },
      { at: 3, who: "KayI", text: "Seine Hülle reißt. Weiter draufhalten!" },
    ],
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
  place: "Über den Dächern · immer",
  intro: [
    "Kein Skript, kein Ende, kein Abspann. Die Stadt schickt Welle um Welle.",
    "KayI: „Ich zähle nicht mehr mit, wie viele kommen. Ich zähle nur noch, wie lange du stehst.“",
    "Mit jeder Sekunde werden sie schneller.",
  ],
  outro: [],
  beats: [
    { at: 10, who: "KayI", text: "Zehn unten. Sie ziehen an." },
    { at: 25, who: "KayI", text: "25. Das Tempo wird unangenehm." },
    { at: 50, who: "KayI", text: "50. Ehrlich gesagt: beeindruckend." },
    { at: 100, who: "KayI", text: "100. Du bist die Legende, von der sie erzählen." },
  ],
  target: Number.POSITIVE_INFINITY,
  lives: 3,
  speedMul: 1.1,
  spawnBase: 60,
  kinds: ["grunt", "runner", "tank"],
};