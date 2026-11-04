"use client";

import { useSyncExternalStore } from "react";
import { ShieldCheck } from "lucide-react";
import { currentSession, type Session } from "@/lib/platform/markets";
import { cn } from "@/lib/utils";
import { Section } from "./Section";

const DAY = [
  { session: "extended", from: 0, minutes: 60 },
  { session: "closed", from: 60, minutes: 480 },
  { session: "extended", from: 540, minutes: 330 },
  { session: "regular", from: 870, minutes: 390 },
  { session: "extended", from: 1260, minutes: 180 },
] as const;

const LEGEND = [
  { session: "regular", label: "Regular hours", spread: "spread at ×1.0", clip: "clip unchanged" },
  { session: "extended", label: "Pre-market and after-hours", spread: "spread at ×1.5", clip: "clip at ×0.75" },
  { session: "closed", label: "Exchange shut", spread: "spread at ×3.0", clip: "clip at ×0.5" },
] as const;

const HALTS = [
  { trigger: "The latest oracle reading is older than this session allows", clears: "a new oracle round arrives" },
  { trigger: "A corporate action is under way and the feed reports oraclePaused()", clears: "the feed comes back" },
  { trigger: "One oracle round moves the price by over 25%", clears: "a public review clears the timelock" },
  { trigger: "The sequencer went down, plus one hour of grace after it recovers", clears: "the hour of grace runs out" },
] as const;

/** State colours, one per regime: open is up, extended is warn, closed is neutral slate, as in the venue app. */
const TONE: Record<Session, { stroke: string; fill: string; text: string; bg: string; soft: string }> = {
  regular: { stroke: "stroke-cp-up", fill: "fill-cp-up", text: "text-cp-up", bg: "bg-cp-up", soft: "bg-cp-up/[0.09]" },
  extended: { stroke: "stroke-cp-warn", fill: "fill-cp-warn", text: "text-cp-warn", bg: "bg-cp-warn", soft: "bg-cp-warn/[0.1]" },
  closed: { stroke: "stroke-cp-ink-3", fill: "fill-cp-ink-2", text: "text-cp-ink-2", bg: "bg-cp-ink-3", soft: "bg-cp-sunk" },
};

const SESSION_NAME: Record<Session, string> = { regular: "Regular", extended: "Extended", closed: "Off-hours" };

const SIZE = 320;
const MIDPT = SIZE / 2;
const R = 118;
const C = 2 * Math.PI * R;

/** A clock that ticks every 20 seconds on the client and is absent on the server, so hydration matches. */
const TICK = 20_000;
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, TICK);
  return () => window.clearInterval(id);
}
const getSnapshot = () => Math.floor(Date.now() / TICK);
const getServerSnapshot = () => null;

const polar = (minutes: number, r: number) => {
  const a = (minutes / 1440) * 2 * Math.PI - Math.PI / 2;
  // Rounded so the server and the browser serialise identical coordinates.
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return { x: round(MIDPT + r * Math.cos(a)), y: round(MIDPT + r * Math.sin(a)) };
};

