/**
 * The platform's market catalogue and vault pricing.
 *
 * The quotes produced here match the OracleVault formula exactly (fee taken from the quote-token side,
 * a regime-adjusted half-spread around the mid, signed inventory skew, plus clip and band checks), and the
 * session comes from the real US-equity clock, so the ticket acts just as the venue would.
 * Until the venue indexer supplies this page, mids, inventories and volumes are indicative. The
 * catalogue that follows mirrors supabase/seed.sql: a venue one week old, holding about $2,130 of TVL
 * over six funded markets, with a few hundred dollars of volume a day.
 */

export type Session = "regular" | "extended" | "closed";

export interface TierParams {
  label: string;
  baseHalfSpreadBps: number;
  maxSkewBps: number;
  inventoryBandBps: number;
  oracleBandBps: number;
  /** The biggest single swap allowed in the regular session, as quote-token notional. */
  maxClip: number;
}

export const TIERS: Record<1 | 2 | 3, TierParams> = {
  1: { label: "A", baseHalfSpreadBps: 10, maxSkewBps: 15, inventoryBandBps: 2000, oracleBandBps: 75, maxClip: 50_000 },
  2: { label: "B", baseHalfSpreadBps: 20, maxSkewBps: 25, inventoryBandBps: 2000, oracleBandBps: 150, maxClip: 20_000 },
  3: { label: "C", baseHalfSpreadBps: 40, maxSkewBps: 50, inventoryBandBps: 2000, oracleBandBps: 300, maxClip: 5_000 },
};

export const REGIMES: Record<Session, { label: string; spreadMulBps: number; clipMulBps: number }> = {
  regular: { label: "OPEN", spreadMulBps: 10_000, clipMulBps: 10_000 },
  extended: { label: "EXTENDED", spreadMulBps: 15_000, clipMulBps: 7_500 },
  closed: { label: "CLOSED", spreadMulBps: 30_000, clipMulBps: 5_000 },
};

export const FEES = { swapFeeBps: 2, rfqFeeBps: 2, spreadShareBps: 1000 } as const;

export const QUOTE_SYMBOL = "USDG";

export interface VaultMarket {
  symbol: string;
  name: string;
  tier: 1 | 2 | 3;
  /** Price in USDG for one whole token. */
  mid: number;
  /** The token's share of vault value in bps, where 5000 means on target. */
  inventoryRatioBps: number;
  /** Value of the vault, in USDG. */
  tvl: number;
  volume24h: number;
}

export const MARKETS: VaultMarket[] = [
  { symbol: "NVDAx", name: "NVIDIA Stock Token", tier: 1, mid: 177.4, inventoryRatioBps: 5128, tvl: 531.31, volume24h: 294.42 },
  { symbol: "SPYx", name: "SPDR S&P 500 Stock Token", tier: 1, mid: 643.56, inventoryRatioBps: 4966, tvl: 616.87, volume24h: 386.97 },
  { symbol: "AAPLx", name: "Apple Stock Token", tier: 1, mid: 229.65, inventoryRatioBps: 5098, tvl: 352.87, volume24h: 102.33 },
  { symbol: "MSFTx", name: "Microsoft Stock Token", tier: 1, mid: 510.2, inventoryRatioBps: 5145, tvl: 223.27, volume24h: 34 },
  { symbol: "QQQx", name: "Invesco QQQ Stock Token", tier: 1, mid: 592.18, inventoryRatioBps: 4944, tvl: 307.16, volume24h: 85.14 },
  { symbol: "TSLAx", name: "Tesla Stock Token", tier: 2, mid: 345.57, inventoryRatioBps: 4595, tvl: 100.25, volume24h: 25 },
  { symbol: "AMZNx", name: "Amazon Stock Token", tier: 2, mid: 230.7, inventoryRatioBps: 5000, tvl: 0, volume24h: 0 },
  { symbol: "PLTRx", name: "Palantir Stock Token", tier: 3, mid: 146.61, inventoryRatioBps: 5000, tvl: 0, volume24h: 0 },
];

export const marketBySymbol = Object.fromEntries(MARKETS.map((m) => [m.symbol, m])) as Record<string, VaultMarket>;

/**
 * Works out the US-equity session from the UTC clock (standard time): regular from 14:30 to 21:00,
 * extended from 09:00 to 14:30 and from 21:00 to 01:00, and closed at all other times and across the
 * weekend. On the venue, the session comes from the oracle's market status; this clock merely approximates it locally.
 */
export function currentSession(now: Date = new Date()): Session {
  const day = now.getUTCDay(); // 0 is Sunday through 6 for Saturday
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const inWrappedTail = minutes < 60; // 00:00 to 01:00 counts as part of the prior day's extended session
  if (inWrappedTail) {
    const prev = (day + 6) % 7;
    return prev === 0 || prev === 6 ? "closed" : "extended";
  }
  if (day === 0 || day === 6) return "closed";
  if (minutes >= 870 && minutes < 1260) return "regular"; // 14:30 to 21:00
  if (minutes >= 540 && minutes < 870) return "extended"; // 09:00 to 14:30
  if (minutes >= 1260) return "extended"; // 21:00 to midnight
  return "closed";
}

export interface SwapQuoteResult {
  ok: boolean;
  reason?: string;
  session: Session;
  regimeLabel: string;
  mid: number;
  halfSpreadBps: number;
  skewBps: number;
  feeBps: number;
  /** Amount out, in tokens for a buy and in USDG for a sell. */
  amountOut: number;
  feeAmount: number;
  spreadAmount: number;
  /** Notional in the quote token at mid, which is the unit the clip is measured in. */
  notional: number;
  clip: number;
}

