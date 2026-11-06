"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, BarChart3, Gauge, Inbox, Vault } from "lucide-react";
import { useSession } from "@/components/platform/PlatformProviders";
import { useNow, useVenue } from "@/components/platform/usePlatformData";
import {
  Badge,
  BarChart,
  BarList,
  EmptyState,
  ExplorerLink,
  LeaderRow,
  PageHead,
  Segmented,
  Sheet,
  Skeleton,
  StatBand,
  StatCard,
  Table,
  Td,
  Th,
  sessionDot,
  sessionTone,
} from "@/components/platform/ui";
import { fmtAgo, fmtBps, fmtCompact, fmtMoney } from "@/lib/platform/format";
import { FEES, QUOTE_SYMBOL, REGIMES, TIERS, currentSession, quoteSwap, type Session } from "@/lib/platform/markets";
import { cn } from "@/lib/utils";
import { TokenLogo } from "@/components/platform/TokenLogo";

/** A dot whose colour follows the session: up when open, warn when extended, neutral when closed, down when halted. */
function SessionDot({ session }: { session: string }) {
  return <span aria-hidden="true" className={cn("pulse-dot inline-block size-1.5 rounded-full", sessionDot(session))} />;
}

/** The market's logo tile. */
function Monogram({ symbol }: { symbol: string }) {
  return <TokenLogo symbol={symbol} size={32} />;
}

const SESSION_NOTE: Record<Session, string> = {
  regular: "The US exchanges are trading, so every tier quotes at its base spread with the whole clip available.",
  extended: "Only pre-market or after-hours trading is under way, so the underlying is thin: quotes widen and clips shrink.",
  closed: "No US exchange is trading right now. Wider spreads pay for the risk of a gap at the reopen, and clips are cut back.",
};

type TierFilter = "all" | "1" | "2" | "3";
const TIER_OPTIONS = [
  { value: "all", label: "Every tier" },
  { value: "1", label: "Tier A" },
  { value: "2", label: "Tier B" },
  { value: "3", label: "Tier C" },
] as const satisfies readonly { value: TierFilter; label: string }[];

const fmtQuote = (v: number) => fmtMoney(v, QUOTE_SYMBOL);

