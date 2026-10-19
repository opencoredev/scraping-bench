import rough from "roughjs";
import type { Options } from "roughjs/bin/core";
import { colorOf } from "@/lib/colors";
import type { Track } from "@/lib/results";

/*
 * "How a task runs", drawn as an Excalidraw sketch in dark mode.
 * Reference: an Excalidraw whiteboard. Its rough.js strokes, rounded boxes, bent arrows, Excalifont handwriting and
 * Cascadia Code for code, all taken from Excalidraw itself.
 * Palette: near-white ink, one Excalidraw-style colour per role (blue model, yellow tool, green check), providers in
 * their chart colours. Signature: the task is a stack of cards, so it reads as one of many, not the whole benchmark.
 * Avoiding: square boxes with small caps labels, which read as a corporate flow chart.
 * Two fixed layouts: wide for desktop and the X export, tall for phones. Seeds are fixed, so every render is identical.
 */

type Box = { x: number; y: number; w: number; h: number };
type Point = readonly [number, number];
/** `bend` pushes the arrow's midpoint sideways by that many units, for the hand-drawn curve. */
type Arrow = { from: Point; to: Point; bend: number; both?: boolean };
type Layout = {
  w: number;
  h: number;
  boxes: Record<"task" | "model" | "tool" | "api" | "answer" | "check", Box>;
  arrows: readonly Arrow[];
  limits: Point;
  apiChars: number;
  /** Where the "same tasks for every provider" note goes, when there is room for it. */
  stackNote: Point | null;
};

const WIDE: Layout = {
  w: 1040,
  h: 420,
  boxes: {
    task: { x: 14, y: 24, w: 236, h: 150 },
    model: { x: 314, y: 24, w: 190, h: 150 },
    answer: { x: 568, y: 24, w: 236, h: 160 },
    check: { x: 862, y: 24, w: 168, h: 160 },
    tool: { x: 314, y: 262, w: 190, h: 140 },
    api: { x: 568, y: 262, w: 236, h: 140 },
  },
  arrows: [
    { from: [272, 100], to: [308, 100], bend: -6 },
    { from: [510, 100], to: [562, 100], bend: -8 },
    { from: [810, 104], to: [856, 104], bend: -8 },
    { from: [374, 180], to: [374, 256], bend: -8 },
    { from: [446, 256], to: [446, 180], bend: -8 },
    { from: [510, 332], to: [562, 332], bend: -6, both: true },
  ],
  limits: [462, 212],
  apiChars: 21,
  stackNote: [24, 262],
};

const TALL: Layout = {
  w: 360,
  h: 940,
  boxes: {
    task: { x: 10, y: 10, w: 322, h: 118 },
    model: { x: 10, y: 184, w: 340, h: 106 },
    tool: { x: 40, y: 360, w: 132, h: 200 },
    api: { x: 206, y: 360, w: 144, h: 200 },
    answer: { x: 10, y: 610, w: 340, h: 160 },
    check: { x: 10, y: 812, w: 340, h: 118 },
  },
  arrows: [
    { from: [180, 150], to: [180, 178], bend: 6 },
    { from: [86, 296], to: [86, 354], bend: -6 },
    { from: [130, 354], to: [130, 296], bend: -6 },
    { from: [176, 450], to: [202, 450], bend: -4, both: true },
    { from: [22, 296], to: [22, 604], bend: -10 },
    { from: [180, 776], to: [180, 806], bend: 6 },
  ],
  limits: [146, 318],
  apiChars: 13,
  stackNote: null,
};

/** One real task per track, as the model saw it and as the script checked it. */
const CONTENT: Record<Track["id"], { task: readonly string[]; tool: string; answer: readonly string[]; check: readonly string[] }> = {
  search: {
    task: ["Latest stable release", "of fastapi on PyPI, and", "its install command?"],
    tool: "search(query)",
    answer: ["{", '  "version": "0.143.3",', '  "installCommand":', '    "pip install fastapi"', "}"],
    check: ["Same as PyPI's", "own record?"],
  },
  scrape: {
    task: ["Price, stock and SKU", "from this product page?"],
    tool: "scrape(url)",
    answer: ["{", '  "price": "168.28 USD",', '  "stock": "In stock",', '  "sku": "NS-18AADCCC"', "}"],
    check: ["Same as the page", "we generated?"],
  },
  map: {
    task: ["Every docs page under", "typer.tiangolo.com", "/tutorial/commands/?"],
    tool: "map(site)",
    answer: ["{", '  "urls": [', '    ".../commands/",', '    ".../arguments/", …', "  ]", "}"],
    check: ["Enough of the full", "list, little junk?"],
  },
  crawl: {
    task: ["Every install command", "under", "/docs/guides/deployment?"],
    tool: "crawl(site, scope)",
    answer: ["{", '  "records": [', '    "…/topic-2 | Linux |', '     pip install …", …', "  ]", "}"],
    check: ["All commands,", "nothing extra?"],
  },
};

