"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowDownUp, Info } from "lucide-react";
import { useSession } from "@/components/platform/PlatformProviders";
import { useNow, useVenue } from "@/components/platform/usePlatformData";
import {
  Badge,
  Button,
  LeaderRow,
  Notice,
  PageHead,
  Segmented,
  Select,
  Sheet,
  Skeleton,
  sessionTone,
} from "@/components/platform/ui";
import { fmtBps, fmtMoney } from "@/lib/platform/format";
import { FEES, QUOTE_SYMBOL, REGIMES, TIERS, currentSession, quoteSwap } from "@/lib/platform/markets";
import { TokenLogo } from "@/components/platform/TokenLogo";

const SLIPPAGE_OPTIONS = [10, 15, 30, 50] as const;
const SLIPPAGE_SEGMENTS = SLIPPAGE_OPTIONS.map((bps) => ({ value: String(bps), label: `${(bps / 100).toFixed(2)}%` }));

const TITLE = "A ticket that shows its working";
const DESCRIPTION =
  "The ticket breaks the price into its parts, one line per term. The chain settles exactly the terms you sign, and if the outcome would land below your limit, the transaction is undone rather than filled.";

/** The market or token logo: a tile in headers, a round mark inside token chips. */
function Monogram({ symbol, size = "md" }: { symbol: string; size?: "sm" | "md" }) {
  return size === "sm" ? <TokenLogo symbol={symbol} size={26} rounded="round" /> : <TokenLogo symbol={symbol} size={32} />;
}

/** A token chip that sits on the right of an amount field. */
function TokenChip({ symbol }: { symbol: string }) {
  return (
    <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-cp-line bg-cp-paper pl-1.5 pr-3.5 shadow-[var(--shadow-sheet)]">
      <Monogram symbol={symbol} size="sm" />
      <span className="text-[14px] font-medium text-cp-ink">{symbol}</span>
    </span>
  );
}

/** The sky from the homepage hero, laid behind the ticket so it rides the lit horizon. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden rounded-[26px] border border-cp-line px-3 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
      <Image
        src="/images/hero-space.jpg"
        alt=""
        fill
        priority
        quality={80}
        sizes="(min-width: 1024px) 1150px, 100vw"
        className="-z-20 object-cover object-[50%_58%]"
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-1/3 bg-gradient-to-b from-cp-canvas/50 to-transparent" aria-hidden="true" />
      {children}
    </div>
  );
}

function SwapSkeleton() {
  return (
    <div className="space-y-8">
      <PageHead bare code="CP · 02 · Trade" title={TITLE} description={DESCRIPTION} />
      <Stage>
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,520px)_320px] lg:justify-center">
          <div className="card-stage p-6">
            <Skeleton rows={8} />
          </div>
          <div className="panel p-5">
            <Skeleton rows={5} />
          </div>
        </div>
      </Stage>
    </div>
  );
}

export default function SwapPage() {
  return (
    <Suspense fallback={<SwapSkeleton />}>
      <SwapRoute />
    </Suspense>
  );
}

/** Reads the `?market=` deep link and remounts the ticket when it changes. */
function SwapRoute() {
  const requested = useSearchParams().get("market");
  return <SwapTicket key={requested ?? ""} requested={requested} />;
}

