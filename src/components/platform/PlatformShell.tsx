"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  KeyRound,
  Droplets,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useSession } from "./PlatformProviders";
import { useNow } from "./usePlatformData";
import { shortAddress } from "@/lib/platform/format";
import { REGIMES, currentSession } from "@/lib/platform/markets";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const GROUPS: readonly { label: string; items: readonly NavItem[] }[] = [
  {
    label: "Venue",
    items: [
      { href: "/platform", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/platform/swap", label: "Trade", icon: ArrowRightLeft },
      { href: "/platform/liquidity", label: "Vaults", icon: Droplets },
    ],
  },
  {
    label: "Personal",
    items: [
      { href: "/platform/portfolio", label: "Holdings", icon: Briefcase },
      { href: "/platform/settings", label: "Account", icon: Settings },
    ],
  },
  {
    label: "Open record",
    items: [{ href: "/platform/explorer", label: "Ledger", icon: Search }],
  },
];

const NAV: NavItem[] = GROUPS.flatMap((g) => [...g.items]);

const SESSION_TEXT = {
  regular: "text-cp-up",
  extended: "text-cp-warn",
  closed: "text-cp-ink-2",
} as const;

const SESSION_DOT = {
  regular: "bg-cp-up",
  extended: "bg-cp-warn",
  closed: "bg-cp-ink-4",
} as const;

const SESSION_NAME = { regular: "Market open", extended: "Off-hours", closed: "Market shut" } as const;

function utcClock(now: number) {
  const d = new Date(now);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/**
 * The venue's chrome. On desktop a fixed sidebar holds the mark and the grouped destinations, and a
 * sticky top bar over the content carries the breadcrumb, the live session and the account. Below
 * the lg breakpoint the sidebar becomes a drawer opened from a compact top bar.
 */
export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, authenticated, walletAddress, email, login, logout, sessionError } = useSession();
  const now = useNow();
  const session = currentSession(new Date(now));
  const regime = REGIMES[session];
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const current = NAV.find((item) => isActive(item.href, item.exact));
  const group = GROUPS.find((g) => g.items.some((i) => i.href === current?.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const nav = (
    <nav aria-label="App sections" className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="px-3 pb-2 text-[11.5px] font-medium text-cp-ink-4">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-[9px] px-3 text-[13.5px] font-medium transition-colors",
                      active
                        ? "bg-cp-paper text-cp-ink shadow-[0_1px_2px_rgb(18_18_17/0.06),0_0_0_1px_rgb(18_18_17/0.05)]"
                        : "text-cp-ink-3 hover:bg-cp-sunk hover:text-cp-ink"
                    )}
                  >
                    <item.icon
                      className={cn("size-4 shrink-0 transition-colors", active ? "text-cp-accent-ink" : "text-cp-ink-4 group-hover:text-cp-ink-3")}
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const sessionPill = (compact = false) => (
    <div
      className="flex h-8 items-center gap-2 rounded-full border border-cp-line bg-cp-paper px-3 text-[12.5px] shadow-[var(--shadow-sheet)]"
      title={`Right now spreads scale ×${(regime.spreadMulBps / 10_000).toFixed(1)} and clips ×${(regime.clipMulBps / 10_000).toFixed(2)}`}
    >
      <span className={cn("pulse-dot size-1.5 rounded-full", SESSION_DOT[session])} aria-hidden="true" />
      <span className={cn("font-medium", SESSION_TEXT[session])}>
        <span className="sr-only">US equity session in force: </span>
        {SESSION_NAME[session]}
      </span>
      {!compact && (
        <>
          <span className="h-3 w-px bg-cp-line-strong" aria-hidden="true" />
          <span className="num text-cp-ink-3">spreads ×{(regime.spreadMulBps / 10_000).toFixed(1)}</span>
          <span className="h-3 w-px bg-cp-line-strong" aria-hidden="true" />
          <span className="num text-cp-ink-3" suppressHydrationWarning>
            {utcClock(now)} UTC
          </span>
        </>
      )}
    </div>
  );

  const accountButton = !ready ? (
    <div className="h-8 w-28 animate-pulse rounded-full bg-cp-sunk" />
  ) : authenticated ? (
    <div className="flex h-8 items-center gap-2 rounded-full border border-cp-line bg-cp-paper pl-1 pr-3 shadow-[var(--shadow-sheet)]">
      <Avatar size="sm" />
      <span className="num text-[12.5px] font-medium text-cp-ink">{shortAddress(walletAddress)}</span>
    </div>
  ) : (
    <button type="button" onClick={login} className="btn btn-primary btn-sm h-8">
      Log in
    </button>
  );

  const account = !ready ? (
    <div className="h-[52px] animate-pulse rounded-[12px] bg-cp-sunk" />
  ) : authenticated ? (
    <div className="flex items-center gap-3 rounded-[12px] p-2 pl-2.5 transition-colors hover:bg-cp-sunk">
      <Avatar />
      <div className="min-w-0 flex-1">
        <div className="num truncate text-[13px] font-medium text-cp-ink">{shortAddress(walletAddress)}</div>
        <div className="truncate text-[12px] text-cp-ink-4">{email ?? "Signed in by wallet"}</div>
      </div>
      <button
        type="button"
        onClick={() => void logout()}
        aria-label="Log out"
        title="Log out"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-[9px] text-cp-ink-4 transition-colors hover:bg-cp-paper hover:text-cp-ink"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  ) : (
    // On desktop the top bar carries the sign-in button, so the rail only needs it inside the mobile drawer.
    <button type="button" onClick={login} className="btn btn-primary w-full lg:hidden">
      Log in
      <ArrowUpRight className="size-4" aria-hidden="true" />
    </button>
  );

  const rail = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-5">
        <Logo size={26} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">{nav}</div>
      <div className="px-3 pb-3">
        <div className="grain relative isolate overflow-hidden rounded-[14px] bg-cp-night p-4 text-white">
          <div
            className="pointer-events-none absolute -right-10 -top-12 -z-10 size-40 bg-[radial-gradient(closest-side,rgb(74_222_128/0.35),transparent)]"
            aria-hidden="true"
          />
          <Image src="/images/mark-hero.png" alt="" width={56} height={56} className="size-7 object-contain" />
          <p className="mt-3 text-[13px] font-semibold tracking-[-0.01em]">Robinhood Chain mainnet</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/60">
            <span className="pulse-dot size-1.5 rounded-full bg-[#86efac]" aria-hidden="true" />
            Settling trades live
          </p>
        </div>
      </div>
      <div className="space-y-2 border-t border-cp-line p-3">
        <Link
          href="/"
          onClick={close}
          className="flex h-9 items-center gap-3 rounded-[9px] px-3 text-[13px] text-cp-ink-3 transition-colors hover:bg-cp-sunk hover:text-cp-ink"
        >
          <ArrowLeft className="size-4 text-cp-ink-4" aria-hidden="true" />
          Back to usecanopic.com
        </Link>
        {account}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cp-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[244px] border-r border-cp-line bg-cp-canvas lg:block">{rail}</aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-cp-line bg-cp-canvas/85 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size={26} withWordmark={false} />
            <span className="h-4 w-px bg-cp-line-strong" aria-hidden="true" />
            <span className="truncate text-[14px] font-medium text-cp-ink">{current?.label ?? "App"}</span>
          </div>
          <div className="flex items-center gap-2">
            {sessionPill(true)}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Show navigation"
              aria-expanded={open}
              aria-controls="platform-drawer"
              className="inline-flex size-10 items-center justify-center rounded-[10px] border border-cp-line bg-cp-paper text-cp-ink-2 transition-colors hover:text-cp-ink"
            >
              <Menu className="size-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div
          onClick={close}
          className={cn("absolute inset-0 bg-cp-ink/25 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
        />
        <div
          id="platform-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="App navigation"
          inert={!open}
          className={cn(
            "absolute inset-y-0 left-0 w-[86%] max-w-[300px] border-r border-cp-line bg-cp-canvas shadow-[var(--shadow-stage)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Hide navigation"
            className="absolute right-3 top-2 z-10 inline-flex size-10 items-center justify-center rounded-[10px] text-cp-ink-3 transition-colors hover:bg-cp-sunk hover:text-cp-ink"
          >
            <X className="size-[18px]" />
          </button>
          {rail}
        </div>
      </div>

      <div className="lg:pl-[244px]">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden h-14 border-b border-cp-line bg-cp-canvas/80 backdrop-blur-xl backdrop-saturate-150 lg:block">
          <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-6 px-8">
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
              <span className="text-cp-ink-4">{group?.label ?? "App"}</span>
              <ChevronRight className="size-3.5 text-cp-ink-4" aria-hidden="true" />
              <span className="truncate font-medium text-cp-ink">{current?.label ?? "Dashboard"}</span>
            </nav>
            <div className="flex items-center gap-2">
              {sessionPill()}
              {accountButton}
            </div>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-[1280px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {sessionError && (
            <div
              role="alert"
              className="mb-6 flex gap-3 rounded-[12px] border border-cp-down/25 bg-cp-down/[0.06] px-4 py-3 text-[13.5px] text-cp-down"
            >
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-cp-down" aria-hidden="true" />
              {sessionError}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

/** A round identity chip for the signed-in wallet. */
function Avatar({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-cp-accent to-[#bbf7d0] text-white",
        size === "sm" ? "size-6" : "size-8"
      )}
      aria-hidden="true"
    >
      <span className={cn("rounded-full bg-white/90", size === "sm" ? "size-1.5" : "size-2")} />
    </span>
  );
}

/** A gate that prompts the visitor to sign in before any account-specific content is shown. */
export function RequireAuth({ children, title, body }: { children: React.ReactNode; title?: string; body?: string }) {
  const { ready, authenticated, login } = useSession();
  if (!ready) return <div className="h-48 animate-pulse rounded-[14px] bg-cp-sunk" />;
  if (!authenticated) {
    return (
      <div className="panel relative overflow-hidden">
        <div className="dot-field pointer-events-none absolute inset-y-0 right-0 w-1/2" aria-hidden="true" />
        <div className="relative flex flex-col items-start gap-4 p-6 md:p-10">
          <span className="grid size-10 place-items-center rounded-[10px] bg-cp-accent-soft text-cp-accent-ink" aria-hidden="true">
            <KeyRound className="size-[18px]" />
          </span>
          <h2 className="h-section text-[28px] text-cp-ink">{title ?? "Log in to carry on"}</h2>
          <p className="max-w-xl text-[14px] leading-relaxed text-cp-ink-3">
            {body ?? "Any EVM wallet works, and so does an email address. Choose email and we set up a Robinhood Chain wallet for you, which is where your trades will settle."}
          </p>
          <button type="button" onClick={login} className="btn btn-primary mt-1">
            Log in
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
