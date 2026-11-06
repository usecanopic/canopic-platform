"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ArrowRight, BadgeCheck, Layers, Percent, ReceiptText, Wallet } from "lucide-react";
import { useSession } from "@/components/platform/PlatformProviders";
import { RequireAuth } from "@/components/platform/PlatformShell";
import { useAsync, useNow } from "@/components/platform/usePlatformData";
import {
  Badge,
  EmptyState,
  Notice,
  PageHead,
  Segmented,
  Sheet,
  Skeleton,
  StatBand,
  StatCard,
  Table,
  Td,
  Th,
} from "@/components/platform/ui";
import { getMyAttestations, getWalletFills } from "@/lib/platform/queries";
import { fmtAgo, fmtBps, fmtCompact, fmtDate, shortAddress } from "@/lib/platform/format";
import { QUOTE_SYMBOL, marketBySymbol } from "@/lib/platform/markets";
import { platformEnv } from "@/lib/platform/env";
import { cn } from "@/lib/utils";
import { TokenLogo } from "@/components/platform/TokenLogo";

export default function PortfolioPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <PageHead
        code="CP · 04 · Holdings"
        title="Your positions, straight from the chain"
        description={`Everything on this page, from balances and vault shares to your trades, is taken from ${platformEnv.chainName} and priced with the guarded oracles the vaults themselves use. No private books are involved.`}
      />
      <RequireAuth title="Log in to view your positions">
        <Portfolio />
      </RequireAuth>
    </div>
  );
}

const ROLES = ["TRADER", "LP", "MAKER", "RELAYER"] as const;

type SideFilter = "all" | "buy" | "sell";
const SIDE_OPTIONS = [
  { value: "all", label: "Both sides" },
  { value: "buy", label: "Bought" },
  { value: "sell", label: "Sold" },
] as const satisfies readonly { value: SideFilter; label: string }[];

