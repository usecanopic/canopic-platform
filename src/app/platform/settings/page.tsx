"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { useSession } from "@/components/platform/PlatformProviders";
import { RequireAuth } from "@/components/platform/PlatformShell";
import { useAsync } from "@/components/platform/usePlatformData";
import { Badge, Button, Field, Input, Notice, PageHead, Sheet, Skeleton } from "@/components/platform/ui";
import { getMyAttestations, upsertProfile } from "@/lib/platform/queries";
import { fmtDate, friendlyError } from "@/lib/platform/format";
import { platformEnv } from "@/lib/platform/env";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div>
      <PageHead code="CP · 06 · Account" title="Your details and access" description="Manage the name you see in the app and check which roles this wallet is cleared for." />
      <div className="mt-6">
        <RequireAuth title="Log in to manage your account">
          <Settings />
        </RequireAuth>
      </div>
    </div>
  );
}

const ROLES = ["TRADER", "LP", "MAKER", "RELAYER"] as const;

const ROLE_HINTS: Record<(typeof ROLES)[number], string> = {
  TRADER: "Buy and sell listed tokens",
  LP: "Supply vaults and own the shares they mint",
  MAKER: "Answer requests with signed quotes",
  RELAYER: "Send trades on behalf of others",
};

const SECTIONS = [
  { id: "profile", label: "Details", icon: UserRound },
  { id: "eligibility", label: "Access", icon: ShieldCheck },
] as const;

const readOnlyField = "cursor-default border-cp-line bg-cp-canvas shadow-none text-cp-ink-3 focus:border-cp-line";

function Settings() {
  const { api, userId, walletAddress, email, profile, refreshProfile } = useSession();
  const attestations = useAsync(() => getMyAttestations(api), [api, userId]);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      await upsertProfile(api, { display_name: displayName || null, wallet_address: walletAddress, email });
      await refreshProfile();
      setMsg("Your details have been updated.");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <nav aria-label="Account sections" className="hidden lg:sticky lg:top-24 lg:block">
        <ul className="space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex h-9 items-center gap-2.5 rounded-[8px] px-3 text-[13.5px] text-cp-ink-3 transition-colors hover:bg-cp-sunk hover:text-cp-ink"
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <div id="profile" className="scroll-mt-24">
          <Sheet
            label="Your details"
            meta={
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5" aria-hidden="true" />
                private to you
              </span>
            }
          >
            <form onSubmit={save}>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2">
                <Field
                  label="Name"
                  hint="Only you can see this. The public Ledger identifies traders by address and never by name."
                  className="sm:col-span-2"
                >
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Leave blank if you like" />
                </Field>
                <Field label="Wallet address">
                  <Input value={walletAddress ?? ""} readOnly className={cn("font-mono text-[13px]", readOnlyField)} />
                </Field>
                <Field label="Email address">
                  <Input value={email ?? ""} readOnly className={readOnlyField} />
                </Field>
                <Field label="Account ID" className="sm:col-span-2">
                  <Input value={userId ?? ""} readOnly className={cn("font-mono text-[12px]", readOnlyField)} />
                </Field>
              </div>
              {(msg || error) && (
                <div className="mt-5 space-y-3">
                  {msg && <Notice>{msg}</Notice>}
                  {error && <Notice tone="error">{error}</Notice>}
                </div>
              )}
              <div className="-mx-5 -mb-5 mt-6 flex items-center justify-end gap-3 border-t border-cp-line bg-cp-canvas px-5 py-3.5">
                <Button type="submit" disabled={saving} className="btn-sm">
                  {saving ? "Updating…" : "Save changes"}
                </Button>
              </div>
            </form>
          </Sheet>
        </div>

        <div id="eligibility" className="scroll-mt-24">
          <Sheet
            label="Access"
            meta={
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                only the role reaches the chain
              </span>
            }
          >
            <p className="mb-5 max-w-[68ch] text-[13.5px] leading-relaxed text-cp-ink-2">
              The roles below come from attestations the KYC provider issues once your identity, sanctions screening
              and residency checks pass. On-chain, the registry keeps three things: the role, a jurisdiction class and the date it lapses.
            </p>
            {attestations.loading && !attestations.data ? (
              <Skeleton rows={4} />
            ) : (
              <ul className="divide-hair overflow-hidden rounded-[12px] border border-cp-line">
                {ROLES.map((role) => {
                  const a = attestations.data?.find(
                    (x) => x.role === role && x.status === "active" && new Date(x.expires_at) > new Date()
                  );
                  return (
                    <li key={role} className="flex items-center justify-between gap-4 px-4 py-3.5">
                      <div className="min-w-0">
                        <div className="font-mono text-[13px] font-medium text-cp-ink">{role}</div>
                        <div className="mt-1 truncate text-[12.5px] text-cp-ink-3">
                          {a ? (
                            <>
                              <span className="font-mono">{a.jurisdiction_class ?? "?"}</span>
                              <span className="text-cp-ink-4"> · </span>class{" "}
                              <span className="font-mono">{a.investor_class ?? "?"}</span>
                              <span className="text-cp-ink-4"> · </span>expires{" "}
                              <span className="font-mono">{fmtDate(a.expires_at)}</span>
                            </>
                          ) : (
                            ROLE_HINTS[role]
                          )}
                        </div>
                      </div>
                      <Badge tone={a ? "up" : "muted"}>{a ? "Valid" : "None yet"}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-5 text-[12px] leading-relaxed text-cp-ink-3">
              The EligibilityRegistry on {platformEnv.chainName} keeps an on-chain copy of every attestation. Leaving a
              vault never depends on one. To begin onboarding, get in touch with the team.
            </p>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
