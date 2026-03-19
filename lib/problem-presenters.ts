import { BuildTimeUnit, MonetizationType } from "@prisma/client";

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatBuildTime(value: number, unit: BuildTimeUnit) {
  const unitLabel = unit.toLowerCase();
  const singular =
    unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1, unitLabel.length - 1);
  const plural = unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1);

  return `${value} ${value === 1 ? singular : plural}`;
}

export function getMonetizationIdea(type: MonetizationType) {
  switch (type) {
    case MonetizationType.SUBSCRIPTION:
      return "Charge a recurring monthly or annual fee tied to seats, locations, or workflow volume.";
    case MonetizationType.ONE_TIME_LICENSE:
      return "Offer a one-time implementation or perpetual-license option for budget-sensitive buyers.";
    case MonetizationType.USAGE_BASED:
      return "Price on active records, shipments, messages, or automation runs as customer usage scales.";
    case MonetizationType.LEAD_GEN:
      return "Monetize qualified introductions or buyer demand routed through the workflow.";
    case MonetizationType.AGENCY_UPSELL:
      return "Bundle the software into a higher-value agency or service retainer.";
    case MonetizationType.TRANSACTION_FEE:
      return "Take a fee on money movement or workflow transactions completed through the platform.";
    default:
      return "Package the workflow around clear operational ROI and price against time saved.";
  }
}
