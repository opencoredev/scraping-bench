import assert from "node:assert/strict";
import { test } from "node:test";
import { providers } from "@/lib/catalog";

test("providers rank by jobs run (capped at 3), then overall rate, then mean rate", () => {
  assert.deepEqual(
    providers.map((p) => p.label),
    ["Context.dev", "Firecrawl", "String", "Scrapfly", "Linkup", "TinyFish", "Browserbase", "You.com", "Spider", "Jina Reader"],
  );
});
