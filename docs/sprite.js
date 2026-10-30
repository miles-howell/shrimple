// Shared by index.html and app.html: the hand-drawn art from src/sprite.rs,
// and the helpers that compose a frame and paint it onto a 16x16 canvas.


// Legend:
//   .  transparent        o  outline           b  body
//   h  highlight          s  shell shading     l  legs
//   a  antennae           e  eye               w  eye shine
//   m  blush              t  tail fan
const UPRIGHT = [
  "...a........a...",
  "....a......a....",
  ".....a....a.....",
  "....oooooooo....",
  "...obbbbbbbbho..",
  "..obbbbbbbbbbho.",
  "..owebbbbbwebho.",
  "..oeebbbbbeebbo.",
  "..ombbbebbbbmbo.",
  "...obbbbbbbbbo..",
  "....oossssssoo..",
  "...l.obbbbhho...",
  "....losssssol...",
  ".....obbbbo.....",
  "....otooooto....",
  "...ottto.ottto..",
];
const CRANING = [
  "................",
  "...a.....a......",
  "....a...a.......",
  ".....a.a........",
  "..oooooooo......",
  ".obbbbbbbbho....",
  "owebbbbwebbho...",
  "oeebbbbeebbbo...",
  "ombbbebbbmbbo...",
  ".obbbbbbbbbboo..",
  "..oooooooobshho.",
  "...l.l...osbbho.",
  ".........osbbho.",
  "........osbbbo..",
  ".......otttoo...",
  "......ottto.....",
];
const SLUMPED = [
  "................",
  "................",
  "...a............",
  "....a..a........",
  ".....a.a........",
  "..oooooooo.ooo..",
  ".obbbbbbbboshbo.",
  "obbbbbbbbbosbbho",
  "ooobbbbooobsbbho",
  "owebbbbwebbsbbho",
  "ombbbooobmbosbbo",
  ".obbbbbbbbboosbo",
  "..oooooooooobsbo",
  "...l.l.l..osbbo.",
  "........otttoo..",
  ".......ottto....",
];
const HUNCHED = [
  "................",
  "................",
  "........ooooo...",
  "......oosbbhhoo.",
  ".....osbbbbbbho.",
  ".a..osbbbbbbbbho",
  "..aoooooooo.sbho",
  "..obbbbbbbbosbbo",
  ".obbbbbbbbbbosbo",
  ".obooobbbooobsbo",
  ".owebbbbbwebosbo",
  ".ombbbooobbmbobo",
  "..obbbbbbbbbo.o.",
  "...oooooooooto..",
  "...l.l.l.ottto..",
  "........ootto...",
];
const CURLED = [
  "................",
  "................",
  ".......ooooo....",
  ".....oosbbbhoo..",
  "....osbbbbbbbho.",
  "...osbbbbbbbbbho",
  "..aooooooooobbho",
  ".aobbbbbbbbbosbo",
  "..obobbbbbobosbo",
  ".obbbobbbobbosbo",
  ".obwebbbbewbosbo",
  ".ombbbooobbmbsbo",
  "..oobbbbbbboosbo",
  ".ottoooooooosbbo",
  "ottttosssbbbbbo.",
  ".ooooooooooooo..",
];
const FUMING = [
  "...a........a...",
  "....a......a....",
  ".....a....a.....",
  "....oooooooo....",
  "...oobbbbbobho..",
  "..obbobbbobbbho.",
  "..obwebbbewbbho.",
  "..obbbbbbbbbbbo.",
  "..ombbooobbbmbo.",
  "...obbbbbbbbbo..",
  "....oossssssoo..",
  "...obbbohhhho...",
  "....ossssso.....",
  ".....obbbbo.....",
  "....otooooto....",
  "...ottto.ottto..",
];
const SEABED = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "..............g.",
  ".............gk.",
  ".............g..",
  "............kg..",
  ".............gg.",
  "..............gk",
  "g.............g.",
  "gk...........gk.",
  ".g...........g..",
  "kgd.......d.kgdd",
  "ddddpdddddddpddd",
];
const FLAMES = [
  [
    "......r.........",
    "......rr........",
    ".....rfr..r.....",
    "r....rfyr.rr....",
    "rr..rfyfr.rfr...",
    "rfr.rfyfrrffr..r",
    "rfr..........rfr",
    "ryfr..........fr",
    "ryfr............",
    "rfyr............",
    "rfyr............",
    "ryfr............",
    "rffr............",
    "rffr.........r..",
    "prfr........rfrr",
    "pprrrrrrrrrrrrpp",
  ],
  [
    ".......r........",
    "......rr........",
    "......rfr.r.....",
    ".....rfyr.rr....",
    "r....rfyfrrfr...",
    "rr..rfyyfrffr.r.",
    "rfr..........rrr",
    "rffr..........ff",
    "ryfr............",
    "ryfr............",
    "rfyr............",
    "rfyr............",
    "ryfr............",
    "rffr..........r.",
    "prfr.........rfr",
    "pprrrrrrrrrrrrpp",
  ],
];
const VEIN = [".x.x.", "xx.xx", ".....", "xx.xx", ".x.x."];
const QUESTION = ["..qqq", "....q", "...q.", ".....", "...q."];
const SPARKLE = ["..*..", "..*..", "**.**", "..*..", "..*.."];

