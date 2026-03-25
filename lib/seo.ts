export const siteName = "ProblemAtlas";
export const siteDescription =
  "A curated atlas of real-world software problems worth solving.";

export function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (explicitSiteUrl) {
    return explicitSiteUrl;
  }

  const productionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ?? process.env.VERCEL_URL?.trim();

  if (productionUrl) {
    return productionUrl.startsWith("http") ? productionUrl : `https://${productionUrl}`;
  }

  return "http://localhost:3000";
}

export function getAbsoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function buildPageTitle(title?: string) {
  return title ? `${title} | ${siteName}` : siteName;
}
