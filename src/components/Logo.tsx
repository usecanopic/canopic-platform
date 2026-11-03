import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Size of the mark, in pixels. */
  size?: number;
  withWordmark?: boolean;
  withImage?: boolean;
  /** "ink" for light surfaces, "paper" for night bands. */
  tone?: "ink" | "paper";
  className?: string;
  href?: string;
}

/** The star on its black tile, followed by the name set in the sans. */
export function Logo({ size = 28, withImage = true, withWordmark = true, tone = "ink", className, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="Canopic home"
      className={cn(
        "group inline-flex items-center gap-2.5",
        tone === "ink" ? "text-cp-ink" : "text-white",
        className
      )}
    >
      {withImage && (
        <Image
          src="/images/logo-mark.png"
          alt=""
          width={size}
          height={size}
          priority
          className="shrink-0 rounded-[7px] object-contain transition-transform duration-300 group-hover:rotate-[30deg]"
        />
      )}
      {withWordmark && <span className="text-[17px] font-semibold leading-none tracking-[-0.03em]">Canopic</span>}
    </Link>
  );
}
