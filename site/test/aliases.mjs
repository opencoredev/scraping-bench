// Lets `node --test` load site modules the way Next does: `@/` points at src/, imports omit `.ts`, JSON imports need no attribute.
import { statSync } from "node:fs";
import { registerHooks } from "node:module";

const src = new URL("../src/", import.meta.url);
const isFile = (url) => statSync(url, { throwIfNoEntry: false })?.isFile() ?? false;

registerHooks({
  resolve(specifier, context, next) {
    if (!specifier.startsWith("@/")) return next(specifier, context);
    const base = new URL(specifier.slice(2), src).href;
    const url = ["", ".ts"].map((ext) => new URL(base + ext)).find(isFile);
    if (!url) return next(specifier, context);
    if (url.pathname.endsWith(".json")) return { url: url.href, format: "json", importAttributes: { type: "json" }, shortCircuit: true };
    return { url: url.href, format: url.pathname.endsWith(".ts") ? "module-typescript" : undefined, shortCircuit: true };
  },
});
