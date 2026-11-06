import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cp-canvas px-4 py-16">
      <div className="dot-field pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="card-stage relative w-full max-w-xl animate-rise overflow-hidden">
        <div className="card-head">
          <Logo size={26} />
          <span className="tag border-cp-warn/25 bg-cp-warn/[0.07] text-cp-warn">
            <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
            Setup
          </span>
        </div>

        <div className="p-6 md:p-8">
          <p className="kicker">Setup incomplete</p>
          <h1 className="h-section mt-3 text-[32px] text-cp-ink md:text-[36px]">Some settings still need values</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-cp-ink-2">
            The app relies on Privy and Supabase. Put the keys named below into{" "}
            <code className="font-mono text-[13.5px] text-cp-accent-ink">.env.local</code>. After that, load{" "}
            <code className="font-mono text-[13.5px] text-cp-accent-ink">supabase/schema.sql</code> followed by{" "}
            <code className="font-mono text-[13.5px] text-cp-accent-ink">supabase/seed.sql</code>. Finally, boot the dev server once more.
          </p>

          <ul className="mt-6 divide-hair overflow-hidden rounded-[12px] border border-cp-line bg-cp-canvas font-mono text-[13px] text-cp-ink">
            {missing.map((m) => (
              <li key={m} className="flex items-center gap-3 px-4 py-2.5">
                <span className="size-1.5 shrink-0 rounded-full bg-cp-warn" aria-hidden="true" />
                <span className="min-w-0 break-all">{m}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[13.5px] leading-relaxed text-cp-ink-3">
            <code className="font-mono text-cp-ink-2">supabase/README.md</code> walks through every step. You can also{" "}
            <Link href="/" className="link">
              head back to the home page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
