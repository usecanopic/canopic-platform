"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Gauge, Layers, ReceiptText, SearchX } from "lucide-react";
import { useNow, useVenue } from "@/components/platform/usePlatformData";
import {
  BarChart,
  Badge,
  EmptyState,
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
  sessionTone,
} from "@/components/platform/ui";
import { fmtAgo, fmtBps, fmtCompact } from "@/lib/platform/format";
import { FEES, QUOTE_SYMBOL, REGIMES, TIERS, currentSession } from "@/lib/platform/markets";
import { TokenLogo } from "@/components/platform/TokenLogo";

type SideFilter = "all" | "buy" | "sell";
type VenueFilter = "all" | "vault" | "rfq";

const SIDE_OPTIONS = [
  { value: "all", label: "Both sides" },
  { value: "buy", label: "Bought" },
  { value: "sell", label: "Sold" },
] as const;

const VENUE_OPTIONS = [
  { value: "all", label: "Any source" },
  { value: "vault", label: "Vaults" },
  { value: "rfq", label: "Makers" },
] as const;

const fmtMul = (bps: number) => `x${(bps / 10_000).toFixed(1)}`;

export default function ExplorerPage() {
  const venue = useVenue();
  const now = useNow();
  const session = currentSession(new Date(now));

  const [side, setSide] = useState<SideFilter>("all");
  const [venueFilter, setVenueFilter] = useState<VenueFilter>("all");

  const fills = useMemo(() => venue.data?.fills ?? [], [venue.data]);
  const governance = venue.data?.governance ?? [];
  const markets = venue.data?.markets ?? [];
  const marketCount = markets.length;
  const nameOf = (symbol: string) => markets.find((m) => m.symbol === symbol)?.name;

  const stats = useMemo(() => {
    const total = fills.reduce((s, f) => s + f.notional, 0);
    const weighted = fills.reduce((s, f) => s + f.executionBps * f.notional, 0);
    const rfq = fills.filter((f) => f.venue === "rfq").reduce((s, f) => s + f.notional, 0);
    return {
      total,
      avgBps: total > 0 ? weighted / total : null,
      rfqShare: total > 0 ? (rfq / total) * 100 : 0,
      rfqCount: fills.filter((f) => f.venue === "rfq").length,
    };
  }, [fills]);

  const chronological = useMemo(() => [...fills].sort((a, b) => b.minutesAgo - a.minutesAgo), [fills]);
  const chartData = chronological.map((f) => ({ label: `${f.symbol} · ${fmtAgo(f.minutesAgo)}`, value: f.executionBps }));

  const shown = fills.filter((f) => (side === "all" || f.side === side) && (venueFilter === "all" || f.venue === venueFilter));

  const loading = venue.loading && !venue.data;

  return (
    <div>
      <PageHead
        code="CP · 05 · Ledger"
        title="The public record of every trade"
        description="Itemised trades, the parameters in force and the log of governance changes, assembled purely from on-chain events. Should this page ever disagree with the chain, trust the chain."
      />

      <StatBand className="mt-6">
        <StatCard
          label="Trades on record"
          value={loading ? "…" : String(fills.length)}
          hint={venue.data?.source === "supabase" ? "Maintained by the indexer" : "Sample data until the indexer is live"}
          icon={<ReceiptText aria-hidden="true" />}
        />
        <StatCard
          label="Combined size"
          value={loading ? "…" : fmtCompact(stats.total, QUOTE_SYMBOL)}
          hint="Every trade on this page added up"
          icon={<Layers aria-hidden="true" />}
        />
        <StatCard
          label="Average cost vs mid"
          value={loading ? "…" : fmtBps(stats.avgBps)}
          hint="Weighted by trade size"
          accent="accent"
          icon={<Gauge aria-hidden="true" />}
        />
        <StatCard
          label="Filled by makers"
          value={loading ? "…" : `${stats.rfqShare.toFixed(0)}%`}
          hint={`share of size, ${stats.rfqCount} of ${fills.length} trades`}
          icon={<ArrowLeftRight aria-hidden="true" />}
        />
      </StatBand>

      <Sheet label="Cost of each trade" meta="bps paid over the mid" className="mt-6">
        {loading ? (
          <Skeleton rows={4} />
        ) : (
          <BarChart
            data={chartData}
            height={150}
            format={(v) => fmtBps(v)}
            emptyLabel="No trades to chart yet"
            axisLabels={
              chronological.length > 0
                ? [
                    `Oldest, ${fmtAgo(chronological[0].minutesAgo)}`,
                    `${chronological.length} trades`,
                    `Latest, ${fmtAgo(chronological[chronological.length - 1].minutesAgo)}`,
                  ]
                : undefined
            }
          />
        )}
      </Sheet>

      <Sheet
        label="Trade record"
        meta={venue.data?.source === "supabase" ? "maintained by the indexer" : "sample data for now"}
        className="mt-6"
      >
        {loading ? (
          <Skeleton rows={8} />
        ) : fills.length === 0 ? (
          <EmptyState
            icon={<ReceiptText aria-hidden="true" />}
            title="The record is empty so far"
            action={
              <Link href="/platform/swap" className="btn btn-secondary btn-sm">
                Open the trade ticket
              </Link>
            }
          />
        ) : (
          <>
            <div className="-mx-5 -mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-cp-line px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Segmented label="Filter by side" options={SIDE_OPTIONS} value={side} onChange={setSide} />
                <Segmented label="Filter by liquidity source" options={VENUE_OPTIONS} value={venueFilter} onChange={setVenueFilter} />
              </div>
              <span className="text-[12.5px] text-cp-ink-3">
                <span className="num text-cp-ink-2">{shown.length}</span> of <span className="num">{fills.length}</span>
              </span>
            </div>
            {shown.length === 0 ? (
              <div className="pt-5">
                <EmptyState
                  icon={<SearchX aria-hidden="true" />}
                  title="No trades fit these filters"
                  action={
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSide("all");
                        setVenueFilter("all");
                      }}
                    >
                      Clear filters
                    </button>
                  }
                />
              </div>
            ) : (
              <Table minWidth={720}>
                <thead>
                  <tr>
                    <Th>Age</Th>
                    <Th>Market</Th>
                    <Th>Side</Th>
                    <Th className="text-right">Size</Th>
                    <Th>Filled by</Th>
                    <Th className="text-right">Cost vs mid</Th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((f, i) => {
                    const name = nameOf(f.symbol);
                    return (
                      <tr key={`${f.minutesAgo}-${f.symbol}-${i}`}>
                        <Td className="whitespace-nowrap font-mono text-[12.5px] text-cp-ink-3">{fmtAgo(f.minutesAgo)}</Td>
                        <Td>
                          <div className="flex items-center gap-3">
                            <TokenLogo symbol={f.symbol} size={32} />
                            <div className="min-w-0 leading-tight">
                              <div className="font-medium text-cp-ink">{f.symbol}</div>
                              {name && <div className="truncate text-[12.5px] text-cp-ink-4">{name}</div>}
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <Badge tone={f.side === "buy" ? "up" : "down"}>{f.side === "buy" ? "Buy" : "Sell"}</Badge>
                        </Td>
                        <Td className="whitespace-nowrap text-right text-cp-ink">
                          {fmtCompact(f.notional)}
                          <span className="text-cp-ink-4"> {QUOTE_SYMBOL}</span>
                        </Td>
                        <Td>
                          <span className="tag">{f.venue === "rfq" ? "Maker" : "Vault"}</span>
                        </Td>
                        <Td className="whitespace-nowrap text-right text-cp-ink">
                          {f.executionBps.toFixed(1)}
                          <span className="text-cp-ink-4"> bps</span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </>
        )}
        <p className="mt-5 text-[12px] leading-relaxed text-cp-ink-3">
          Every trade is kept, the costly ones from closed sessions too. Filters change what is displayed, never what is recorded.
        </p>
      </Sheet>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-2">
        <Sheet label="Parameters in force" meta="timelocked, with published reasons">
          <ParamGroup title="By tier">
            {([1, 2, 3] as const).map((t) => (
              <LeaderRow
                key={t}
                label={
                  <span className="inline-flex items-center gap-2.5">
                    <Badge tone={t === 1 ? "accent" : "muted"}>Tier {TIERS[t].label}</Badge>
                    <span>
                      spread <span className="num text-cp-ink-2">{fmtBps(TIERS[t].baseHalfSpreadBps)}</span>
                    </span>
                  </span>
                }
                value={
                  <>
                    limit {fmtBps(TIERS[t].oracleBandBps, 0)}
                    <span className="text-cp-ink-4"> · </span>
                    max {fmtCompact(TIERS[t].maxClip, QUOTE_SYMBOL)}
                  </>
                }
              />
            ))}
          </ParamGroup>
          <ParamGroup title="Right now">
            <LeaderRow label="Regime in force" value={<Badge tone={sessionTone(session)}>{REGIMES[session].label}</Badge>} />
          </ParamGroup>
          <ParamGroup title="Spread scaling">
            <LeaderRow label="Pre and post market" value={`${fmtMul(REGIMES.extended.spreadMulBps)}`} />
            <LeaderRow label="Market shut" value={`${fmtMul(REGIMES.closed.spreadMulBps)}`} />
          </ParamGroup>
          <ParamGroup title="Charges">
            <LeaderRow label="Vault trades" value={fmtBps(FEES.swapFeeBps)} />
            <LeaderRow label="Maker trades" value={fmtBps(FEES.rfqFeeBps)} />
            <LeaderRow label="Venue cut of spread" value={`${FEES.spreadShareBps / 100}%`} />
          </ParamGroup>
          <ParamGroup title="Listings">
            <LeaderRow label="Listed now" value={String(marketCount)} />
          </ParamGroup>
        </Sheet>

        <Sheet label="Change history" meta="has no power over funds">
          <p className="mb-5 text-[13px] text-cp-ink-3">Changes appear here before they come into force.</p>
          <ol className="relative space-y-5">
            {governance.map((entry, i) => (
              <li key={entry.date + entry.action} className="relative pl-6">
                {i < governance.length - 1 && (
                  <span aria-hidden="true" className="absolute bottom-[-20px] left-[3px] top-4 w-px bg-cp-line-strong" />
                )}
                <span
                  aria-hidden="true"
                  className={
                    i === 0
                      ? "absolute left-0 top-[7px] size-[7px] rounded-full bg-cp-accent ring-4 ring-cp-accent-soft"
                      : "absolute left-0 top-[7px] size-[7px] rounded-full border border-cp-line-strong bg-cp-paper"
                  }
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-[14px] font-medium text-cp-ink">{entry.action}</span>
                  <time dateTime={entry.date} className="font-mono text-[11.5px] text-cp-ink-3">
                    {entry.date}
                  </time>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-cp-ink-2">{entry.detail}</p>
              </li>
            ))}
          </ol>
        </Sheet>
      </div>
    </div>
  );
}

function ParamGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-cp-line pt-3 mt-3 first:mt-0 first:border-t-0 first:pt-0">
      <h3 className="lbl mb-1">{title}</h3>
      {children}
    </div>
  );
}
