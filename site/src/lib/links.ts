const UTM = "utm_source=scrapingbench&utm_medium=referral&utm_campaign=benchmark";

/** Each provider's homepage, linked from its name. UTM parameters let providers see the referral. */
const HOMEPAGES: Record<string, string> = {
  contextdev: "https://context.dev/",
  firecrawl: "https://www.firecrawl.dev/",
  tinyfish: "https://www.tinyfish.ai/",
  linkup: "https://www.linkup.so/",
  jina: "https://jina.ai/",
  spider: "https://spider.cloud/",
  scrapfly: "https://scrapfly.io/",
  browserbase: "https://www.browserbase.com/",
  you: "https://you.com/",
  string: "https://usestring.ai/",
};
export const linkOf = (providerId: string): string | undefined => {
  const home = HOMEPAGES[providerId];
  return home ? `${home}?${UTM}` : undefined;
};