export default function OverviewPage() {
  const { authenticated, login } = useSession();
  const router = useRouter();
  const venue = useVenue();
  const now = useNow();
  const session = currentSession(new Date(now));
  const regime = REGIMES[session];
  const [tier, setTier] = useState<TierFilter>("all");

  const markets = useMemo(() => venue.data?.markets ?? [], [venue.data]);
  const fills = useMemo(() => venue.data?.fills ?? [], [venue.data]);
  const loading = venue.loading && !venue.data;

  const tvl = markets.reduce((acc, m) => acc + m.tvl, 0);
  const volume = markets.reduce((acc, m) => acc + m.volume24h, 0);
  const funded = markets.filter((m) => m.tvl > 0).length;

  const dayFills = useMemo(() => fills.filter((f) => f.minutesAgo < 1440), [fills]);
  const avgExecution = dayFills.length ? dayFills.reduce((s, f) => s + f.executionBps, 0) / dayFills.length : null;

  // 24 hourly buckets from fills, oldest on the left.
  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, i) => {
      const h = 23 - i;
      return { label: h === 0 ? "This past hour" : `${h} hours back`, value: 0 };
    });
    for (const f of dayFills) buckets[23 - Math.floor(f.minutesAgo / 60)].value += f.notional;
    return buckets;
  }, [dayFills]);
  const fillVolume = dayFills.reduce((s, f) => s + f.notional, 0);

  const shown = tier === "all" ? markets : markets.filter((m) => String(m.tier) === tier);
  const tvlRank = [...markets].filter((m) => m.tvl > 0).sort((a, b) => b.tvl - a.tvl);
  const latest = [...fills].sort((a, b) => a.minutesAgo - b.minutesAgo).slice(0, 5);

  return (
    <div>
      <PageHead
        code="CP · 01 · Dashboard"
        title="The venue at a glance"
        description="Each listing is quoted from a guarded Chainlink mid. Below you can see the session in force, the spread it produces and the fee on top."
        action={
          !authenticated ? (
            <button type="button" onClick={login} className="btn btn-primary">
              Sign in and trade
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <Link href="/platform/swap" className="btn btn-primary">
              Open the trade ticket
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )
        }
      />

      <StatBand className="mt-6">
        <StatCard
          label="Value held in vaults"
          value={fmtCompact(tvl, QUOTE_SYMBOL)}
          hint={`${funded} of ${markets.length} listings are funded`}
          icon={<Vault />}
        />
        <StatCard
          label="Traded today"
          value={fmtCompact(volume, QUOTE_SYMBOL)}
          hint="vaults and RFQ together"
          accent="accent"
          icon={<BarChart3 />}
        />
        <StatCard
          label="Trades settled"
          value={String(dayFills.length)}
          hint={`${fmtCompact(fillVolume, QUOTE_SYMBOL)} across the past day`}
          icon={<Activity />}
        />
        <StatCard
          label="Average cost"
          value={avgExecution === null ? "n/a" : fmtBps(avgExecution)}
          hint="over the mid, with the fee counted"
          icon={<Gauge />}
        />
      </StatBand>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Sheet label="Volume by hour" meta={<span>past 24 hours, added up per fill</span>}>
          {loading ? (
            <Skeleton rows={4} />
          ) : (
            <BarChart
              data={hourly}
              height={168}
              format={fmtQuote}
              axisLabels={["A day back", "Half a day back", "Latest"]}
              emptyLabel="Nothing traded during the past day"
            />
          )}
        </Sheet>
        <Sheet label="Current regime" meta={<SessionDot session={session} />}>
          <div className="flex items-center gap-3">
            <Badge tone={sessionTone(session)}>{regime.label}</Badge>
            <span className="text-[12.5px] text-cp-ink-4">Follows the US equity calendar</span>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-cp-ink-2">{SESSION_NOTE[session]}</p>
          <div className="mt-3">
            <LeaderRow label="Spread scaling" value={`x${(regime.spreadMulBps / 10_000).toFixed(1)}`} />
            <LeaderRow label="Clip scaling" value={`x${(regime.clipMulBps / 10_000).toFixed(2)}`} />
            <LeaderRow
              label="Venue fee"
              value={fmtBps(FEES.swapFeeBps, 0)}
              sub={`plus a ${FEES.spreadShareBps / 100}% cut of the spread vaults earn`}
            />
          </div>
        </Sheet>
      </div>

      <div className="mt-6">
        <Sheet
          label="Listings"
          meta={
            <span className="hidden sm:inline">
              {venue.data?.source === "supabase" ? "Served by the indexer" : "Indicative figures only"}
            </span>
          }
        >
          <div className="-mx-5 -mt-5 mb-0 flex flex-wrap items-center justify-between gap-3 border-b border-cp-line px-5 py-3">
            <Segmented label="Filter listings by tier" options={TIER_OPTIONS} value={tier} onChange={setTier} />
            <span className="text-[12.5px] text-cp-ink-4">
              {shown.length} {shown.length === 1 ? "listing" : "listings"} shown
            </span>
          </div>
          {loading ? (
            <div className="pt-5">
              <Skeleton rows={6} />
            </div>
          ) : shown.length === 0 ? (
            <div className="pt-5">
              <EmptyState icon={<Inbox />} title="Nothing is listed in this tier" body="Pick another tier to see its vaults." />
            </div>
          ) : (
            <Table minWidth={760}>
              <thead>
                <tr>
                  <Th>Market</Th>
                  <Th>Tier</Th>
                  <Th className="text-right">Mid, {QUOTE_SYMBOL}</Th>
                  <Th className="text-right">Half-spread to buy, bps</Th>
                  <Th className="text-right">Clip now, {QUOTE_SYMBOL}</Th>
                  <Th className="text-right">Traded today, {QUOTE_SYMBOL}</Th>
                  <Th className="text-right">TVL, {QUOTE_SYMBOL}</Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((m) => {
                  const q = quoteSwap(m, true, 1_000, session);
                  const href = `/platform/swap?market=${encodeURIComponent(m.symbol)}`;
                  return (
                    <tr key={m.symbol} className="cursor-pointer" onClick={() => router.push(href)}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Monogram symbol={m.symbol} />
                          <div className="min-w-0">
                            <Link
                              href={href}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-cp-ink hover:text-cp-accent-strong"
                              aria-label={`Open the ${m.symbol} ticket`}
                            >
                              {m.symbol}
                            </Link>
                            <div className="truncate text-[12.5px] text-cp-ink-4">{m.name}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={m.tier === 1 ? "accent" : "muted"}>{TIERS[m.tier].label}</Badge>
                      </Td>
                      <Td className="text-right text-cp-ink">{fmtMoney(m.mid)}</Td>
                      <Td className="text-right text-cp-accent-ink">{q.halfSpreadBps.toFixed(1)}</Td>
                      <Td className="text-right">{fmtCompact(q.clip)}</Td>
                      <Td className="text-right">{m.volume24h > 0 ? fmtMoney(m.volume24h) : <span className="text-cp-ink-4">0</span>}</Td>
                      <Td className="text-right text-cp-ink">{m.tvl > 0 ? fmtMoney(m.tvl) : <span className="text-cp-ink-4">0</span>}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <p className="mt-5 text-[12px] leading-relaxed text-cp-ink-3">
            Each half-spread is what a buyer pays at this moment. It is the tier base scaled by the session, and inventory skew then nudges it.
          </p>
        </Sheet>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Sheet label="Vault value by listing" meta={<span className="num">{fmtCompact(tvl, QUOTE_SYMBOL)}</span>}>
          {loading ? (
            <Skeleton rows={5} />
          ) : tvlRank.length === 0 ? (
            <EmptyState icon={<Vault />} title="Every vault is still unfunded" />
          ) : (
            <BarList
              items={tvlRank.map((m) => ({
                key: m.symbol,
                label: m.symbol,
                value: m.tvl,
                display: (
                  <>
                    {fmtMoney(m.tvl, "", 0)}
                    <span className="text-cp-ink-4"> {QUOTE_SYMBOL}</span>
                  </>
                ),
              }))}
            />
          )}
        </Sheet>
        <Sheet label="Latest trades" meta={<ExplorerLink href="/platform/explorer">Open the ledger</ExplorerLink>}>
          {loading ? (
            <Skeleton rows={5} />
          ) : latest.length === 0 ? (
            <EmptyState icon={<Activity />} title="No trades so far" body="Trades will be listed here as soon as the vaults begin to settle them." />
          ) : (
            <ul className="-my-2 divide-y divide-cp-line">
              {latest.map((f, i) => (
                <li key={`${f.symbol}-${f.minutesAgo}-${i}`} className="flex items-center gap-3 py-2.5">
                  <Badge tone={f.side === "buy" ? "up" : "down"}>{f.side === "buy" ? "Buy" : "Sell"}</Badge>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-cp-ink">
                    {f.symbol}
                    {f.venue === "rfq" && <span className="ml-2 text-[12px] font-normal text-cp-ink-4">RFQ</span>}
                  </span>
                  <span className="num shrink-0 text-[13.5px] text-cp-ink-2">
                    {fmtMoney(f.notional)}
                    <span className="text-cp-ink-4"> {QUOTE_SYMBOL}</span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-[12px] text-cp-ink-4">{fmtAgo(f.minutesAgo)}</span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </div>
    </div>
  );
}
