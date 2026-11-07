import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowRightLeft,
  Briefcase,
  Droplets,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { SITE } from "@/lib/site";
import { MARKETS, TIERS } from "@/lib/platform/markets";
import { TokenLogo } from "@/components/platform/TokenLogo";
import { cn } from "@/lib/utils";

/**
 * The opening screen: a compact serif claim and two actions, then the product itself centred beneath,
 * an app window lifted off a dotted stage, so the dashboard is in view before any scroll.
 * A row of four figures and a slow ticker of the listed markets close it.
 */
const AMOUNT_IN = 10_000;
const MID = 177.4;
const FEE = (AMOUNT_IN * 2) / 10_000;
const NET = AMOUNT_IN - FEE;
const OUT = NET / (MID * 1.001); // open session with a 10 bps half-spread
const SPREAD_COST = NET - OUT * MID;

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const STRIP = [
  { k: "Tier A spread", v: "10 bps", s: "Each side, during regular US hours" },
  { k: "Venue fee", v: "2 bps", s: "Printed as a separate quote line" },
  { k: "Price guard", v: "75 bps", s: "The furthest any Tier A fill can land" },
  { k: "Clearing", v: "Atomic", s: "One transaction on Robinhood Chain" },
] as const;

const SIDEBAR = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Trade", icon: ArrowRightLeft, active: true },
  { label: "Vaults", icon: Droplets },
  { label: "Holdings", icon: Briefcase },
  { label: "Ledger", icon: Search },
] as const;

