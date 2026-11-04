import { Ban, ChartLine, Code, DoorOpen, Lock, Receipt, ShieldCheck, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "./Section";

const ENTRIES = [
  { title: "Every fill broken down on-chain", icon: Receipt, body: "Each fill event logs the mid, spread, skew and fee, line for line as the quote displayed them.", check: "compare any receipt with its Blockscout entry" },
  { title: "No trade outside the guard", icon: ShieldCheck, body: "This is enforced by a contract invariant rather than a promise, and it covers maker fills and vault fills equally.", check: "run the published invariant tests yourself" },
  { title: "Execution data in the raw", icon: ChartLine, body: "How far every fill landed from the mid, updated live and available to download unprocessed.", check: "derive every statistic from on-chain logs yourself" },
  { title: "Order flow is never sold", icon: Ban, body: "Each trade clears on-chain at the best price the router can prove.", check: "rerun the price comparison on any trade" },
  { title: "Your assets stay yours", icon: Lock, body: "Trades clear in one transaction, and vault inventory belongs to depositors rather than to Canopic.", check: "search the audit reports for any way to move user funds" },
  { title: "Exits that cannot be blocked", icon: DoorOpen, body: "Depositors can leave a vault in every state, including when all pauses are switched on.", check: "find withdrawals made mid-halt on the Ledger" },
  { title: "Setting changes are delayed and public", icon: Timer, body: "Any change to a parameter sits in a timelock queue with its stated reason before it can take effect.", check: "read the governance history back to the first block" },
  { title: "Open code that matches what runs", icon: Code, body: "With each release, CI proves that the deployed bytecode is identical to the audited source.", check: "compile the release tag and compare" },
] as const;

/** Bento rhythm on large screens: three rows of four columns, with four of the cards running double. */
const WIDE = new Set([0, 5, 6, 7]);

export function PromiseGrid() {
  return (
    <Section
      id="guarantees"
      kicker="Guarantees"
      tone="canvas"
      title={
        <>
          Eight promises you can <em className="italic">test</em> yourself
        </>
      }
      lede="Claiming openness costs nothing, so each promise here comes with a way to prove it. Should one of them ever fail its test, we treat that as an incident and publish a full write-up."
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENTRIES.map((e, i) => {
          const Icon = e.icon;
          const wide = WIDE.has(i);
          return (
            <li key={e.title} className={cn("card card-hover flex flex-col overflow-hidden", wide && "lg:col-span-2")}>
              <div className="flex flex-1 flex-col p-6">
                <span className="grid size-9 place-items-center rounded-[10px] bg-cp-accent-soft text-cp-accent-ink">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className={cn("mt-6 text-cp-ink", wide ? "h-section text-[28px]" : "h-card text-[17px]")}>{e.title}</h3>
                <p className={cn("mt-2.5 leading-relaxed text-cp-ink-3", wide ? "max-w-[46ch] text-[15px]" : "text-[14px]")}>
                  {e.body}
                </p>
              </div>
              <p className="flex items-baseline gap-2 border-t border-cp-line bg-cp-canvas px-6 py-3.5 text-[13px] leading-relaxed">
                <span className="shrink-0 font-semibold text-cp-accent-ink">Verify</span>
                <span className="text-cp-ink-2">{e.check}</span>
              </p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
