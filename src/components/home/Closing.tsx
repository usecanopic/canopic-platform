import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";

/** The closing band: the star over the night side of the planet, the last claim, and the way in. */
export function Closing() {
  return (
    <section className="bg-cp-canvas px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="grain relative isolate overflow-hidden rounded-[28px] bg-cp-night">
        {/* The night side of the planet: open sky for the claim, the lit rim arcing in under the buttons */}
        <Image
          src="/images/closing-space.jpg"
          alt=""
          fill
          quality={85}
          sizes="100vw"
          className="-z-10 object-cover object-[50%_100%]"
        />
        <div className="page pb-56 pt-24 sm:pb-64 md:pb-72 md:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <Image src="/images/mark-hero.png" alt="" width={240} height={240} className="mx-auto size-24 object-contain md:size-28" />

            <h2 className="display mt-10 text-[clamp(52px,8vw,104px)] text-white">
              Your first trade is <em className="italic text-[#86efac]">minutes away.</em>
            </h2>
            <p className="mx-auto mt-7 max-w-[52ch] text-[16.5px] leading-[1.65] text-white/65 md:text-[18px]">
              Verify once and you can start trading right away. Depositors earn the spread on their vaults, makers
              quote for free, and each trade clears on Robinhood Chain.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={SITE.appHref}
                className="btn btn-lg bg-white text-cp-ink shadow-[0_8px_28px_-8px_rgb(134_239_172/0.55)] hover:bg-white/90"
              >
                Launch Canopic
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a
                href={SITE.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
              >
                Updates on X
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