// Calm and fully-furious colors, per legend character.
const PALETTE = {
  o: [[92, 32, 30, 255], [70, 6, 6, 255]],
  b: [[255, 142, 108, 255], [228, 32, 26, 255]],
  h: [[255, 204, 172, 255], [255, 112, 92, 255]],
  s: [[222, 98, 78, 255], [168, 14, 14, 255]],
  l: [[200, 82, 66, 255], [150, 14, 14, 255]],
  a: [[150, 62, 52, 255], [120, 18, 18, 255]],
  e: [[24, 12, 12, 255], [24, 6, 6, 255]],
  w: [[255, 255, 255, 255], [255, 220, 80, 255]],
  m: [[255, 110, 130, 255], [200, 20, 40, 255]],
  t: [[255, 176, 140, 255], [240, 70, 50, 255]],
  q: [[70, 120, 230, 255], [70, 120, 230, 255]],
  x: [[235, 24, 24, 255], [235, 24, 24, 255]],
  "*": [[255, 236, 120, 255], [255, 236, 120, 255]],
  d: [[222, 184, 112, 255], [92, 70, 58, 255]],
  p: [[168, 138, 92, 255], [56, 40, 36, 255]],
  g: [[64, 176, 92, 255], [150, 140, 60, 255]],
  k: [[30, 112, 64, 255], [100, 84, 40, 255]],
  r: [[214, 52, 20, 255], [214, 52, 20, 255]],
  f: [[255, 140, 24, 255], [255, 140, 24, 255]],
  y: [[255, 226, 80, 255], [255, 226, 80, 255]],
  v: [[120, 200, 240, 70], [255, 150, 90, 70]],
  u: [[60, 140, 220, 90], [220, 80, 50, 90]],
  c: [[220, 245, 255, 200], [255, 220, 180, 200]],
};

const SIZE = 16;
const DEEP_WATER_ROW = 8;
const MAX_ANGER = 6;
const FLAME_ANGER = 3;

const grid = art => art.map(row => row.split(""));

function artFor(l) {
  if (l.pose === "upright") return UPRIGHT;
  if (l.pose === "doubtful") return CRANING;
  if (l.anger >= FLAME_ANGER) return FUMING;
  if (l.anger >= 2) return CURLED;
  if (l.anger >= 1) return HUNCHED;
  return SLUMPED;
}

// Extras the tray icon doesn't have room for: blinking, facing the cursor,
// and bubbles that rise faster the angrier it gets.
function compose(l, { blink = false, flip = false, t = 0, bubbles = true } = {}) {
  let shrimp = grid(artFor(l));
  if (blink) {
    shrimp.forEach((row, y) => {
      if (!row.includes("w")) return;
      row.forEach((c, x) => { if (c === "e" || c === "w") row[x] = "o"; });
      const below = shrimp[y + 1];
      if (below) below.forEach((c, x) => { if (c === "e") below[x] = "b"; });
    });
  }
  if (flip) shrimp = shrimp.map(row => row.reverse());
  if (l.shake) shrimp = shrimp.map(row => [".", ...row.slice(0, SIZE - 1)]);

  const g = grid(l.anger >= FLAME_ANGER ? FLAMES[l.flicker ? 1 : 0] : SEABED);
  g.forEach((row, y) => row.forEach((c, x) => {
    if (c === ".") row[x] = y < DEEP_WATER_ROW ? "v" : "u";
  }));

  if (bubbles) {
    const count = 2 + l.anger;
    const speed = 900 - l.anger * 110;
    for (let i = 0; i < count; i++) {
      const phase = t / speed + i * (SIZE / count) + i * 0.37;
      const y = SIZE - 2 - Math.floor(phase % (SIZE - 1));
      const x = (i * 5 + 1 + (Math.floor(phase / 3) % 2)) % SIZE;
      if (g[y][x] === "v" || g[y][x] === "u") g[y][x] = "c";
    }
  } else {
    g[7][1] = "c";
    g[9][0] = "c";
  }

  shrimp.forEach((row, y) => row.forEach((c, x) => { if (c !== ".") g[y][x] = c; }));

  const stamp = l.sparkle ? SPARKLE
    : l.anger >= MAX_ANGER - 2 ? VEIN
    : l.pose === "doubtful" ? QUESTION
    : null;
  if (stamp) {
    stamp.forEach((row, y) => row.split("").forEach((c, x) => {
      if (c !== ".") g[y][SIZE - 5 + x] = c;
    }));
  }
  return g;
}

function paint(canvas, g, anger) {
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(SIZE, SIZE);
  const frac = anger / MAX_ANGER;
  g.forEach((row, y) => row.forEach((c, x) => {
    const pair = PALETTE[c];
    if (!pair) return;
    const [calm, mad] = pair;
    const i = (y * SIZE + x) * 4;
    for (let k = 0; k < 4; k++) img.data[i + k] = Math.round(calm[k] + (mad[k] - calm[k]) * frac);
  }));
  ctx.putImageData(img, 0, 0);
}