function SwapCta({ label = "Make a first trade" }: { label?: string }) {
  return (
    <Link href="/platform/swap" className="btn btn-primary btn-sm">
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

function Portfolio() {
  const { api, db, userId, walletAddress } = useSession();
  const fills = useAsync(
    () => (walletAddress ? getWalletFills(db, walletAddress) : Promise.resolve([])),
    [db, walletAddress]
  );
  const attestations = useAsync(() => getMyAttestations(api), [api, userId]);
  const now = useNow();
  const [side, setSide] = useState<SideFilter>("all");

  const fillRows = useMemo(() => fills.data ?? [], [fills.data]);
  const shown = useMemo(() => (side === "all" ? fillRows : fillRows.filter((f) => f.side === side)), [fillRows, side]);

  const activeRoles = ROLES.map((role) => ({
    role,
    attestation: attestations.data?.find(
      (x) => x.role === role && x.status === "active" && new Date(x.expires_at) > new Date()
    ),
  }));
  const activeCount = activeRoles.filter((r) => r.attestation).length;

  const fillsReady = !(fills.loading && !fills.data);
  const attestationsReady = !(attestations.loading && !attestations.data);
  const totalNotional = fillRows.reduce((s, f) => s + (Number(f.notional) || 0), 0);
  const avgOverMid =
    fillRows.length > 0
      ? fillRows.reduce((s, f) => s + f.half_spread_bps + f.fee_bps, 0) / fillRows.length
      : null;

  return (
    <div className="space-y-6">
      <Notice>
        You are using <span className="font-mono">{shortAddress(walletAddress)}</span>. The indexer does not track
        balances yet while the launch is guarded, so check the chain itself for those. Lower on this page, trades
        and role status are pulled from the public index the venue publishes.
      </Notice>

      {/* KPIs: only figures the read model actually returns. Holdings value and LP positions wait for the indexer. */}
      {fillsReady && attestationsReady ? (
        <StatBand>
          <StatCard
            label="Trades"
            value={String(fillRows.length)}
            hint={fillRows.length === 50 ? "latest 50 from this address" : "made from this address"}
            icon={<ReceiptText />}
          />
          <StatCard
            label="Total traded"
            value={fmtCompact(totalNotional)}
            hint={`in ${QUOTE_SYMBOL}, across the trades shown`}
            icon={<ArrowLeftRight />}
          />
          <StatCard
            label="Average cost vs mid"
            value={avgOverMid === null ? "n/a" : fmtBps(avgOverMid)}
            hint="spread plus fee, together"
            icon={<Percent />}
          />
          <StatCard
            label="Active attestations"
            value={`${activeCount} of ${ROLES.length}`}
            hint={activeCount > 0 ? activeRoles.filter((r) => r.attestation).map((r) => r.role).join(" · ") : "you have none yet"}
            accent={activeCount > 0 ? "accent" : undefined}
            icon={<BadgeCheck />}
          />
        </StatBand>
      ) : (
        <div className="panel p-5">
          <Skeleton rows={2} />
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Sheet label="Balances" meta="tokens and vault shares">
          <EmptyState
            icon={<Wallet />}
            title="The indexer is not tracking balances yet"
            body="This panel fills itself in once the indexer starts tracking balances. Trades you make settle on-chain straight away in the meantime."
            action={<SwapCta />}
          />
        </Sheet>

        <Sheet label="Vault shares" meta="value and spread earned">
          <EmptyState
            icon={<Layers />}
            title="No vault shares in this wallet"
            body="Deposit through the Vaults page to start collecting spread. Shares can only move between attested LPs, and you can always take yours out."
            action={
              <Link href="/platform/liquidity" className="btn btn-secondary btn-sm">
                Browse vaults
              </Link>
            }
          />
        </Sheet>
      </div>

      <Sheet
        label="Your trades"
        meta={
          fillRows.length > 0 ? (
            <Segmented label="Filter trades by side" options={SIDE_OPTIONS} value={side} onChange={setSide} />
          ) : (
            "from the venue index"
          )
        }
      >
        {!fillsReady ? (
          <Skeleton rows={5} />
        ) : fillRows.length === 0 ? (
          <EmptyState
            icon={<ReceiptText />}
            title="This address has not traded yet"
            body="Each trade you settle will be listed here, split into mid, spread, skew and fee just as its on-chain event logs it."
            action={<SwapCta />}
          />
        ) : (
          <>
            <Table minWidth={720}>
              <thead>
                <tr>
                  <Th>Market</Th>
                  <Th>Side</Th>
                  <Th className="text-right">Size ({QUOTE_SYMBOL})</Th>
                  <Th>Filled by</Th>
                  <Th className="text-right">Cost vs mid</Th>
                  <Th className="text-right">Time</Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((f) => {
                  const sym = f.markets?.symbol ?? "?";
                  const name = marketBySymbol[sym]?.name;
                  return (
                    <tr key={f.id}>
                      <Td>
                        <span className="flex items-center gap-3">
                          <TokenLogo symbol={sym} size={32} />
                          <span className="min-w-0">
                            <span className="block font-medium text-cp-ink">{sym}</span>
                            {name && <span className="block truncate text-[12.5px] text-cp-ink-4">{name}</span>}
                          </span>
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={f.side === "buy" ? "up" : "down"}>{f.side === "buy" ? "Buy" : "Sell"}</Badge>
                      </Td>
                      <Td className="text-right text-cp-ink">
                        {fmtCompact(f.notional)}
                        <span className="text-cp-ink-4"> {QUOTE_SYMBOL}</span>
                      </Td>
                      <Td>
                        <Badge tone={f.venue === "vault" ? "muted" : "accent"}>{f.venue === "vault" ? "Vault" : "RFQ"}</Badge>
                      </Td>
                      <Td className="text-right text-cp-ink-2">{fmtBps(f.half_spread_bps + f.fee_bps)}</Td>
                      <Td className="whitespace-nowrap text-right font-mono text-[12.5px] text-cp-ink-3">
                        <time dateTime={f.executed_at} title={fmtDate(f.executed_at)}>
                          {fmtAgo(Math.max(0, (now - new Date(f.executed_at).getTime()) / 60_000))}
                        </time>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            {shown.length === 0 && (
              <p className="py-6 text-center text-[13.5px] text-cp-ink-3">
                Nothing {side === "buy" ? "bought" : "sold"} from this address yet.
              </p>
            )}
            <p className="mt-4 text-[12.5px] leading-relaxed text-cp-ink-3">
              Every line uses the same breakdown as the public Ledger.
            </p>
          </>
        )}
      </Sheet>

      <Sheet label="Role attestations" meta={attestationsReady ? `${activeCount} of ${ROLES.length} active` : undefined}>
        {!attestationsReady ? (
          <Skeleton rows={4} />
        ) : (
          <ul className="-mx-5 -mt-5 divide-y divide-cp-line border-b border-cp-line">
            {activeRoles.map(({ role, attestation: a }) => (
              <li key={role} className="flex min-h-[52px] items-center justify-between gap-4 px-5 py-2.5">
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={cn("size-1.5 shrink-0 rounded-full", a ? "bg-cp-up" : "bg-cp-ink-4")}
                  />
                  <span className="font-mono text-[12.5px] text-cp-ink">{role}</span>
                </span>
                <span className="flex items-center gap-3">
                  {a && (
                    <span className="font-mono text-[12px] text-cp-ink-4">
                      expires {fmtDate(a.expires_at)}
                    </span>
                  )}
                  <Badge tone={a ? "up" : "muted"}>{a ? "Valid" : "None yet"}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-[13.5px] leading-relaxed text-cp-ink-3">
            You need a role attestation to trade, to supply a vault or to quote as a maker. They are handled on the
            Account page. Taking money out of a vault never needs one.
          </p>
          <Link href="/platform/settings" className="btn btn-secondary btn-sm shrink-0">
            Open Account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Sheet>
    </div>
  );
}
