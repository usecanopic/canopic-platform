import { Check, Minus } from "lucide-react";
import { Section } from "./Section";

const ROWS = [
  { what: "Where prices come from", them: "Set by whatever ratio the reserves are in", us: "Tied to the Chainlink mid and held within a fixed guard" },
  { what: "Saturday and Sunday", them: "Quoted exactly as on any weekday", us: "Off-hours pricing widens spreads and shrinks clips, and the quote says so" },
  { what: "Depositor income", them: "Lost to arbitrage whenever the real price shifts", us: "Depositors keep the spread, and skew pays traders who rebalance the vault" },
  { what: "Stock splits", them: "The pool breaks or has to be migrated", us: "Quoting halts and comes back once the feed reflects the split" },
  { what: "Large orders", them: "Pay more the further they push along the curve", us: "Attract competing signed quotes from makers" },
  { what: "Charges", them: "Folded invisibly into the curve", us: "Broken out on each quote and logged in the fill event" },
] as const;

export function CompareTable() {
  return (
    <Section
      id="versus"
      kicker="Versus pools"
      tone="canvas"
      title={
        <>
          Why ordinary AMMs <em className="italic">misprice</em> real stocks
        </>
      }
      lede="A constant-product pool works for tokens that only trade on-chain. It falls apart when the true price is set on a stock exchange, as shallow pools showed when they quoted tokenized shares at large premiums around their 2025 debut."
    >
      {/* Desktop: a three-column matrix with the Canopic column raised on its own sheet. */}
      <div className="relative hidden md:block">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[40%] rounded-[20px] border border-cp-line bg-cp-paper shadow-[var(--shadow-stage)]"
          aria-hidden="true"
        />
        <table className="relative w-full table-fixed border-separate border-spacing-0 text-left">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[40%]" />
            <col className="w-[40%]" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="caps px-6 pb-5 pt-7 align-bottom">Topic</th>
              <th scope="col" className="px-6 pb-5 pt-7 align-bottom font-normal">
                <span className="text-[13px] font-medium text-cp-ink-4">Typical DEX</span>
                <span className="h-card mt-2 block text-[18px] text-cp-ink-3">x·y=k pool</span>
              </th>
              <th scope="col" className="px-7 pb-5 pt-7 align-bottom font-normal">
                <span className="kicker">Oracle-priced</span>
                <span className="h-card mt-2 block text-[18px] text-cp-ink">Canopic</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={r.what} className="align-top">
                <th scope="row" className="border-t border-cp-line px-6 py-5 text-[15px] font-semibold text-cp-ink">
                  {r.what}
                </th>
                <td className="border-t border-cp-line px-6 py-5">
                  <span className="flex gap-3 text-[14.5px] leading-relaxed text-cp-ink-3">
                    <Minus className="mt-[3px] size-4 shrink-0 text-cp-ink-4" aria-hidden="true" />
                    {r.them}
                  </span>
                </td>
                <td className={"border-t border-cp-line px-7 py-5" + (i === ROWS.length - 1 ? " pb-7" : "")}>
                  <span className="flex gap-3 text-[14.5px] leading-relaxed text-cp-ink">
                    <span className="mt-[2px] grid size-[18px] shrink-0 place-items-center rounded-full bg-cp-accent text-cp-ink">
                      <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {r.us}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per property, the two answers stacked. */}
      <ul className="flex flex-col gap-4 md:hidden">
        {ROWS.map((r) => (
          <li key={r.what} className="card overflow-hidden">
            <div className="card-head">
              <h3 className="h-card text-[16px] text-cp-ink">{r.what}</h3>
            </div>
            <dl className="divide-hair">
              <div className="flex gap-3 px-5 py-4">
                <Minus className="mt-[3px] size-4 shrink-0 text-cp-ink-4" aria-hidden="true" />
                <div>
                  <dt className="text-[12.5px] font-medium text-cp-ink-4">x·y=k pool</dt>
                  <dd className="mt-1.5 text-[14.5px] leading-relaxed text-cp-ink-3">{r.them}</dd>
                </div>
              </div>
              <div className="flex gap-3 bg-cp-accent-soft/60 px-5 py-4">
                <Check className="mt-[3px] size-4 shrink-0 text-cp-accent-ink" aria-hidden="true" />
                <div>
                  <dt className="text-[12.5px] font-medium text-cp-accent-ink">Canopic</dt>
                  <dd className="mt-1.5 text-[14.5px] leading-relaxed text-cp-ink">{r.us}</dd>
                </div>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <p className="mx-auto mt-12 max-w-2xl text-center text-[15px] leading-relaxed text-cp-ink-3">
        The two can coexist happily. Arbitrageurs who drag other pools towards Canopic&apos;s prices bring useful
        volume, and skew pricing rewards them for evening out the vaults as they go.
      </p>
    </Section>
  );
}