/** Prices a swap exactly as OracleVault would. `amountIn` is in USDG for a buy and in tokens for a sell. */
export function quoteSwap(
  market: VaultMarket,
  buyToken: boolean,
  amountIn: number,
  session: Session = currentSession()
): SwapQuoteResult {
  const tier = TIERS[market.tier];
  const regime = REGIMES[session];
  const base: SwapQuoteResult = {
    ok: false,
    session,
    regimeLabel: regime.label,
    mid: market.mid,
    halfSpreadBps: 0,
    skewBps: 0,
    feeBps: FEES.swapFeeBps,
    amountOut: 0,
    feeAmount: 0,
    spreadAmount: 0,
    notional: 0,
    clip: (tier.maxClip * regime.clipMulBps) / 10_000,
  };
  if (!Number.isFinite(amountIn) || amountIn <= 0) return { ...base, reason: "Enter an amount" };

  // Skew carries a sign and is positive when the vault is long the token; whichever side rebalances gets the tighter quote.
  let skew = (tier.maxSkewBps * (market.inventoryRatioBps - 5_000)) / tier.inventoryBandBps;
  skew = Math.max(-tier.maxSkewBps, Math.min(tier.maxSkewBps, skew));
  const half = Math.max(0, (tier.baseHalfSpreadBps * regime.spreadMulBps) / 10_000 + (buyToken ? -skew : skew));
  if (half + FEES.swapFeeBps > tier.oracleBandBps) {
    return { ...base, skewBps: Math.round(skew), reason: "Outside the oracle band" };
  }

  let out: SwapQuoteResult;
  if (buyToken) {
    const feeAmount = (amountIn * FEES.swapFeeBps) / 10_000;
    const net = amountIn - feeAmount;
    const ask = market.mid * (1 + half / 10_000);
    const amountOut = net / ask;
    out = {
      ...base,
      ok: true,
      halfSpreadBps: half,
      skewBps: Math.round(skew),
      amountOut,
      feeAmount,
      spreadAmount: net - amountOut * market.mid,
      notional: amountIn,
    };
  } else {
    const midValue = amountIn * market.mid;
    const bid = market.mid * (1 - half / 10_000);
    const gross = amountIn * bid;
    const feeAmount = (gross * FEES.swapFeeBps) / 10_000;
    out = {
      ...base,
      ok: true,
      halfSpreadBps: half,
      skewBps: Math.round(skew),
      amountOut: gross - feeAmount,
      feeAmount,
      spreadAmount: midValue - gross,
      notional: midValue,
    };
  }
  if (out.notional > out.clip) {
    return { ...out, ok: false, reason: `Larger than the ${out.clip.toLocaleString("en-US")} ${QUOTE_SYMBOL} limit for the ${REGIMES[session].label} session` };
  }
  return out;
}

export interface DemoFill {
  minutesAgo: number;
  symbol: string;
  side: "buy" | "sell";
  notional: number;
  venue: "vault" | "rfq";
  /** How far the fill sat from the oracle mid, as bps over mid paid by the taker. */
  executionBps: number;
}

/** The final day of seed.sql, shown in the explorer as recent fills until the indexer is hooked up. */
export const DEMO_FILLS: DemoFill[] = [
  { minutesAgo: 15, symbol: "SPYx", side: "buy", notional: 180, venue: "vault", executionBps: 13 },
  { minutesAgo: 39, symbol: "NVDAx", side: "buy", notional: 63, venue: "vault", executionBps: 10 },
  { minutesAgo: 94, symbol: "AAPLx", side: "sell", notional: 47.33, venue: "vault", executionBps: 12 },
  { minutesAgo: 161, symbol: "SPYx", side: "buy", notional: 130, venue: "vault", executionBps: 14 },
  { minutesAgo: 219, symbol: "QQQx", side: "buy", notional: 46, venue: "vault", executionBps: 13 },
  { minutesAgo: 291, symbol: "NVDAx", side: "sell", notional: 90.42, venue: "vault", executionBps: 12 },
  { minutesAgo: 370, symbol: "MSFTx", side: "buy", notional: 34, venue: "vault", executionBps: 13 },
  { minutesAgo: 594, symbol: "NVDAx", side: "buy", notional: 141, venue: "rfq", executionBps: 10 },
  { minutesAgo: 683, symbol: "TSLAx", side: "buy", notional: 25, venue: "vault", executionBps: 24 },
  { minutesAgo: 801, symbol: "SPYx", side: "sell", notional: 76.97, venue: "vault", executionBps: 10 },
];

/** The timelocked parameter history displayed in the explorer's governance log. */
export const GOVERNANCE_LOG = [
  {
    date: "2026-08-30",
    action: "First markets opened",
    detail: "Vaults opened for trading: SPYx, QQQx, AAPLx, MSFTx and NVDAx in Tier A, TSLAx and AMZNx in Tier B, and PLTRx in Tier C.",
  },
  {
    date: "2026-08-30",
    action: "Launch parameters set",
    detail: "Half-spreads set at 10, 20 and 40 bps for Tiers A, B and C, with oracle bands of 75, 150 and 300 bps. Extended hours multiply spreads by x1.5 and closed sessions by x3. The protocol takes a 2 bps fee plus 10% of spread.",
  },
  {
    date: "2026-08-29",
    action: "Contracts shipped",
    detail: "Six core contracts went live, namely SwapRouter, VaultFactory, RfqSettler, OracleAdapter, EligibilityRegistry and SettingsTimelock, each with Blockscout-verified source.",
  },
] as const;
