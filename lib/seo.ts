export const siteName = "ProblemAtlas";
export const siteDescription =
  "A curated atlas of real-world software problems worth solving.";

function normalizeSiteUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const explicitSiteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

  if (explicitSiteUrl) {
    return explicitSiteUrl;
  }

  const productionUrl =
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteUrl(process.env.VERCEL_URL);

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
