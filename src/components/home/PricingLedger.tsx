import { Cpu, RotateCcw, Scale } from "lucide-react";
import { Section } from "./Section";

const MID = 177.4;
const PRICE = (MID * 1.001) / (1 - 0.0002); // half-spread applied to the mid, fee taken from the quote side
const BAND_BPS = 75;
const PRICE_BPS = ((PRICE - MID) / MID) * 10_000; // where the worked price sits inside the band

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const LINES = [
  {
    op: "",
    term: "oracle mid",
    figure: `${fmt(MID)} USDG`,
    note: "The Chainlink reading after it passes the guards. If a round comes back zero, out of date or implausible, the market pauses rather than trading on it.",
  },
  {
    op: "+",
    term: "half-spread × session",
    figure: "10.0 bps at ×1.0",
    note: "Each tier sets a base half-spread (Tier A uses 10 bps), which the session then scales: ×1.0 in regular hours, ×1.5 before and after them, ×3.0 when the exchange is shut.",
  },
  {
    op: "±",
    term: "inventory skew",
    figure: "+0 bps",
    note: "When a vault drifts away from holding half token and half USDG, trades that bring it back get a better price, up to ±15 bps on Tier A.",
  },
  {
    op: "+",
    term: "venue fee",
    figure: "2.0 bps",
    note: "Appears as a separate line on the quote and as its own field in the emitted fill event, never folded into the price.",
  },
] as const;

const GUARANTEES = [
  {
    icon: Cpu,
    title: "Checked again at execution",
    body: "Inside your transaction, the router works the vault price out afresh from the oracle and the vault's state. Whatever app you use, it cannot give you a worse deal than the formula allows.",
  },
  {
    icon: Scale,
    title: "Makers have to beat it",
    body: "A signed RFQ quote from an attested maker wins only if it gives you more than the vault price. Quotes that lose cost the maker nothing, which keeps them coming.",
  },
  {
    icon: RotateCcw,
    title: "Your limits are binding",
    body: "Every order carries the slippage limit and expiry you signed. Should the market move beyond either before the block lands, the trade is cancelled instead of executed.",
  },
] as const;

/** An operator sitting in the gutter between two terms: above the card when stacked, to its left in a row. */
function Operator({ op }: { op: string }) {
  return (
    <span
      className="absolute left-1/2 top-0 z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cp-line bg-cp-paper text-[15px] font-medium leading-none text-cp-accent-ink shadow-[var(--shadow-sheet)] lg:-left-2 lg:top-1/2 lg:-translate-x-1/2"
      aria-hidden="true"
    >
      {op}
    </span>
  );
}

export function PricingLedger() {
  const marker = 50 + (PRICE_BPS / BAND_BPS) * 50; // percent along a -75 to +75 bps track

  return (
    <Section
      id="formula"
      kicker="Price formula"
      tone="paper"
      title={
        <>
          One <em className="italic">open</em> equation behind every quote
        </>
      }
      lede="Quotes come out of fixed arithmetic applied to data that lives on-chain. Take the same inputs and you will arrive at the same number Canopic did."
    >
      {/* The equation, written out once */}
      <div className="flex flex-col gap-3 rounded-[16px] border border-cp-line bg-cp-canvas px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="caps">The formula</span>
        <p className="font-mono text-[clamp(13px,1.8vw,16px)] leading-relaxed text-cp-ink">
          quote <span className="text-cp-accent-ink">=</span> oracle mid <span className="text-cp-accent-ink">+</span> half-spread{" "}
          <span className="text-cp-accent-ink">×</span> session <span className="text-cp-accent-ink">±</span> skew{" "}
          <span className="text-cp-accent-ink">+</span> venue fee
        </p>
      </div>

      {/* Each term as its own sheet */}
      <ol className="mt-8 grid gap-6 lg:mt-4 lg:grid-cols-4 lg:gap-4">
        {LINES.map((l, i) => (
          <li key={l.term} className="card relative flex flex-col p-6">
            {l.op && <Operator op={l.op} />}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium text-cp-ink-3">{l.term}</span>
              <span className="text-[11.5px] text-cp-ink-4">Part {i + 1}</span>
            </div>
            <p className="num mt-5 text-[26px] font-semibold leading-none tracking-[-0.03em] text-cp-ink">{l.figure}</p>
            <div className="rule my-5" />
            <p className="text-[14.5px] leading-relaxed text-cp-ink-3">{l.note}</p>
          </li>
        ))}
      </ol>

      {/* The result, held inside its band */}
      <div className="card-stage relative mt-6 grid gap-8 p-6 sm:p-8 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
        <span
          className="absolute left-1/2 top-0 z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-cp-accent text-[15px] font-semibold leading-none text-cp-ink shadow-[0_6px_16px_-6px_rgb(74_222_128/0.6)]"
          aria-hidden="true"
        >
          =
        </span>
        <div>
          <span className="kicker">The quote you get</span>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="num text-[clamp(44px,6vw,64px)] font-semibold leading-none tracking-[-0.045em] text-cp-ink">{fmt(PRICE)}</span>
            <span className="text-[14px] font-medium text-cp-ink-4">USDG</span>
          </p>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-cp-ink-3">
            A fixed guard rail sits around it. Should anything upstream misbehave, a Tier A trade still cannot clear more than 75 bps away from the mid.
          </p>
        </div>

        <figure aria-label={`The quote sits ${PRICE_BPS.toFixed(1)} bps above the mid, inside a guard of ${BAND_BPS} bps either way`}>
          <div className="flex justify-between text-[12px] text-cp-ink-4" aria-hidden="true">
            <span>-{BAND_BPS} bps</span>
            <span>mid</span>
            <span>+{BAND_BPS} bps</span>
          </div>
          <div className="relative mt-3 h-12" aria-hidden="true">
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-cp-sunk" />
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-cp-line-strong"
                style={{ left: `${(i / 6) * 100}%` }}
              />
            ))}
            <span className="absolute left-1/2 top-0 h-full w-px bg-cp-ink-3" />
            <span
              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-cp-accent/40"
              style={{ left: "50%", width: `${marker - 50}%` }}
            />
            <span
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-cp-accent shadow-[0_2px_8px_rgb(74_222_128/0.45)]"
              style={{ left: `${marker}%` }}
            />
          </div>
          <figcaption className="mt-3 flex items-center justify-between gap-4 text-[12.5px]">
            <span className="text-cp-ink-3">mid at {fmt(MID)}</span>
            <span className="num font-semibold text-cp-ink">+{PRICE_BPS.toFixed(1)} bps</span>
          </figcaption>
        </figure>
      </div>

      <ol className="mt-16 grid gap-x-10 gap-y-10 md:grid-cols-3">
        {GUARANTEES.map((g) => (
          <li key={g.title}>
            <span className="grid size-10 place-items-center rounded-[10px] bg-cp-accent-soft text-cp-accent-ink">
              <g.icon className="size-[18px]" aria-hidden="true" />
            </span>
            <h3 className="h-card mt-5 text-[18px] text-cp-ink">{g.title}</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-cp-ink-3">{g.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
