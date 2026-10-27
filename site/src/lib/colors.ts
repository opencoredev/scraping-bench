/** Each provider keeps one colour everywhere, so it can be followed from chart to chart. */
export const PROVIDER_COLORS: Record<string, string> = {
  you: "oklch(0.8 0.14 175)",
  contextdev: "oklch(0.8 0.15 75)",
  firecrawl: "oklch(0.7 0.17 42)",
  tinyfish: "oklch(0.8 0.12 200)",
  parallel: "oklch(0.8 0.16 160)",
  jina: "oklch(0.72 0.19 350)",
  spider: "oklch(0.65 0.2 25)",
  linkup: "oklch(0.68 0.16 255)",
  scrapfly: "oklch(0.68 0.19 300)",
  browserbase: "oklch(0.78 0.17 135)",
  string: "oklch(0.86 0.07 95)",
};
export const colorOf = (providerId: string) => PROVIDER_COLORS[providerId] ?? "var(--muted-foreground)";
