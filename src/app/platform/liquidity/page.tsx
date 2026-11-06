"use client";

import { useMemo, useState } from "react";
import { Crosshair, Inbox, Layers, Percent, ShieldCheck, TrendingUp, TriangleAlert, Vault } from "lucide-react";
import { useSession } from "@/components/platform/PlatformProviders";
import { useNow, useVenue } from "@/components/platform/usePlatformData";
import {
  Badge,
  EmptyState,
  Meter,
  Notice,
  PageHead,
  Segmented,
  Sheet,
  Skeleton,
  SplitBar,
  StatBand,
  StatCard,
  Table,
  Td,
  Th,
  sessionTone,
} from "@/components/platform/ui";
import { fmtCompact, fmtMoney } from "@/lib/platform/format";
import { FEES, QUOTE_SYMBOL, REGIMES, TIERS, currentSession } from "@/lib/platform/markets";
import { cn } from "@/lib/utils";
import { TokenLogo } from "@/components/platform/TokenLogo";

type TierFilter = "all" | "1" | "2" | "3";
const TIER_OPTIONS = [
  { value: "all", label: "Every tier" },
  { value: "1", label: "Tier A" },
  { value: "2", label: "Tier B" },
  { value: "3", label: "Tier C" },
] as const satisfies readonly { value: TierFilter; label: string }[];

const LP_SHARE = 100 - FEES.spreadShareBps / 100;

const EXPLAINERS = [
  {
    label: "What you earn",
    icon: TrendingUp,
    tone: "text-cp-up",
    body: `Every trade against your vault leaves its captured spread behind. After the venue keeps ${FEES.spreadShareBps / 100}%, the rest raises the value of each share. There are no reward tokens and no points schemes.`,
  },
  {
    label: "What you carry",
    icon: TriangleAlert,
    tone: "text-cp-warn",
    body: "The price of the token you chose, the chance of a jump between Friday and Monday on trades filled while markets are shut (which the x3 multiplier is there to pay for), and the issuer risk built into every Stock Token.",
  },
  {
    label: "What you never carry",
    icon: ShieldCheck,
    tone: "text-cp-accent-ink",
    body: "There is no borrowing, nothing can liquidate you, other listings cannot pass their losses to you, and no gate stands at the exit. Withdrawal is guaranteed by a contract invariant, so nobody has to approve it.",
  },
];

