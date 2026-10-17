import {
  appendFile,
  mkdir,
  readFile,
  writeFile,
  open,
  unlink,
} from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
import { resultSchema, type RunResult } from "./result.ts";
export class Storage {
  readonly directory: string;
  readonly privateDirectory: string;
  private queue = Promise.resolve();
  readonly runId: string;
  constructor(root: string, runId: string) {
    this.runId = runId;
    this.directory = join(root, runId);
    this.privateDirectory = join(root, "raw-private", runId);
  }
  async init() {
    await mkdir(this.directory, { recursive: true });
    await mkdir(this.privateDirectory, { recursive: true, mode: 0o700 });
  }
  async lines(file: string): Promise<unknown[]> {
    try {
      const path = join(this.directory, file);
      const body = await readFile(path, "utf8");
      const end = body.lastIndexOf("\n") + 1;
      // Only newline-terminated records are committed. Remove a partial crash tail.
      if (end < body.length) await writeFile(path, body.slice(0, end));
      return body
        .slice(0, end)
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT")
        return [];
      throw error;
    }
  }
  async rows(): Promise<RunResult[]> {
    return (await this.lines("results.jsonl")).map((value) =>
      resultSchema.parse(value),
    );
  }
  async jsonl(file: string, value: unknown) {
    const line = JSON.stringify(value) + "\n";
    this.queue = this.queue.then(() =>
      appendFile(join(this.directory, file), line),
    );
    await this.queue;
  }
  async privateBody(
    value: unknown,
  ): Promise<{ responseHash: string; privatePath: string }> {
    const body = JSON.stringify(value);
    const responseHash = createHash("sha256").update(body).digest("hex");
    const name = `${randomUUID()}.json`;
    await writeFile(join(this.privateDirectory, name), body, { mode: 0o600 });
    return { responseHash, privatePath: `raw-private/${this.runId}/${name}` };
  }
}

export async function acquireLock(path: string) {
  try {
    const file = await open(path, "wx");
    await file.writeFile(JSON.stringify({ pid: process.pid }));
    return file;
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST"))
      throw error;
    const owner: unknown = JSON.parse(await readFile(path, "utf8"));
    if (
      typeof owner !== "object" ||
      owner === null ||
      !("pid" in owner) ||
      typeof owner.pid !== "number"
    )
      throw new Error("Run lock has no valid owner; inspect .lock manually");
    try {
      process.kill(owner.pid, 0);
    } catch (aliveError) {
      if (
        aliveError instanceof Error &&
        "code" in aliveError &&
        aliveError.code === "ESRCH"
      ) {
        await unlink(path);
        const file = await open(path, "wx");
        await file.writeFile(JSON.stringify({ pid: process.pid }));
        return file;
      }
      throw aliveError;
    }
    throw new Error("Run is locked by a live process");
  }
}
