/** Brand constants used throughout the site. */
export const SITE = {
  name: "Canopic",
  domain: "usecanopic.com",
  url: "https://usecanopic.com",
  xHandle: "@usecanopic",
  xUrl: "https://x.com/usecanopic",
  githubUrl: "https://github.com/usecanopic",
  contactEmail: "hello@usecanopic.com",
  appHref: "/platform",
} as const;

/** Homepage sections, in reading order. */
export const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Price formula", href: "#formula" },
  { label: "Market hours", href: "#hours" },
  { label: "Versus pools", href: "#versus" },
  { label: "Network", href: "#network" },
  { label: "Guarantees", href: "#guarantees" },
  { label: "Help", href: "#help" },
] as const;

/** The header carries only the main destinations; the footer links to every section. */
export const HEADER_LINKS = NAV_LINKS.filter((l) => ["Platform", "Price formula", "Market hours", "Help"].includes(l.label));
