/** Providers that asked for their name to link to their site. UTM parameters let them see the referral. */
export const PROVIDER_LINKS: Record<string, string> = {
  contextdev: "https://context.dev/?utm_source=scrapingbench&utm_medium=referral&utm_campaign=benchmark",
};
export const linkOf = (providerId: string): string | undefined => PROVIDER_LINKS[providerId];