export default function LiquidityPage() {
  const { authenticated, login } = useSession();
  const venue = useVenue();
  const now = useNow();
  const session = currentSession(new Date(now));
  const markets = useMemo(() => venue.data?.markets ?? [], [venue.data]);
  const loading = venue.loading && !venue.data;
  const [tier, setTier] = useState<TierFilter>("all");

  const tvl = markets.reduce((acc, m) => acc + m.tvl, 0);
  const funded = markets.filter((m) => m.tvl > 0);
  const inBand = markets.filter((m) => Math.abs(m.inventoryRatioBps - 5000) <= TIERS[m.tier].inventoryBandBps).length;
  const shown = tier === "all" ? markets : markets.filter((m) => String(m.tier) === tier);
  const share = [...funded].sort((a, b) => b.tvl - a.tvl).map((m) => ({ key: m.symbol, label: m.symbol, value: m.tvl }));

  return (
    <div>
      <PageHead
        code="CP · 03 · Vaults"
        title="Get paid for liquidity, not picked off by arbitrage"
        description="A vault that quotes from the oracle rewards its LPs for being ready to trade at once. Vaults are walled off from each other, so trouble in one listing stays there."
      />

      <div className="mt-6">
        <Notice>
          You need an <span className="font-mono">LP</span> attestation before you can deposit, and for now only
          professional clients receive one. Exits pay back your proportional share of both tokens and are open
          whatever state a vault is in.
        </Notice>
      </div>

      <StatBand className="mt-6">
        <StatCard label="Value across vaults" value={fmtCompact(tvl, QUOTE_SYMBOL)} hint="all listings added together" accent="accent" icon={<Vault />} />
        <StatCard
          label="Vault count"
          value={String(markets.length)}
          hint={`${funded.length} funded so far, ${markets.length - funded.length} awaiting deposits`}
          icon={<Layers />}
        />
        <StatCard
          label="LP cut of spread"
          value={`${LP_SHARE}%`}
          hint={`the venue keeps ${FEES.spreadShareBps / 100}%`}
          icon={<Percent />}
        />
        <StatCard
          label="Vaults near target"
          value={`${inBand} of ${markets.length}`}
          hint="holding 30% to 70% in the token"
          icon={<Crosshair />}
        />
      </StatBand>

      <Sheet
        className="mt-6"
        label="Vault list"
        meta={
          <span className="flex items-center gap-2">
            Regime <Badge tone={sessionTone(session)}>{REGIMES[session].label}</Badge>
          </span>
        }
      >
        <div className="-mx-5 -mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-cp-line px-5 py-3">
          <Segmented label="Filter vaults by tier" options={TIER_OPTIONS} value={tier} onChange={setTier} />
          <span className="text-[12.5px] text-cp-ink-4">
            {shown.length} {shown.length === 1 ? "vault" : "vaults"} shown
          </span>
        </div>
        {loading ? (
          <div className="pt-5">
            <Skeleton rows={6} />
          </div>
        ) : shown.length === 0 ? (
          <div className="pt-5">
            <EmptyState icon={<Inbox />} title="No vaults sit in this tier" body="Switch tiers to see the vaults listed there." />
          </div>
        ) : (
          <Table minWidth={820}>
            <thead>
              <tr>
                <Th>Vault</Th>
                <Th>Tier</Th>
                <Th className="text-right">TVL, {QUOTE_SYMBOL}</Th>
                <Th>Inventory held in the token</Th>
                <Th className="text-right">Tier half-spread, bps</Th>
                <Th className="text-right">Paid to LPs</Th>
                <Th className="text-right">
                  <span className="sr-only">Deposit</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => {
                const t = TIERS[m.tier];
                const pct = m.inventoryRatioBps / 100;
                // Warn as the vault nears the edge of its inventory band.
                const warn = Math.abs(m.inventoryRatioBps - 5000) > t.inventoryBandBps * 0.75;
                return (
                  <tr key={m.symbol}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <TokenLogo symbol={m.symbol} size={32} />
                        <div className="min-w-0">
                          <div className="font-medium text-cp-ink">{m.symbol}</div>
                          <div className="truncate text-[12.5px] text-cp-ink-4">{m.name}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={m.tier === 1 ? "accent" : "muted"}>{t.label}</Badge>
                    </Td>
                    <Td className="text-right text-cp-ink">{m.tvl > 0 ? fmtMoney(m.tvl) : <span className="text-cp-ink-4">0</span>}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Meter value={pct / 100} target={0.5} tone={warn ? "warn" : "accent"} className="w-28" />
                        <span className={cn("text-[12.5px]", warn ? "text-cp-warn" : "text-cp-ink-2")}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </Td>
                    <Td className="text-right">{t.baseHalfSpreadBps}</Td>
                    <Td className="text-right text-cp-up">{LP_SHARE}%</Td>
                    <Td className="text-right">
                      {authenticated ? (
                        <button type="button" className="btn btn-secondary btn-sm disabled:cursor-not-allowed disabled:opacity-40" disabled>
                          Deposits open soon
                        </button>
                      ) : (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={login}>
                          Log in
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <p className="mt-5 text-[12px] leading-relaxed text-cp-ink-3">
          New deposits are valued at the live mid, so they pause whenever a listing is halted, while exits carry on.
          The small tick on each bar shows the 50% balance point.
        </p>
      </Sheet>

      <Sheet className="mt-6" label="Where the vault value sits" meta={<span className="num">{fmtCompact(tvl, QUOTE_SYMBOL)}</span>}>
        {loading ? (
          <Skeleton rows={2} />
        ) : share.length === 0 ? (
          <EmptyState icon={<Vault />} title="Every vault is still unfunded" />
        ) : (
          <SplitBar parts={share} format={(v) => fmtMoney(v)} />
        )}
      </Sheet>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
        {EXPLAINERS.map((c) => (
          <div key={c.label} className="panel p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-cp-line bg-cp-paper">
                <c.icon className={cn("size-4", c.tone)} aria-hidden="true" />
              </span>
              <h3 className="text-[14px] font-medium text-cp-ink">{c.label}</h3>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-cp-ink-2">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