function SwapTicket({ requested }: { requested: string | null }) {
  const { authenticated, login } = useSession();
  const venue = useVenue();
  const now = useNow();
  const session = currentSession(new Date(now));
  const regime = REGIMES[session];

  const markets = useMemo(() => venue.data?.markets ?? [], [venue.data]);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [buyToken, setBuyToken] = useState(true);
  const [amountRaw, setAmountRaw] = useState("10000");
  const [slippageBps, setSlippageBps] = useState(15);

  // An explicit pick wins; otherwise the deep link (if it names a listed market); otherwise the first market.
  const linked = requested ? markets.find((m) => m.symbol.toLowerCase() === requested.toLowerCase()) : undefined;
  const market = markets.find((m) => m.symbol === symbol) ?? linked ?? markets[0];
  const amountIn = Number(amountRaw.replace(/,/g, ""));
  const quote = useMemo(
    () => (market ? quoteSwap(market, buyToken, amountIn, session) : null),
    [market, buyToken, amountIn, session]
  );

  if (venue.loading && !venue.data) return <SwapSkeleton />;
  if (!market || !quote) return null;

  const tier = TIERS[market.tier];
  const minOut = quote.ok ? quote.amountOut * (1 - slippageBps / 10_000) : 0;
  const inSymbol = buyToken ? QUOTE_SYMBOL : market.symbol;
  const outSymbol = buyToken ? market.symbol : QUOTE_SYMBOL;
  const outDigits = buyToken ? 4 : 2;
  const regimeMul = (regime.spreadMulBps / 10_000).toFixed(1);
  const sessionHalfSpread = (tier.baseHalfSpreadBps * regime.spreadMulBps) / 10_000;

  const unit = (s: string) => <span className="text-cp-ink-4"> {s}</span>;

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHead bare code="CP · 02 · Trade" title={TITLE} description={DESCRIPTION} />

      <Stage>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,520px)_320px] lg:justify-center xl:gap-8">
        {/* Ticket */}
        <div className="relative min-w-0">
          <section aria-label={`Trade ticket, ${market.symbol} against ${QUOTE_SYMBOL}`} className="card-stage p-4 sm:p-6">
            {/* Ticket head */}
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex min-w-0 items-center gap-3">
                <Monogram symbol={market.symbol} />
                <div className="min-w-0">
                  <h2 className="truncate text-[16px] font-medium text-cp-ink">
                    {market.symbol} <span className="text-cp-ink-4">/ {QUOTE_SYMBOL}</span>
                  </h2>
                  <p className="truncate text-[12.5px] text-cp-ink-4">{market.name}</p>
                </div>
              </div>
              <Badge tone={sessionTone(session)}>
                {regime.label} x{regimeMul}
              </Badge>
            </div>

            {/* Market selector */}
            <div className="mt-5">
              <label htmlFor="swap-market" className="lbl mb-2 block px-1">
                Listing
              </label>
              <Select id="swap-market" value={market.symbol} onChange={(e) => setSymbol(e.target.value)}>
                {markets.map((m) => (
                  <option key={m.symbol} value={m.symbol}>
                    {m.symbol} · {m.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Pay / flip / receive */}
            <div className="mt-4">
              <div className="rounded-[14px] border border-cp-line bg-cp-canvas p-4 transition-[border-color,box-shadow] focus-within:border-cp-accent focus-within:bg-cp-paper focus-within:shadow-[0_0_0_4px_rgb(74_222_128/0.1)]">
                <label htmlFor="swap-pay" className="lbl block">
                  You send<span className="sr-only">, {inSymbol}</span>
                </label>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    id="swap-pay"
                    inputMode="decimal"
                    autoComplete="off"
                    value={amountRaw}
                    onChange={(e) => setAmountRaw(e.target.value)}
                    placeholder="0.00"
                    className="num min-w-0 flex-1 bg-transparent text-[32px] font-semibold leading-none tracking-[-0.03em] text-cp-ink outline-none placeholder:text-cp-ink-4 sm:text-[36px]"
                  />
                  <TokenChip symbol={inSymbol} />
                </div>
              </div>

              <div className="relative z-10 -my-[18px] flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (quote.ok) setAmountRaw(quote.amountOut.toFixed(buyToken ? 4 : 2));
                    setBuyToken((v) => !v);
                  }}
                  aria-label="Swap the two sides of the trade"
                  className="group grid size-10 place-items-center rounded-[12px] border border-cp-line-strong bg-cp-paper text-cp-ink-2 shadow-[0_0_0_5px_#ffffff,0_1px_3px_rgb(18_18_17/0.12)] transition-colors hover:border-cp-accent/50 hover:text-cp-accent-ink"
                >
                  <ArrowDownUp className="size-4 transition-transform duration-300 group-hover:rotate-180" aria-hidden="true" />
                </button>
              </div>

              <div className="rounded-[14px] border border-cp-line bg-cp-canvas p-4">
                <label htmlFor="swap-receive" className="lbl block">
                  You get<span className="sr-only">, {outSymbol}</span>
                </label>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    id="swap-receive"
                    readOnly
                    tabIndex={-1}
                    value={quote.ok ? fmtMoney(quote.amountOut, "", outDigits) : ""}
                    placeholder="0.00"
                    className="num min-w-0 flex-1 bg-transparent text-[32px] font-semibold leading-none tracking-[-0.03em] text-cp-ink outline-none placeholder:text-cp-ink-4 sm:text-[36px]"
                  />
                  <TokenChip symbol={outSymbol} />
                </div>
              </div>
            </div>

            {/* Line-by-line breakdown */}
            <div className="mt-5 rounded-[14px] border border-cp-line px-4 py-2">
              <LeaderRow label="Oracle mid" value={<>{fmtMoney(quote.mid)}{unit(QUOTE_SYMBOL)}</>} sub="Chainlink, after the guards, per whole token" />
              <LeaderRow
                label={`Half-spread · ${fmtBps(quote.halfSpreadBps)}`}
                value={quote.ok ? <>{fmtMoney(quote.spreadAmount)}{unit(QUOTE_SYMBOL)}</> : "n/a"}
                sub={`tier ${tier.label} base of ${fmtBps(tier.baseHalfSpreadBps)}, scaled x${regimeMul} for the ${regime.label.toLowerCase()} session, skew ${quote.skewBps >= 0 ? "+" : ""}${quote.skewBps} bps`}
              />
              <LeaderRow
                label={`Venue fee · ${fmtBps(quote.feeBps)}`}
                value={quote.ok ? <>{fmtMoney(quote.feeAmount)}{unit(QUOTE_SYMBOL)}</> : "n/a"}
                sub="kept separate on this ticket and in a field of its own on the fill event"
              />
              <div className="my-1.5 rule" aria-hidden="true" />
              <LeaderRow
                label={<span className="text-cp-ink-2">Least you will get · {(slippageBps / 100).toFixed(2)}% limit</span>}
                value={
                  quote.ok ? (
                    <span className="font-medium">
                      {fmtMoney(minOut, "", outDigits)}
                      {unit(outSymbol)}
                    </span>
                  ) : (
                    "n/a"
                  )
                }
                sub="should the result fall short of this, nothing settles"
              />
            </div>

            {/* Slippage bound */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <span className="lbl">Price tolerance</span>
              <Segmented
                label="Price tolerance"
                options={SLIPPAGE_SEGMENTS}
                value={String(slippageBps)}
                onChange={(v) => setSlippageBps(Number(v))}
                className="num"
              />
            </div>

            {!quote.ok && quote.reason && (
              <div className="mt-4">
                <Notice tone="warn">{quote.reason}</Notice>
              </div>
            )}
            {session === "closed" && (
              <div className="mt-4">
                <Notice tone="warn">
                  No US exchange is open, so this ticket prices at three times the usual spread and allows half the
                  normal clip. A trade that can sit until the market reopens will be cheaper, and we would rather say so now.
                </Notice>
              </div>
            )}

            <div className="mt-5">
              {authenticated ? (
                <Button variant="accent" className="btn-lg w-full" disabled>
                  Trading opens listing by listing
                </Button>
              ) : (
                <Button variant="accent" className="btn-lg w-full" onClick={login}>
                  Sign in to trade
                </Button>
              )}
              <p className="mt-3 flex gap-2 px-1 text-[12.5px] leading-relaxed text-cp-ink-3">
                <Info className="mt-0.5 size-3.5 shrink-0 text-cp-ink-4" aria-hidden="true" />
                <span>
                  {authenticated
                    ? "While the launch is guarded, web trading is switched on for one listing after another. Whatever the status, this ticket prices from the live formula."
                    : "Once your checks clear, trading takes a matter of minutes to set up."}
                </span>
              </p>
            </div>
          </section>
        </div>

        {/* Side panels */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
          <Sheet label="Listing" meta={<Badge tone="muted">Tier {tier.label}</Badge>}>
            <div className="flex items-center gap-3">
              <Monogram symbol={market.symbol} />
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-cp-ink">{market.symbol}</p>
                <p className="truncate text-[12.5px] text-cp-ink-4">{market.name}</p>
              </div>
            </div>
            <p className="num mt-5 text-[30px] font-semibold leading-none tracking-[-0.03em] text-cp-ink">
              {fmtMoney(quote.mid)}
              <span className="text-[14px] font-normal text-cp-ink-4"> {QUOTE_SYMBOL}</span>
            </p>
            <p className="mt-2 text-[12.5px] text-cp-ink-3">Chainlink mid, passed through the guards</p>
            <dl className="divide-hair mt-5 border-t border-cp-line text-[13px]">
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-cp-ink-3">Regime</dt>
                <dd>
                  <Badge tone={sessionTone(session)}>
                    {regime.label} x{regimeMul}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-cp-ink-3">Half-spread now</dt>
                <dd className="num text-cp-ink">{fmtBps(sessionHalfSpread)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 pt-2.5">
                <dt className="text-cp-ink-3">Largest trade now</dt>
                <dd className="num text-cp-ink">
                  {fmtMoney(quote.clip, "", 0)}
                  {unit(QUOTE_SYMBOL)}
                </dd>
              </div>
            </dl>
          </Sheet>

          <Sheet label="How it settles">
            <dl className="divide-hair -my-1 text-[13px]">
              {[
                ["Path", buyToken ? `${QUOTE_SYMBOL} → ${market.symbol}` : `${market.symbol} → ${QUOTE_SYMBOL}`],
                ["Filled by", "the vault, unless an RFQ maker beats it"],
                ["Hard limit from mid", fmtBps(tier.oracleBandBps, 0)],
                ["Fee on vault fills", fmtBps(FEES.swapFeeBps)],
                ["Fee on RFQ fills", fmtBps(FEES.rfqFeeBps)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-cp-ink-3">{k}</dt>
                  <dd className="num text-right text-cp-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-cp-line pt-4 text-[12.5px] text-cp-ink-3">One transaction, and your keys stay yours</p>
          </Sheet>

          <div className="rounded-[14px] border border-cp-line bg-cp-paper px-4 py-3.5 shadow-[var(--shadow-sheet)]">
            <p className="flex items-center gap-2 text-[13px] font-medium text-cp-ink-2">
              <Info className="size-3.5 text-cp-accent-ink" aria-hidden="true" />
              How the number is built
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-cp-ink-3">
              Take the Chainlink mid once it clears the guards. Widen it by the tier&apos;s half-spread at the current
              session scale, let the vault&apos;s inventory skew move it a little, and add the venue fee as a separate line. If
              the result would sit outside the oracle band, no quote is offered.
            </p>
          </div>
        </div>
      </div>
      </Stage>
    </div>
  );
}
