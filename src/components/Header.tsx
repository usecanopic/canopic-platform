"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { GitHubIcon, XIcon } from "@/components/icons";
import { HEADER_LINKS, NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The site bar: mark on the left, the main sections in the middle, sign-in and the way into the
 * product on the right. It sits flat on the canvas and gains a frosted sheet once the page scrolls.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[background-color,border-color] duration-300",
        scrolled || open
          ? "border-cp-line bg-cp-canvas/80 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="page flex h-16 items-center justify-between gap-6">
        <Logo size={28} />

        <nav aria-label="Homepage sections" className="hidden items-center gap-0.5 lg:flex">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[8px] px-3 py-2 text-[14px] text-cp-ink-2 transition-colors hover:bg-cp-sunk hover:text-cp-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <a
            href={SITE.xUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow Canopic on X at ${SITE.xHandle}`}
            className="inline-flex size-9 items-center justify-center rounded-[8px] text-cp-ink-3 transition-colors hover:bg-cp-sunk hover:text-cp-ink"
          >
            <XIcon className="size-3.5" />
          </a>
          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Browse the Canopic code on GitHub"
            className="inline-flex size-9 items-center justify-center rounded-[8px] text-cp-ink-3 transition-colors hover:bg-cp-sunk hover:text-cp-ink"
          >
            <GitHubIcon className="size-4" />
          </a>
          <span className="mx-2 h-5 w-px bg-cp-line-strong" aria-hidden="true" />
          <Link href={SITE.appHref} className="btn btn-ghost btn-sm">
            Log in
          </Link>
          <Link href={SITE.appHref} className="btn btn-primary btn-sm">
            Open the app
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Hide navigation" : "Show navigation"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-[10px] border border-cp-line-strong bg-cp-paper text-cp-ink lg:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div id="mobile-nav" className={cn("lg:hidden", open ? "block" : "hidden")}>
        <div className="page pb-6 pt-2">
          <ul className="divide-hair">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-3.5 text-[16px] font-medium tracking-[-0.01em] text-cp-ink"
                >
                  {link.label}
                  <ArrowRight className="size-4 text-cp-ink-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2">
            <Link href={SITE.appHref} className="btn btn-primary w-full" onClick={() => setOpen(false)}>
              Open the app
            </Link>
            <div className="flex gap-2">
              <a href={SITE.xUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-1">
                {SITE.xHandle}
              </a>
              <a href={SITE.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-1">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