const INK = "oklch(0.93 0 0)";
const MUTED = "oklch(0.68 0 0)";
const MODEL = "oklch(0.76 0.12 245)";
const TOOL = "oklch(0.85 0.13 85)";
const PASS = "oklch(0.8 0.16 155)";
const HAND = "var(--font-excalifont), var(--font-plex-sans), sans-serif";
const CODE = "var(--font-cascadia), var(--font-plex-mono), monospace";

const gen = rough.generator();
type Drawable = ReturnType<typeof gen.path>;

function Sketch({ shapes }: { shapes: readonly Drawable[] }) {
  return (
    <>
      {shapes.flatMap((s, i) =>
        gen.toPaths(s).map((p, j) => (
          <path key={`${i}-${j}`} d={p.d} style={{ stroke: p.stroke, strokeWidth: p.strokeWidth, fill: p.fill ?? "none" }} strokeLinecap="round" strokeLinejoin="round" />
        )),
      )}
    </>
  );
}

/** A rounded rectangle, the shape Excalidraw draws with "round" edges on. */
function box(b: Box, seed: number, extra: Options = {}) {
  const r = Math.min(18, b.w / 6, b.h / 6);
  const { x, y, w, h } = b;
  const d = `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
  return gen.path(d, { seed, roughness: 1, bowing: 1, stroke: INK, strokeWidth: 1.6, hachureGap: 7, fillWeight: 0.9, ...extra });
}

/** A hachure fill in `color` at low opacity, as Excalidraw's light fills look on its dark canvas. */
const hachure = (color: string, alpha: number): Options => ({ fill: color.replace(")", ` / ${alpha})`), fillStyle: "hachure", hachureAngle: -41 });

function arrow(a: Arrow, seed: number, color = MUTED) {
  const [x1, y1] = a.from;
  const [x2, y2] = a.to;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const mid: Point = [(x1 + x2) / 2 - ((y2 - y1) / len) * a.bend, (y1 + y2) / 2 + ((x2 - x1) / len) * a.bend];
  const style = { roughness: 0.7, stroke: color, strokeWidth: 1.6 };
  // Each head follows the curve's tangent at its end, which runs from the bent midpoint.
  const head = ([hx, hy]: Point, [fx, fy]: Point, k: number) => {
    const dir = Math.atan2(hy - fy, hx - fx);
    return [dir - 0.45, dir + 0.45].map((t, n) => gen.line(hx, hy, hx - 11 * Math.cos(t), hy - 11 * Math.sin(t), { ...style, seed: seed + k + n }));
  };
  return [gen.curve([[x1, y1], [mid[0], mid[1]], [x2, y2]], { ...style, seed }), ...head(a.to, mid, 1), ...(a.both ? head(a.from, mid, 3) : [])];
}

/** A hand-drawn tick, since Excalifont's Latin subset has no check mark glyph. */
const tick = (x: number, y: number, seed: number) => [
  gen.line(x, y, x + 7, y + 8, { seed, roughness: 0.6, stroke: PASS, strokeWidth: 2.4 }),
  gen.line(x + 7, y + 8, x + 21, y - 9, { seed: seed + 1, roughness: 0.6, stroke: PASS, strokeWidth: 2.4 }),
];

/** Wraps provider names into lines of at most `chars` characters, keeping each name whole. */
function wrapNames(names: readonly { id: string; label: string }[], chars: number) {
  const lines: { id: string; label: string }[][] = [[]];
  let used = 0;
  for (const n of names) {
    const line = lines[lines.length - 1] ?? [];
    if (used > 0 && used + n.label.length + 2 > chars) {
      lines.push([n]);
      used = n.label.length;
    } else {
      line.push(n);
      used += n.label.length + (used > 0 ? 2 : 0);
    }
  }
  return lines;
}

function Heading({ box: b, color = INK, children }: { box: Box; color?: string; children: string }) {
  return (
    <text x={b.x + 16} y={b.y + 32} style={{ fill: color, fontFamily: HAND, fontSize: 21 }}>
      {children}
    </text>
  );
}

function Lines({ box: b, lines, code = false, top = 62, color = INK }: { box: Box; lines: readonly string[]; code?: boolean; top?: number; color?: string }) {
  const step = code ? 17 : 20;
  return (
    <text style={{ fill: color, fontFamily: code ? CODE : HAND, fontSize: code ? 13 : 16, whiteSpace: "pre" }}>
      {lines.map((l, i) => (
        <tspan key={i} x={b.x + 16} y={b.y + top + i * step}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

export function TaskDiagram({ track, layout, className }: { track: Track; layout: "wide" | "tall"; className?: string }) {
  const L = layout === "wide" ? WIDE : TALL;
  const c = CONTENT[track.id];
  const { boxes: b } = L;
  const { limits } = track;
  const names = track.providers.map((p) => ({ id: p.id, label: p.label })).sort((x, y) => x.label.localeCompare(y.label));
  const apiLines = wrapNames(names, L.apiChars);
  const shift = (d: number): Box => ({ ...b.task, x: b.task.x + d, y: b.task.y + d });
  const checkLines = layout === "wide" ? c.check : [c.check.join(" ")];
  const tickAt: Point = [b.check.x + 16, b.check.y + 62 + checkLines.length * 20 + 6];

  return (
    <svg
      viewBox={`0 0 ${L.w} ${L.h}`}
      className={className}
      role="img"
      aria-label={`How a ${track.label.toLowerCase()} task runs, one of ${track.tasks}: the task goes to the model, the model calls ${c.tool} on the API being tested, answers in JSON, and a script checks the answer.`}
    >
      <Sketch
        shapes={[
          // The cards behind the task: it is one of many, and every provider gets the same stack.
          box(shift(14), 9, { stroke: MUTED, fill: "oklch(0.2 0 0)", fillStyle: "solid", strokeWidth: 1.2 }),
          box(shift(7), 10, { stroke: MUTED, fill: "oklch(0.2 0 0)", fillStyle: "solid", strokeWidth: 1.2 }),
          box(b.task, 11, { fill: "oklch(0.2 0 0)", fillStyle: "solid" }),
          box(b.model, 12, { stroke: MODEL, ...hachure(MODEL, 0.16) }),
          box(b.tool, 13, { stroke: TOOL, ...hachure(TOOL, 0.13) }),
          box(b.api, 14, { strokeLineDash: [8, 7] }),
          box(b.answer, 15),
          box(b.check, 16, { stroke: PASS, ...hachure(PASS, 0.16) }),
          ...L.arrows.flatMap((a, i) => arrow(a, 40 + i * 5)),
          ...tick(tickAt[0], tickAt[1], 90),
          ...(L.stackNote ? arrow({ from: [L.stackNote[0] + 90, L.stackNote[1] - 22], to: [L.stackNote[0] + 120, b.task.y + b.task.h + 22], bend: 10 }, 95) : []),
        ]}
      />

      <Heading box={b.task}>The task</Heading>
      <text x={b.task.x + b.task.w - 16} y={b.task.y + 32} textAnchor="end" style={{ fill: MUTED, fontFamily: HAND, fontSize: 16 }}>
        1 of {track.tasks}
      </text>
      <Lines box={b.task} lines={c.task} />

      <Heading box={b.model} color={MODEL}>
        The model
      </Heading>
      <Lines box={b.model} lines={layout === "wide" ? ["Claude Haiku 5.5,", "same prompt for", "every provider"] : ["Claude Haiku 5.5, same prompt", "for every provider"]} />

      <Heading box={b.tool} color={TOOL}>
        One tool
      </Heading>
      {/* The tall tool box is narrow, so a two-argument call breaks after its comma. */}
      <Lines box={b.tool} lines={layout === "wide" ? [c.tool] : c.tool.split(/(?<=,) /)} code top={64} />

      <Heading box={b.api}>{layout === "wide" ? "API being tested" : "API tested"}</Heading>
      <text style={{ fontFamily: HAND, fontSize: 17, whiteSpace: "pre" }}>
        {apiLines.map((line, i) => (
          <tspan key={i} x={b.api.x + 16} y={b.api.y + 62 + i * 20}>
            {line.map((n, k) => (
              <tspan key={n.id} style={{ fill: colorOf(n.id) }}>
                {k > 0 ? "  " : ""}
                {n.label}
              </tspan>
            ))}
          </tspan>
        ))}
      </text>

      <Heading box={b.answer}>JSON answer</Heading>
      <Lines box={b.answer} lines={c.answer} code top={58} />

      <Heading box={b.check} color={PASS}>
        Script checks
      </Heading>
      <Lines box={b.check} lines={checkLines} />
      <text x={tickAt[0] + 30} y={tickAt[1] + 6} style={{ fill: PASS, fontFamily: HAND, fontSize: 17 }}>
        it counts
      </text>

      {L.stackNote ? (
        <text style={{ fill: MUTED, fontFamily: HAND, fontSize: 16 }}>
          <tspan x={L.stackNote[0]} y={L.stackNote[1]}>
            every provider gets
          </tspan>
          <tspan x={L.stackNote[0]} dy={20}>
            the same {track.tasks} tasks
          </tspan>
        </text>
      ) : null}

      <text style={{ fill: MUTED, fontFamily: HAND, fontSize: 16 }}>
        <tspan x={L.limits[0]} y={L.limits[1]}>
          up to {limits.calls} {limits.calls === 1 ? "call" : "calls"},
        </tspan>
        <tspan x={L.limits[0]} dy={19}>
          {limits.seconds >= 120 ? `${limits.seconds / 60} min` : `${limits.seconds} s`}, ${limits.usd.toFixed(2)}
        </tspan>
      </text>
    </svg>
  );
}