export function SessionClock() {
  const tick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const now = tick === null ? null : new Date(tick * TICK);
  const live = now ? currentSession(now) : null;
  const minutes = now ? now.getUTCHours() * 60 + now.getUTCMinutes() : 0;
  const clock = now
    ? `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`
    : "--:--";
  const day = now?.getUTCDay();
  const weekend = day === 0 || day === 6;
  const hand = polar(minutes, R + 14);
  const handIn = polar(minutes, R - 40);

  return (
    <Section
      id="hours"
      kicker="Market hours"
      tone="canvas"
      title={
        <>
          Spreads that follow the <em className="italic">exchange clock</em>
        </>
      }
      lede="A Stock Token can change hands at any hour, yet the stock behind it trades on an exchange for only about 32 hours each week. The oracle reports which session is in force, and each market prices that gap accordingly."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-8">
        {/* The dial */}
        <div className="card overflow-hidden">
          <div className="card-head">
            <span className="h-card text-[14px] text-cp-ink">24-hour clock</span>
            <span className="tag num">{clock} UTC</span>
          </div>
          <div className="relative px-6 py-8">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="relative mx-auto w-full max-w-[340px]"
              role="img"
              aria-label="Sessions across a weekday in UTC: off-hours between 01:00 and 09:00, extended trading to 14:30, regular trading to 21:00, and extended trading again until 01:00"
            >
              <circle cx={MIDPT} cy={MIDPT} r={R} fill="none" className="stroke-cp-sunk" strokeWidth="22" />
              <circle cx={MIDPT} cy={MIDPT} r={R - 44} fill="none" className="stroke-cp-line-strong" strokeWidth="1" strokeDasharray="2 5" />
              {DAY.map((seg, i) => {
                const len = (seg.minutes / 1440) * C - 3;
                const start = (seg.from / 1440) * C + 1.5;
                const lit = live === seg.session;
                return (
                  <circle
                    key={i}
                    cx={MIDPT}
                    cy={MIDPT}
                    r={R}
                    fill="none"
                    className={cn(TONE[seg.session].stroke, "transition-opacity duration-500")}
                    strokeOpacity={live === null ? 0.7 : lit ? 1 : 0.22}
                    strokeWidth="22"
                    strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={-start}
                    transform={`rotate(-90 ${MIDPT} ${MIDPT})`}
                  />
                );
              })}
              {Array.from({ length: 96 }).map((_, q) => {
                const major = q % 24 === 0;
                const hour = q % 4 === 0;
                const a = polar(q * 15, R + 17);
                const b = polar(q * 15, R + (major ? 29 : hour ? 24 : 20));
                return (
                  <line
                    key={q}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className={major ? "stroke-cp-ink-3" : "stroke-cp-line-strong"}
                    strokeWidth="1"
                  />
                );
              })}
              {[0, 6, 12, 18].map((h) => {
                const p = polar(h * 60, R - 28);
                return (
                  <text
                    key={h}
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="var(--font-sans)"
                    fontSize="10"
                    className="fill-cp-ink-3"
                  >
                    {String(h).padStart(2, "0")}:00
                  </text>
                );
              })}
              {now && (
                <g>
                  <line x1={handIn.x} y1={handIn.y} x2={hand.x} y2={hand.y} className="stroke-cp-ink" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx={hand.x} cy={hand.y} r="9" className="fill-cp-ink/10" />
                  <circle cx={hand.x} cy={hand.y} r="4" className="fill-cp-ink" />
                </g>
              )}
              {live ? (
                <>
                  <text
                    x={MIDPT}
                    y={MIDPT - 6}
                    textAnchor="middle"
                    fontFamily="var(--font-serif)"
                    fontSize="26"
                    className={TONE[live].fill}
                  >
                    {SESSION_NAME[live]}
                  </text>
                  <text x={MIDPT} y={MIDPT + 16} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9" letterSpacing="1.5" className="fill-cp-ink-3">
                    {weekend ? "SAT OR SUN, UTC" : "MON TO FRI, UTC"}
                  </text>
                </>
              ) : (
                <>
                  <text x={MIDPT} y={MIDPT - 4} textAnchor="middle" fontFamily="var(--font-serif)" fontSize="24" className="fill-cp-ink">
                    Mon to Fri
                  </text>
                  <text x={MIDPT} y={MIDPT + 16} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9" letterSpacing="1.5" className="fill-cp-ink-3">
                    UTC CLOCK
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>

        {/* The regimes */}
        <div className="flex flex-col gap-6">
          <ul className="card divide-hair overflow-hidden">
            {LEGEND.map((l) => {
              const lit = live === l.session;
              return (
                <li
                  key={l.label}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 transition-colors sm:px-6",
                    lit && "bg-cp-canvas"
                  )}
                >
                  <span className={cn("relative flex size-2.5 rounded-full", TONE[l.session].bg, !lit && live && "opacity-35")} aria-hidden="true">
                    {lit && <span className={cn("pulse-dot absolute -inset-1.5 rounded-full opacity-25", TONE[l.session].bg)} />}
                  </span>
                  <div className="min-w-0">
                    <p className="h-card text-[17px] text-cp-ink">{l.label}</p>
                    <p className="num mt-1 text-[13px] text-cp-ink-3">
                      {l.spread} · {l.clip}
                    </p>
                  </div>
                  {lit ? (
                    <span className={cn("inline-flex h-[22px] items-center rounded-[6px] px-2 text-[12px] font-medium", TONE[l.session].text, TONE[l.session].soft)}>
                      Live
                    </span>
                  ) : (
                    <span className="text-[12px] text-cp-ink-4">{SESSION_NAME[l.session]}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="px-1 text-[15px] leading-relaxed text-cp-ink-3">
            Saturday and Sunday count as off-hours throughout. Quotes keep coming at ×3.0 with clips cut in
            half, and the quote states this up front. Going silent would bolt exchange hours onto a network
            that never sleeps; pricing a weekend like a Tuesday would leave vault depositors absorbing every
            Monday open for free. When a trade can wait for regular hours it will cost less, and Canopic
            points that out rather than hiding it.
          </p>
        </div>
      </div>

      {/* Fault table */}
      <div className="card mt-6 overflow-hidden lg:mt-8">
        <div className="card-head px-5 py-4 sm:px-6">
          <h3 className="h-card text-[17px] text-cp-ink sm:text-[18px]">What pauses a market entirely</h3>
          <span className="tag num shrink-0">{HALTS.length}</span>
        </div>
        <ol className="divide-hair">
          {HALTS.map((h, i) => (
            <li
              key={h.trigger}
              className="grid gap-2 px-5 py-4 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-6"
            >
              <span className="num text-[13px] text-cp-ink-4">{i + 1}</span>
              <span className="text-[15px] leading-relaxed text-cp-ink-2">{h.trigger}</span>
              <span className="justify-self-start rounded-[6px] bg-cp-accent-soft px-2.5 py-1.5 text-[12.5px] font-medium leading-snug text-cp-accent-ink sm:justify-self-end">
                Back once {h.clears}
              </span>
            </li>
          ))}
        </ol>
        <p className="flex items-center gap-2.5 border-t border-cp-line bg-cp-canvas px-5 py-3.5 text-[13.5px] text-cp-ink-3 sm:px-6">
          <ShieldCheck className="size-4 shrink-0 text-cp-up" aria-hidden="true" />
          A pause freezes new quotes only. Depositors can take their funds out of a vault the whole time.
        </p>
      </div>
    </Section>
  );
}
