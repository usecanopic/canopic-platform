import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The app's page header, cut from the same dawn sky as the homepage hero: a rounded band where the
 * title sits in the pale upper sky and the lit horizon runs along the bottom edge. `focus` shifts
 * the crop so neighbouring pages show a different stretch of the horizon.
 */
export function PageBanner({
  kicker,
  title,
  description,
  action,
  focus = "50%",
  className,
  children,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Horizontal position of the crop, as a CSS percentage. */
  focus?: string;
  className?: string;
  /** Optional content placed inside the banner, under the title row (for example a stat strip). */
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "animate-rise relative isolate overflow-hidden rounded-[22px] border border-cp-line bg-cp-paper shadow-[var(--shadow-sheet)]",
        className
      )}
    >
      <Image
        src="/images/hero-space.jpg"
        alt=""
        fill
        priority
        quality={80}
        sizes="(min-width: 1024px) 1100px, 100vw"
        className="-z-20 object-cover"
        style={{ objectPosition: `${focus} 57%` }}
      />
      {/* Keep the left side calm for the title, and let the horizon breathe on the right */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-cp-canvas/90 via-cp-canvas/55 to-cp-canvas/0"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-cp-canvas/40 to-transparent" aria-hidden="true" />

      <div className="relative flex min-h-[188px] flex-col justify-end gap-5 p-6 md:min-h-[212px] md:flex-row md:items-end md:justify-between md:p-8">
        <div className="min-w-0 max-w-[62ch]">
          {kicker && <div className="kicker mb-3">{kicker}</div>}
          <h1 className="h-section text-[34px] text-cp-ink md:text-[42px]">{title}</h1>
          {description && <p className="mt-3 text-[14.5px] leading-relaxed text-cp-ink-2">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children && <div className="relative border-t border-white/50 bg-white/55 backdrop-blur-md">{children}</div>}
    </header>
  );
}
