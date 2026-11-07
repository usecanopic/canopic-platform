import { Section } from "./Section";

/** The four facts with a number at their heart, set large. */
const HEADLINE = [
  { label: "Network status", fig: "Live", note: "since 1 July 2026" },
  { label: "Blocks every", fig: "~250 ms", note: "with 100 ms preconfirmations" },
  { label: "Typical gas", fig: "~$0.001", note: "median per transaction, in ETH" },
  { label: "Listed equities", fig: "2,000+", note: "each one a standard ERC-20" },
] as const;

/** The rest of the datasheet. */
const SPECS = [
  { label: "Built on", value: "Arbitrum Nitro, fully EVM-equivalent" },
  { label: "Data availability", value: "Blobs posted to Ethereum" },
  { label: "Token issuer", value: "Each token fully backed by Robinhood Assets (Jersey) Ltd" },
  { label: "Splits and dividends", value: "Handled by ERC-8056 uiMultiplier()" },
  { label: "Price data", value: "Chainlink feeds and Streams, which also report the session" },
  { label: "Settlement currency", value: "USDG from Paxos, issued natively, MiCA-regulated" },
  { label: "Wallets", value: "ERC-4337 and EIP-7702, with gas covered on your first trade" },
  { label: "Block explorer", value: "Every trade opens on Blockscout" },
] as const;

const REASONS = [
  "Any wallet can hold and trade a Stock Token directly, since the issuer runs no allowlist on these plain ERC-20s.",
  "The session signal that drives spreads arrives through the oracle, the very feed that sets each price.",
  "Sub-cent transactions make small trades worthwhile and let quotes update ten times a second.",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** The venue's underlying chain, laid out as a spec sheet on a night band: four headline figures, then the datasheet. */
export function ChainBand() {
  return (
    <Section
      id="network"
      kicker="Network"
      tone="night"
      title={
        <>
          Built on the chain that <em className="italic">issues the stocks</em>
        </>
      }
      lede="On Robinhood Chain, and nowhere else, a regulated broker mints tokenized shares as standard ERC-20s. Chainlink prices them, anyone can deploy against them, and the broker's own customer base sits behind them."
    >
      <dl className="grid gap-px overflow-hidden rounded-[20px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {HEADLINE.map((h) => (
          <div key={h.label} className="flex min-h-[188px] flex-col bg-cp-night-2 p-6">
            <dt className="text-[13px] font-medium text-white/55">{h.label}</dt>
            <dd className="mt-auto pt-8">
              <span className="block font-serif text-[clamp(44px,4.6vw,58px)] leading-none tracking-[-0.02em] text-white">{h.fig}</span>
              <span className="mt-3 block text-[14px] text-white/55">{h.note}</span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-7">
          <span className="text-[14px] font-semibold text-white">Technical details</span>
          <span className="num text-[12px] text-white/45">{SPECS.length} items</span>
        </div>
        <dl className="grid md:grid-cols-2">
          {SPECS.map((s, i) => (
            <div
              key={s.label}
              className={
                "flex items-baseline gap-4 border-white/10 px-6 py-4 md:px-7" +
                (i > 0 ? " border-t" : "") +
                (i === 1 ? " md:border-t-0" : "") +
                (i % 2 === 1 ? " md:border-l" : "")
              }
            >
              <dt className="flex min-w-0 flex-1 items-baseline gap-4">
                <span className="shrink-0 text-[13.5px] text-white/55">{s.label}</span>
                <span className="hidden flex-1 border-b border-dotted border-white/15 sm:block" aria-hidden="true" />
              </dt>
              <dd className="text-right text-[13.5px] font-medium text-white">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ol className="mt-14 grid gap-8 md:grid-cols-3">
        {REASONS.map((r, i) => (
          <li key={r} className="relative border-t border-white/15 pt-5">
            <span className="absolute -top-px left-0 h-px w-12 bg-[#86efac]" aria-hidden="true" />
            <span className="num text-[13px] font-medium text-[#86efac]">{pad(i + 1)}</span>
            <p className="mt-3 text-[15px] leading-[1.65] text-white/70">{r}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