export function Hero() {
  const tape = [...MARKETS, ...MARKETS];

  return (
    <section className="relative isolate -mt-16 overflow-hidden bg-cp-canvas pt-16">
      {/* Atmosphere: a dawn sky over the curve of a planet. The headline sits in the pale sky and the
          product window rides the lit horizon; the night side fades back into the canvas below. */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[1040px] md:h-[1080px]" aria-hidden="true">
        <Image
          src="/images/hero-space.jpg"
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover object-[50%_42%]"
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cp-canvas/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-b from-transparent via-cp-canvas/80 to-cp-canvas" />
      </div>
      <div className="page relative pt-10 md:pt-14">
        {/* The claim, set compact so the product below it is in view on arrival */}
        <div className="mx-auto max-w-[920px] text-center">
          <h1 className="display animate-rise delay-1 text-[clamp(40px,6.4vw,56px)] leading-[1.02] text-cp-ink">
            Tokenized stocks, priced by the <em className="italic">real</em> market.
          </h1>

          <p className="animate-rise delay-2 mx-auto mt-3 max-w-[74ch] text-[15.5px] leading-[1.55] text-cp-ink-3 md:text-[16px]">
            Canopic quotes each Stock Token against USDG from the live Chainlink mid. The spread and the fee appear as
            separate lines before you sign, and every trade lands on-chain for anyone to check.
          </p>
          <p className="animate-rise delay-2 mx-auto mt-3 max-w-[74ch] text-[15.5px] leading-[1.55] text-cp-ink-3 md:text-[16px]">
            Our official token $CANOPIC is live on Robinhood Chain, and can be used to pay for fees. <br/> 0x42200daafdad1fc94328529e974a339bfa071f47
          </p>

          <div className="animate-rise delay-3 mt-5 flex items-center justify-center gap-3">
            <Link href={SITE.appHref} className="btn btn-primary">
              Open the app
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="#formula" className="btn btn-secondary">
              See the formula
            </Link>
          </div>
        </div>

        {/* The product, centred on its stage */}
        <div id="platform" className="animate-rise delay-3 relative mx-auto mt-7 max-w-[1040px] scroll-mt-24">
          <AppWindow />
        </div>

        <p className="mt-8 hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-cp-ink-4 sm:flex">
          <span>Mid price from Chainlink</span>
          <span className="size-1 rounded-full bg-cp-line-strong" aria-hidden="true" />
          <span>Clears on Robinhood Chain</span>
          <span className="size-1 rounded-full bg-cp-line-strong" aria-hidden="true" />
          <span>Denominated in USDG</span>
        </p>

        {/* Four figures */}
        <dl className="mx-auto mt-16 grid max-w-5xl grid-cols-2 md:mt-20 lg:grid-cols-4">
          {STRIP.map((s, i) => (
            <div
              key={s.k}
              className={cn(
                "px-4 py-6 sm:px-6",
                i % 2 === 1 && "border-l border-cp-line",
                i >= 2 && "border-t border-cp-line lg:border-t-0",
                i === 2 && "lg:border-l"
              )}
            >
              <dt className="text-[13px] font-medium text-cp-ink-3">{s.k}</dt>
              <dd className="num mt-3 text-[clamp(28px,3.4vw,38px)] font-semibold leading-none tracking-[-0.04em] text-cp-ink">{s.v}</dd>
              <dd className="mt-2.5 text-[13px] leading-snug text-cp-ink-4">{s.s}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* The catalogue, running along the base */}
      <div className="mt-16 border-y border-cp-line bg-cp-paper md:mt-20">
        <div className="fade-x overflow-hidden py-3.5">
          <div className="marquee" aria-hidden="true">
            {tape.map((m, i) => (
              <span key={`${m.symbol}-${i}`} className="flex shrink-0 items-center gap-3 px-6 text-[13px] leading-none">
                <TokenLogo symbol={m.symbol} size={20} rounded="round" />
                <span className="font-semibold text-cp-ink">{m.symbol}</span>
                <span className="num text-cp-ink-2">{fmt(m.mid)}</span>
                <span className="num text-cp-accent-ink">{TIERS[m.tier].baseHalfSpreadBps} bps</span>
                <span className="ml-3 size-1 rounded-full bg-cp-line-strong" />
              </span>
            ))}
          </div>
        </div>
        <p className="sr-only">
          Listed right now: {MARKETS.map((m) => `${m.symbol} in Tier ${TIERS[m.tier].label}`).join("; ")}.
        </p>
      </div>
    </section>
  );
}

/** A browser window holding a still of the app: its sidebar, the market list and the quote ticket. */
function AppWindow() {
  return (
    <div className="card-stage overflow-hidden rounded-[20px] text-left">
      <div className="flex h-11 items-center gap-4 border-b border-cp-line bg-cp-canvas px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-cp-line-strong" />
          <span className="size-2.5 rounded-full bg-cp-line-strong" />
          <span className="size-2.5 rounded-full bg-cp-line-strong" />
        </span>
        <span className="mx-auto flex h-6 min-w-0 max-w-[340px] flex-1 items-center justify-center rounded-[6px] border border-cp-line bg-cp-paper px-3 text-[12px] text-cp-ink-3">
          <span className="truncate">{SITE.domain}/platform/swap</span>
        </span>
        <span className="w-[42px]" aria-hidden="true" />
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[56px_minmax(0,1fr)_380px]">
        {/* Sidebar */}
        <aside className="hidden flex-col items-center gap-1 border-r border-cp-line bg-cp-canvas py-3 lg:flex" aria-hidden="true">
          <Image src="/images/logo-mark.png" alt="" width={26} height={26} className="mb-3 rounded-[6px]" />
          {SIDEBAR.map((item) => (
            <span
              key={item.label}
              title={item.label}
              className={cn(
                "grid size-8 place-items-center rounded-[8px]",
                "active" in item
                  ? "bg-cp-paper text-cp-accent-ink shadow-[0_1px_2px_rgb(18_18_17/0.06),0_0_0_1px_rgb(18_18_17/0.05)]"
                  : "text-cp-ink-4"
              )}
            >
              <item.icon className="size-3.5" />
            </span>
          ))}
        </aside>

        {/* Market list */}
        <div className="hidden min-w-0 border-r border-cp-line md:block" aria-hidden="true">
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <span className="h-card text-[14px] text-cp-ink">Listings</span>
            <span className="seg">
              <span className="seg-item inline-flex items-center" aria-pressed="true">Any tier</span>
              <span className="seg-item inline-flex items-center">Tier A</span>
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_80px_56px] border-y border-cp-line bg-cp-canvas px-5 py-2 text-[11.5px] font-medium text-cp-ink-3">
            <span>Asset</span>
            <span className="text-right">Mid</span>
            <span className="text-right">Spread</span>
          </div>
          <ul className="divide-hair">
            {MARKETS.slice(0, 5).map((m, i) => (
              <li
                key={m.symbol}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_80px_56px] items-center px-5 py-2 text-[13px]",
                  i === 0 && "bg-cp-accent-soft/60"
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <TokenLogo symbol={m.symbol} size={26} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-cp-ink">{m.symbol}</span>
                    <span className="block truncate text-[11.5px] text-cp-ink-4">{m.name}</span>
                  </span>
                </span>
                <span className="num text-right text-cp-ink">{fmt(m.mid)}</span>
                <span className="num text-right text-cp-accent-ink">{TIERS[m.tier].baseHalfSpreadBps}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ticket */}
        <div className="bg-cp-paper p-4">
          <QuoteTicket />
        </div>
      </div>
    </div>
  );
}

function QuoteTicket() {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="flex items-center gap-2.5">
          <TokenLogo symbol="NVDAx" size={30} />
          <span>
            <span className="block text-[14.5px] font-semibold tracking-[-0.01em] text-cp-ink">
              NVDAx <span className="font-normal text-cp-ink-4">/ USDG</span>
            </span>
            <span className="block text-[12px] text-cp-ink-4">NVIDIA Stock Token</span>
          </span>
        </span>
        <span className="inline-flex h-[22px] items-center gap-1.5 rounded-[6px] bg-cp-up/[0.09] px-2 text-[12px] font-medium text-cp-up">
          <span className="pulse-dot size-1.5 rounded-full bg-current" aria-hidden="true" />
          Regular ×1.0
        </span>
      </div>

      <div className="relative mt-3 space-y-1.5">
        <TicketField label="You send" value={fmt(AMOUNT_IN, 0)} symbol="USDG" />
        <span
          className="absolute left-1/2 top-1/2 z-10 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[10px] border border-cp-line bg-cp-paper text-cp-ink-2 shadow-[0_0_0_4px_#fff]"
          aria-hidden="true"
        >
          <ArrowDown className="size-4" />
        </span>
        <TicketField label="You get" value={fmt(OUT, 4)} symbol="NVDAx" />
      </div>

      <dl className="mt-3 rounded-[12px] border border-cp-line px-4 py-0.5">
        <Row k="Oracle mid" v={`${fmt(MID)} USDG`} />
        <Row k="Half-spread · 10.0 bps" v={`${fmt(SPREAD_COST)} USDG`} />
        <Row k="Inventory skew" v="+0 bps" />
        <Row k="Venue fee · 2.0 bps" v={`${fmt(FEE)} USDG`} />
      </dl>

      <Link href={SITE.appHref} className="btn btn-accent mt-3 h-10 w-full">
        Get NVDAx
      </Link>

      <p className="mt-2 text-center text-[12px] text-cp-ink-4">Clears in one transaction, capped 75 bps from the mid</p>
    </div>
  );
}

function TicketField({ label, value, symbol }: { label: string; value: string; symbol: string }) {
  return (
    <div className="rounded-[12px] border border-cp-line bg-cp-canvas px-4 py-2.5">
      <p className="lbl">{label}</p>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span className="num min-w-0 truncate text-[clamp(22px,6vw,25px)] font-semibold leading-none tracking-[-0.03em] text-cp-ink">
          {value}
        </span>
        <span className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-cp-line bg-cp-paper pl-1 pr-3 text-[13px] font-medium text-cp-ink shadow-[0_1px_2px_rgb(18_18_17/0.05)]">
          <TokenLogo symbol={symbol} size={24} rounded="round" />
          {symbol}
        </span>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-cp-line py-1.5 last:border-b-0">
      <dt className="text-[12.5px] text-cp-ink-3">{k}</dt>
      <dd className="num text-[13px] font-medium text-cp-ink">{v}</dd>
    </div>
  );
}
