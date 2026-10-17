import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { json } from "../src/tasks/io.ts";
import { resolve } from "../src/tasks/resolve.ts";
import { provenanceSchema, taskSchema } from "../src/tasks/schema.ts";

/**
 * Re-fetches every real-web answer key used in the final run and compares it with the frozen key, exactly.
 * Run with --refresh so nothing comes from the disk cache. Fixture-site keys are our own data and are not refetched.
 */

if (!process.argv.includes("--refresh")) throw new Error("Run with --refresh to bypass the disk cache");
const SETS = [
  "results/campaign-20261017-search60/test-search.json",
  "results/campaign-20261017/test-scrape.json",
  "results/campaign-20261017/test-map.json",
  "results/campaign-20261017/test-crawl.json",
];
const provenance = provenanceSchema.parse(json(await readFile("tasks/provenance.json", "utf8")));
const tasks = (await Promise.all(SETS.map(async (f) => z.array(taskSchema).parse(json(await readFile(f, "utf8")))))).flat();
const real = tasks.filter((t) => t.source.kind === "authoritative");

let same = 0;
const problems: string[] = [];
for (const task of real) {
  const recipe = provenance.recipes[task.id];
  if (!recipe) {
    problems.push(`${task.id}: no recipe`);
    continue;
  }
  // Wikidata rate-limits bursts; retry a couple of times with a pause.
  for (let attempt = 1; ; attempt++) {
    try {
      const live = await resolve(recipe);
      if (isDeepStrictEqual(live.expected, task.expected)) same++;
      else problems.push(`${task.id}: CHANGED frozen=${JSON.stringify(task.expected)} live=${JSON.stringify(live.expected)}`);
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt < 3 && /429/.test(message)) {
        await new Promise((r) => setTimeout(r, 15_000 * attempt));
        continue;
      }
      problems.push(`${task.id}: ERROR ${message.slice(0, 200)}`);
      break;
    }
  }
}
process.stdout.write(`${problems.join("\n")}\nUnchanged ${same}/${real.length}\n`);
