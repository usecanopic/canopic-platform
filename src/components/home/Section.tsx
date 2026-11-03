import { cn } from "@/lib/utils";

/**
 * The frame for every homepage section: a green kicker, the serif headline, an optional lede, then
 * the content. Tones alternate the page between the warm canvas, white paper and the occasional
 * night band, so each section reads as its own sheet.
 */
export function Section({
  id,
  kicker,
  title,
  lede,
  tone = "canvas",
  align = "left",
  aside,
  children,
}: {
  id: string;
  kicker: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  tone?: "canvas" | "paper" | "night";
  align?: "left" | "center";
  /** Optional content placed to the right of the heading on wide screens. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const center = align === "center";
  const night = tone === "night";
  return (
    <section
      id={id}
      className={cn(
        "relative isolate scroll-mt-16 overflow-hidden py-24 md:py-32",
        tone === "canvas" && "bg-cp-canvas",
        tone === "paper" && "border-y border-cp-line bg-cp-paper",
        night && "grain bg-cp-night text-white"
      )}
    >
      <div className="page relative">
        <div className={cn("flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between", center && "lg:flex-col lg:items-center")}>
          <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
            <p className={cn("kicker", night && "!text-[#86efac]")}>{kicker}</p>
            <h2 className={cn("h-section mt-5 text-[clamp(38px,5vw,60px)]", night ? "text-white" : "text-cp-ink")}>{title}</h2>
            {lede && (
              <p
                className={cn(
                  "mt-6 max-w-[60ch] text-[16.5px] leading-[1.65] md:text-[17.5px]",
                  night ? "text-white/65" : "text-cp-ink-3",
                  center && "mx-auto"
                )}
              >
                {lede}
              </p>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
        <div className="mt-14 md:mt-16">{children}</div>
      </div>
    </section>
  );
}
