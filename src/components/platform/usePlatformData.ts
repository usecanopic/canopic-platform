"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useSession } from "./PlatformProviders";
import { friendlyError } from "@/lib/platform/format";
import { platformEnv } from "@/lib/platform/env";
import {
  getGovernanceLog,
  getLatestPrices,
  getLatestSnapshots,
  getRecentFills,
  getVenueMarkets,
} from "@/lib/platform/queries";
import { DEMO_FILLS, GOVERNANCE_LOG, MARKETS, type DemoFill, type VaultMarket } from "@/lib/platform/markets";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/** A lightweight async loader driven by an explicit list of dependencies. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

// One shared ticking clock, surfaced via useSyncExternalStore, lets components read "now" while rendering
// without calling Date.now() in render. A single interval feeds all subscribers, the session badge included.
const clock = {
  value: Date.now(),
  listeners: new Set<() => void>(),
  timer: null as ReturnType<typeof setInterval> | null,
  subscribe(cb: () => void) {
    clock.listeners.add(cb);
    if (!clock.timer) {
      clock.timer = setInterval(() => {
        clock.value = Date.now();
        clock.listeners.forEach((l) => l());
      }, 30_000);
    }
    return () => {
      clock.listeners.delete(cb);
      if (clock.listeners.size === 0 && clock.timer) {
        clearInterval(clock.timer);
        clock.timer = null;
      }
    };
  },
  get: () => clock.value,
};

/** Wall-clock time in milliseconds, updated every 30 seconds. */
export function useNow(): number {
  return useSyncExternalStore(clock.subscribe, clock.get, clock.get);
}

// ---------------------------------------------------------------------------
// Venue data: the Supabase read model if it has rows, otherwise the built-in catalogue
// ---------------------------------------------------------------------------

export interface GovernanceEntry {
  date: string;
  action: string;
  detail: string;
}

export interface VenueData {
  markets: VaultMarket[];
  fills: DemoFill[];
  governance: GovernanceEntry[];
  /** The data's origin: either the indexer's read model or the local indicative catalogue. */
  source: "supabase" | "local";
}

const LOCAL_VENUE: VenueData = {
  markets: MARKETS,
  fills: DEMO_FILLS,
  governance: GOVERNANCE_LOG.map((g) => ({ ...g })),
  source: "local",
};

/**
 * Fetches the venue read model from Supabase and converts it into the shapes the pricing module expects.
 * If the tables are empty or cannot be reached it uses the built-in catalogue instead, so the platform
 * looks the same in both cases while stating truthfully where the data came from.
 */
export function useVenue(): AsyncState<VenueData> {
  const { db } = useSession();
  return useAsync<VenueData>(async () => {
    try {
      const [rows, prices, snapshots, fills, governance] = await Promise.all([
        getVenueMarkets(db, platformEnv.chainId),
        getLatestPrices(db),
        getLatestSnapshots(db),
        getRecentFills(db),
        getGovernanceLog(db),
      ]);
      if (rows.length === 0) return LOCAL_VENUE;

      const markets: VaultMarket[] = rows.flatMap((m) => {
        const price = prices[m.id];
        if (!price) return []; // no oracle row means the market has no price
        const snap = snapshots[m.id];
        const tier = m.tier === 1 || m.tier === 2 || m.tier === 3 ? m.tier : 3;
        return [
          {
            symbol: m.symbol,
            name: m.name,
            tier,
            mid: Number(price.price),
            inventoryRatioBps: snap?.inventory_ratio_bps ?? 5_000,
            tvl: Number(snap?.tvl ?? 0),
            volume24h: Number(snap?.volume_24h ?? 0),
          } satisfies VaultMarket,
        ];
      });
      if (markets.length === 0) return LOCAL_VENUE;

      const marketNames = Object.fromEntries(rows.map((m) => [m.id, m.symbol]));
      const now = Date.now();
      const mappedFills: DemoFill[] = fills.map((f) => ({
        minutesAgo: Math.max(0, (now - new Date(f.executed_at).getTime()) / 60_000),
        symbol: marketNames[f.market_id] ?? "?",
        side: f.side,
        notional: Number(f.notional),
        venue: f.venue,
        executionBps: f.half_spread_bps + f.fee_bps,
      }));

      const mappedGovernance: GovernanceEntry[] = governance.map((g) => ({
        date: new Date(g.occurred_at).toISOString().slice(0, 10),
        action: g.action,
        detail: g.detail,
      }));

      return { markets, fills: mappedFills, governance: mappedGovernance, source: "supabase" as const };
    } catch {
      // The read model is unreachable or not set up, so the built-in catalogue keeps the venue readable.
      return LOCAL_VENUE;
    }
  }, [db]);
}
