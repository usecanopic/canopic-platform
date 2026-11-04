import { ArrowUpRight, Mail, Plus } from "lucide-react";
import { SITE } from "@/lib/site";
import { Section } from "./Section";

const FAQS = [
  {
    q: "What kind of platform is Canopic?",
    a: "A swap venue that never takes custody of your funds. Prices come from oracle-priced vaults and competing makers, each trade clears in one transaction on Robinhood Chain, and Canopic never holds your assets. You will find no order book here and no balance to top up.",
  },
  {
    q: "Why does the same stock cost more to trade at night?",
    a: "Its home exchange has shut for the day, and vault depositors carry the risk of a price jump until it opens again. Off-hours quotes therefore use three times the usual spread and a smaller clip. The session tag on every quote shows the multiplier that applies before you confirm.",
  },
  {
    q: "Does buying tokenized AAPL make me an Apple shareholder?",
    a: "It does not. What you hold is a Stock Token, an ERC-20 debt security from Robinhood Assets (Jersey) Ltd that follows the share price, with dividends folded into the token by its ERC-8056 multiplier. Before your first trade you will see a disclosure explaining how this differs from owning the stock.",
  },
  {
    q: "Where does a vault depositor's income come from?",
    a: "From the spread their vault collects on each fill, after the protocol takes its 10%, building up as value per share. There are no token rewards or points. Classic impermanent loss is not a factor, since arbitrage against the reference price cannot bleed a vault that is priced from the oracle; the genuine risks, inventory exposure and weekend gaps, are spelled out and reflected in pricing.",
  },
  {
    q: "Can anyone at Canopic change a price?",
    a: "No. Every quote is produced by a published formula fed with on-chain data. It starts from the vetted Chainlink mid, widens it by a half-spread that depends on tier and session, nudges it for inventory, then adds a fee shown on its own line. The team cannot alter a quote or a fill, and settings only move through a timelock that carries a public explanation.",
  },
  {
    q: "What is planned beyond Stock Tokens?",
    a: "Launch covers Tier A equity markets with caps that everyone can see. After that come more Stock Tokens as their feeds and reviews are finished, followed by tokenized treasuries and gold under the same listing checks, then a public API and SDK, and finally a transfer of control to governance. No stage starts until the previous one has proven itself.",
  },
  {
    q: "Is there a way to build Canopic into another app?",
    a: "There is. The router is an open contract with a stable interface, and eligibility belongs to each user's wallet, not to the app they use. The quote API and TypeScript SDK arrive in the roadmap's infrastructure stage. No partner programme exists, and the official interface gets no special access.",
  },
] as const;

export function Questions() {
  return (
    <Section
      id="help"
      kicker="Help"
      tone="paper"
      title={
        <>
          What people <em className="italic">usually</em> ask us
        </>
      }
      lede="Short replies to the questions that come up most. The documentation covers each one in depth, including the maths and what happens when things go wrong."
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[18px] border border-cp-line bg-cp-canvas p-6">
            <p className="h-card text-[16px] text-cp-ink">Still curious?</p>
            <p className="mt-3 text-[15px] leading-relaxed text-cp-ink-3">
              This page answers <span className="num font-semibold text-cp-ink">{FAQS.length}</span> questions. For anything
              else, read through the code or send the team a message.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                View the code
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
              <a href={`mailto:${SITE.contactEmail}`} className="btn btn-ghost btn-sm">
                <Mail className="size-4" aria-hidden="true" />
                Write to us
              </a>
            </div>
          </div>
        </aside>

        <div className="divide-hair border-y border-cp-line">
          {FAQS.map((f, i) => (
            <details key={f.q} className="group" open={i === 0}>
              <summary className="flex min-h-[64px] list-none items-start gap-5 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="h-card flex-1 text-[17px] text-cp-ink md:text-[18px]">{f.q}</h3>
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-cp-line-strong text-cp-ink-3 transition-[transform,color,background-color,border-color] duration-300 group-open:rotate-45 group-open:border-cp-ink group-open:bg-cp-ink group-open:text-white">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="pb-6 pr-12 text-[15.5px] leading-[1.7] text-cp-ink-3">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
