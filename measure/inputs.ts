// Loads the frozen v2 campaign artifacts and indexes every stored provider call.
// This is the only module that reads campaign files; everything after it works on typed data.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { z } from "zod";
import { outcomeSchema, taskSchema } from "../src/core/schema.ts";
import type { Task, ToolOutcome, Track } from "../src/core/types.ts";

export const TRACKS = ["scrape", "search", "map", "crawl"] as const satisfies readonly Track[];
export const RESULTS_ROOT = process.env.WEB_BENCH_RESULTS_ROOT ?? "/home/leo/web-bench/results";

const sha256 = (body: Buffer | string) => createHash("sha256").update(body).digest("hex");
const readJson = async (path: string): Promise<unknown> => JSON.parse(await readFile(path, "utf8"));
const readLines = async (path: string): Promise<unknown[]> =>
  (await readFile(path, "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line));

const providerEventSchema = z.object({
  taskId: z.string(),
  provider: z.string(),
  mode: z.enum(["agent", "raw"]),
  kind: z.literal("provider"),
  request: z.unknown(),
  responseHash: z.string(),
  privatePath: z.string(),
});
const eventSchema = z.object({ kind: z.string() }).passthrough();
const rowSchema = z.object({ taskId: z.string(), provider: z.string(), mode: z.string(), site: z.string(), track: z.string() }).passthrough();
const summarySchema = z.object({
  tracks: z.record(z.string(), z.object({ eligibleProviders: z.array(z.string()), fullProviders: z.array(z.string()) })),
});

/** One provider call the agent made in the original run, with its stored response loaded on demand. */
export type StoredCall = {
  readonly index: number;
  readonly args: unknown;
  readonly privatePath: string;
  readonly responseHash: string;
  readonly load: () => Promise<ToolOutcome>;
};

/** Everything the original run recorded for one (task, provider) pair. */
export type Attempt = {
  readonly taskId: string;
  readonly provider: string;
  readonly runId: string;
  readonly calls: readonly StoredCall[];
};

export type TrackData = {
  readonly track: Track;
  readonly tasks: ReadonlyMap<string, Task>;
  /** Core IDs that survived post-run exclusions. Every eligible provider has an attempt for each. */
  readonly core: readonly string[];
  /** Retained full-set IDs. */
  readonly full: readonly string[];
  readonly coreProviders: readonly string[];
  readonly fullProviders: readonly string[];
  /** provider -> taskId -> attempt, for every stored agent row in the selected runs. */
  readonly attempts: ReadonlyMap<string, ReadonlyMap<string, Attempt>>;
  /** Original model-alone rows, which no cut ever applied to. taskId -> success. */
  readonly none: ReadonlyMap<string, boolean>;
};

export type Dataset = {
  readonly tracks: Readonly<Record<Track, TrackData>>;
  /** Stored oracle outcome per scrape task: the page's HTML title and first H1, or rendered text for fixtures. */
  readonly oracle: ReadonlyMap<string, StoredCall>;
  readonly sourceHashes: Readonly<Record<string, string>>;
};

const CONTROLS = ["none", "oracle"];

export async function loadDataset(root = RESULTS_ROOT): Promise<Dataset> {
  const sourceHashes: Record<string, string> = {};
  const hashed = async (path: string) => {
    const body = await readFile(join(root, path));
    sourceHashes[path] = sha256(body);
    return body;
  };
  const selected = z.record(z.string(), z.string()).parse(JSON.parse((await hashed("campaign-v2/selected-runs.json")).toString()));
  const summary = summarySchema.parse(JSON.parse((await hashed("wb-v2-final/summary.json")).toString()));

  const storedCall = (index: number, event: z.infer<typeof providerEventSchema>, runId: string): StoredCall => {
    if (!event.privatePath.startsWith(`raw-private/${runId}/`) || event.privatePath.includes(".."))
      throw new Error(`Invalid private path for ${runId}: ${event.privatePath}`);
    return {
      index,
      args: event.request,
      privatePath: event.privatePath,
      responseHash: event.responseHash,
      load: async () => {
        const body = await readFile(join(root, event.privatePath));
        if (sha256(body) !== event.responseHash) throw new Error(`Stored response hash mismatch: ${event.privatePath}`);
        return outcomeSchema.parse(JSON.parse(body.toString()));
      },
    };
  };

  const attemptsByTrack = new Map<Track, Map<string, Map<string, Attempt>>>();
  const noneByTrack = new Map<Track, Map<string, boolean>>();
  const oracle = new Map<string, StoredCall>();
  for (const [key, runId] of Object.entries(selected)) {
    const [, trackName, provider] = key.split("/");
    const track = z.enum(TRACKS).parse(trackName);
    const events = (await readLines(join(root, runId, "calls.jsonl"))).map((e) => eventSchema.parse(e));
    sourceHashes[`${runId}/calls.jsonl`] = sha256(await readFile(join(root, runId, "calls.jsonl")));
    if (provider === "none") {
      const rows = (await readLines(join(root, runId, "results.jsonl"))).map((r) => rowSchema.extend({ success: z.boolean() }).parse(r));
      noneByTrack.set(track, new Map(rows.filter((r) => r.mode === "agent").map((r) => [r.taskId, r.success])));
      continue;
    }
    const providerEvents = events.flatMap((e) => (e.kind === "provider" ? [providerEventSchema.parse(e)] : [])).filter((e) => e.mode === "agent");
    if (provider === "oracle") {
      // The control agent sometimes asked twice; every oracle response for a page is the same evidence, so the first is used.
      for (const event of providerEvents) if (!oracle.has(event.taskId)) oracle.set(event.taskId, storedCall(0, event, runId));
      continue;
    }
    if (provider === undefined || CONTROLS.includes(provider)) throw new Error(`Unexpected selected run ${key}`);
    // File order is call order: the runner appends each event as it happens.
    const byTask = new Map<string, z.infer<typeof providerEventSchema>[]>();
    for (const event of providerEvents) {
      if (event.provider !== provider) throw new Error(`Run ${runId} holds a call for ${event.provider}`);
      byTask.set(event.taskId, [...(byTask.get(event.taskId) ?? []), event]);
    }
    const trackAttempts = attemptsByTrack.get(track) ?? new Map<string, Map<string, Attempt>>();
    trackAttempts.set(
      provider,
      new Map([...byTask].map(([taskId, list]) => [taskId, { taskId, provider, runId, calls: list.map((e, i) => storedCall(i, e, runId)) }])),
    );
    attemptsByTrack.set(track, trackAttempts);
  }

  const buildTrack = async (track: Track): Promise<TrackData> => {
    const tasks = z.array(taskSchema).parse(JSON.parse((await hashed(`wb-v2-corrected/tasks/${track}.json`)).toString()));
    const retained = new Set(tasks.map((t) => t.id));
    const coreFile = z.array(z.object({ id: z.string() }).passthrough()).parse(JSON.parse((await hashed(`campaign-v2/core-${track}.json`)).toString()));
    const core = coreFile.map((t) => t.id).filter((id) => retained.has(id));
    const eligible = summary.tracks[track];
    if (!eligible) throw new Error(`No eligibility for ${track}`);
    const attempts = attemptsByTrack.get(track) ?? new Map();
    const coreProviders = eligible.eligibleProviders.filter((p) => !CONTROLS.includes(p));
    const fullProviders = eligible.fullProviders.filter((p) => !CONTROLS.includes(p));
    for (const provider of coreProviders)
      for (const id of core)
        if (!attempts.get(provider)?.get(id)?.calls.length) throw new Error(`No stored first call for core ${track} ${provider} ${id}`);
    return {
      track,
      tasks: new Map(tasks.map((t) => [t.id, t])),
      core,
      full: tasks.map((t) => t.id),
      coreProviders,
      fullProviders,
      attempts,
      none: noneByTrack.get(track) ?? new Map(),
    };
  };
  const tracks: Record<Track, TrackData> = {
    scrape: await buildTrack("scrape"),
    search: await buildTrack("search"),
    map: await buildTrack("map"),
    crawl: await buildTrack("crawl"),
  };
  for (const id of tracks.scrape.full) if (!oracle.has(id)) throw new Error(`No oracle outcome for ${id}`);
  return { tracks, oracle, sourceHashes };
}
