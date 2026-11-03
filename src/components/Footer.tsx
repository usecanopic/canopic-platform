import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NAV_LINKS, SITE } from "@/lib/site";

const PRODUCT = [
  { label: "Dashboard", href: SITE.appHref },
  { label: "Trade", href: "/platform/swap" },
  { label: "Vaults", href: "/platform/liquidity" },
  { label: "Ledger", href: "/platform/explorer" },
] as const;

const SECTIONS = NAV_LINKS.map((l) => ({ label: l.label, href: l.href }));

const OUTSIDE = [
  { label: `X · ${SITE.xHandle}`, href: SITE.xUrl },
  { label: "GitHub", href: SITE.githubUrl },
  { label: "Email the team", href: `mailto:${SITE.contactEmail}` },
] as const;

/** Mark and one line of purpose on the left, three link columns on the right, small print beneath. */
export function Footer() {
  return (
    <footer className="border-t border-cp-line bg-cp-canvas">
      <div className="page pb-10 pt-16 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo size={28} />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-cp-ink-3">
              Canopic lets you trade tokenized stocks on Robinhood Chain without handing over custody. Quotes follow
              the oracle, and every trade clears in USDG within a single transaction.
            </p>
          </div>
          <Column title="App" links={PRODUCT} />
          <Column title="Read more" links={SECTIONS} />
          <Column title="Find us" links={OUTSIDE} external />
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-cp-line pt-6 text-[13px] text-cp-ink-4 sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; 2026 Canopic</span>
          <span className="inline-flex items-center gap-2">
            Running on Robinhood Chain
          </span>
        </div>
      </div>
    </footer>
  );
}

function Column({
  title,
  links,
  external = false,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
  external?: boolean;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-cp-ink">{title}</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            {external ? (
              <a
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-[14px] text-cp-ink-3 transition-colors hover:text-cp-ink"
              >
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="text-[14px] text-cp-ink-3 transition-colors hover:text-cp-ink">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
