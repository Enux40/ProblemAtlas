export const siteName = "ProblemAtlas";
export const siteDescription =
  "A curated atlas of real-world software problems worth solving.";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getAbsoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function buildPageTitle(title?: string) {
  return title ? `${title} | ${siteName}` : siteName;
}
