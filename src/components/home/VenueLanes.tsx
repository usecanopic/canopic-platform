import { BriefcaseBusiness, FileSignature, Layers, Route, Users, Vault } from "lucide-react";
import { Section } from "./Section";

const LANES = [
  {
    name: "Oracle vaults",
    icon: Vault,
    does: "Each vault offers a bid and an ask around the checked Chainlink mid, widened according to tier, session and inventory. Everyday order sizes execute against them immediately.",
    gets: "Prices you can rebuild by hand from a published formula, and depositor returns that reflect what traders pay for instant execution, not what arbitrageurs leave behind.",
  },
  {
    name: "Maker quotes",
    icon: FileSignature,
    does: "Large orders are sent off-chain to attested market makers, who reply with signed prices. Quoting is free for them, and they only win the trade by outbidding the vault.",
    gets: "Big tickets get competitive pricing instead of sliding along a curve, then clear in a single step straight from the maker's wallet using an existing Permit2 approval.",
  },
  {
    name: "Smart routing",
    icon: Route,
    does: "Every order enters through one contract. It checks eligibility and the price guard, weighs the vault price against any maker quote, and executes whichever is better for you.",
    gets: "Swapping one stock for another happens as two hops via USDG in one transaction. Should either hop fail its checks, neither one goes through.",
  },
] as const;

const FIGURES = [
  { v: "75 bps", k: "Furthest from mid", s: "The Tier A price guard. Whether a vault or a maker fills you, the trade cannot land beyond this distance from the checked mid, regardless of other settings." },
  { v: "2 bps", k: "Total venue fee", s: "Listed on the quote and logged in the fill event, plus a 10% cut of the spread each vault earns. No charge is tucked inside the price." },
  { v: "None", k: "Funds we hold", s: "Assets stay in your own wallet or in vaults that depositors own. Because each trade clears in one transaction, Canopic never holds anything that could be lost." },
] as const;

const SEATS = [
  { who: "Traders", icon: Users, what: "Buy and sell around the clock with every cost broken out, and see which session applies on each quote." },
  { who: "Vault depositors", icon: Layers, what: "Fund a vault and collect the spread. Exits pay back in kind and stay open in every state, paused or halted, even once your attestation has expired." },
  { who: "Market makers", icon: BriefcaseBusiness, what: "Sending a quote is free, you only fill when you beat the vault price, and every trade clears in one transaction." },
] as const;

export function VenueLanes() {
  return (
    <Section
      id="routing"
      kicker="Routing"
      tone="paper"
      title={
        <>
          Vaults and makers, <em className="italic">compared</em> on every order
        </>
      }
      lede="Everyday trades execute against vaults priced from the oracle, while large ones invite signed quotes from professional makers. Whichever offer leaves you better off is the one that clears."
    >
      <ol className="grid gap-4 md:grid-cols-3">
        {LANES.map((l, i) => {
          const Icon = l.icon;
          return (
            <li key={l.name} className="card card-hover flex flex-col p-6 md:p-7">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-[10px] bg-cp-accent-soft text-cp-accent-ink">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="num text-[12px] text-cp-ink-4">Layer {i + 1}</span>
              </div>
              <h3 className="h-section mt-6 text-[28px] text-cp-ink">{l.name}</h3>
              <p className="mt-5 text-[13px] font-semibold text-cp-ink">What it does</p>
              <p className="mt-2 text-[15px] leading-[1.65] text-cp-ink-2">{l.does}</p>
              <div className="rule my-6" />
              <p className="text-[13px] font-semibold text-cp-ink">Why it matters</p>
              <p className="mt-2 text-[15px] leading-[1.65] text-cp-ink-3">{l.gets}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 grid overflow-hidden rounded-[18px] border border-cp-line bg-cp-canvas sm:grid-cols-3">
        {FIGURES.map((f, i) => (
          <div key={f.k} className={"p-6 md:p-7" + (i > 0 ? " border-t border-cp-line sm:border-l sm:border-t-0" : "")}>
            <p className="text-[13px] font-medium text-cp-ink-3">{f.k}</p>
            <p className="num mt-4 text-[clamp(36px,4vw,46px)] font-semibold leading-none tracking-[-0.045em] text-cp-ink">{f.v}</p>
            <p className="mt-4 text-[14px] leading-relaxed text-cp-ink-3">{f.s}</p>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <p className="caps">Who it serves</p>
        <ul className="mt-5 grid gap-8 md:grid-cols-3">
          {SEATS.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.who} className="flex gap-4 border-t border-cp-line pt-5">
                <Icon className="mt-0.5 size-[18px] shrink-0 text-cp-accent-ink" aria-hidden="true" />
                <div>
                  <h3 className="h-card text-[16px] text-cp-ink">{s.who}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-cp-ink-3">{s.what}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
