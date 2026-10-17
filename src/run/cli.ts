import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { taskSchema } from "../core/schema.ts";
import { runProviderSchema } from "./result.ts";
import { runBenchmark } from "./index.ts";
const { values } = parseArgs({
  options: {
    tasks: { type: "string" },
    providers: { type: "string" },
    lane: { type: "string", default: "default" },
    mode: { type: "string", default: "both" },
    client: { type: "string", default: "local" },
    sample: { type: "string" },
    seed: { type: "string", default: "1" },
    concurrency: { type: "string", default: "4" },
    "run-id": { type: "string" },
    "provider-config": { type: "string" },
    "oracle-text-file": { type: "string" },
  },
});
try {
  const files = z.string().min(1).parse(values.tasks).split(",");
  const tasks = (
    await Promise.all(
      files.map(async (file) =>
        z.array(taskSchema).parse(JSON.parse(await readFile(file, "utf8"))),
      ),
    )
  ).flat();
  const positive = z.coerce.number().int().positive();
  const providers = z
    .array(runProviderSchema)
    .min(1)
    .parse(values.providers?.split(","));
  if (new Set(providers).size !== providers.length)
    throw new Error("Duplicate providers");
  const config = values["provider-config"]
    ? z
        .partialRecord(
          runProviderSchema,
          z.object({
            concurrency: positive.default(2),
            perSecond: z.number().positive().default(1),
            burst: positive.default(1),
            maxUsd: z.number().nonnegative().default(10),
            maxCallUsd: z.number().nonnegative().optional(),
            apiMaxUsd: z.number().nonnegative().optional(),
          }),
        )
        .parse(JSON.parse(await readFile(values["provider-config"], "utf8")))
    : undefined;
  const result = await runBenchmark({
    tasks,
    providers,
    lane: z.enum(["default", "tuned"]).parse(values.lane),
    mode: z.enum(["agent", "raw", "both"]).parse(values.mode),
    client: values.client ?? "local",
    sample: values.sample ? positive.parse(values.sample) : undefined,
    seed: z.coerce.number().int().parse(values.seed),
    concurrency: positive.parse(values.concurrency),
    runId: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
      .parse(
        values["run-id"] ?? new Date().toISOString().replace(/[^\dTZ]/g, ""),
      ),
    providerConfig: config,
    oracleText: values["oracle-text-file"]
      ? await readFile(values["oracle-text-file"], "utf8")
      : undefined,
  });
  process.stdout.write(JSON.stringify(result) + "\n");
} catch (error) {
  process.stderr.write(
    JSON.stringify({
      error:
        error instanceof z.ZodError
          ? "Invalid CLI/tasks/config; check schema"
          : error instanceof Error
            ? error.message
            : "Benchmark failed",
    }) + "\n",
  );
  process.exitCode = 1;
}
