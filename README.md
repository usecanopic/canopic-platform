<p align="center">
  <img src="public/images/logo-mark-dark.png" alt="Canopic" width="96" />
</p>

<h1 align="center">Canopic</h1>

<p align="center">
  A swap venue on Robinhood Chain for tokenized real-world assets, where users keep custody of their funds.<br />
  Both the website at <a href="https://usecanopic.com">usecanopic.com</a> and the trading platform under <code>/platform</code> live in this repository.
</p>

## Stack

- Next.js 16 (App Router, Turbopack), React 19 and TypeScript
- Tailwind CSS 4, with the Canopic design tokens defined in `src/app/globals.css`
- Privy, which handles sign-in and embedded wallets on Robinhood Chain
- Supabase (Postgres), which stores profiles and eligibility attestations, plus the venue read model
- viem, used for chain configuration and on-chain interaction
- lucide-react for icons

## Getting started

You need Node 24 or later (pinned in `.nvmrc`), a Supabase project and a Privy app.

```bash
npm install
cp .env.example .env.local   # then fill in the Privy and Supabase keys
npm run dev                  # http://localhost:3000
```

The Robinhood Chain values in `.env.example` are already filled in. To set up the database, follow [`supabase/README.md`](supabase/README.md): run `schema.sql`, then `seed.sql`. If any platform variable is missing, `/platform` shows a setup screen listing exactly which ones, rather than failing.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | Lint, typecheck and build in one go; run it before shipping |

## The website

The homepage (`src/app/page.tsx`, sections in `src/components/home/`) runs top to bottom as:

- **Hero.** The lit mark over the `public/hero.png` horizon, the headline and calls to action, a sample swap ticket resting on the horizon's floor, four headline figures and a ticker of the listed markets.
- **Pricing.** The quote formula laid out as an equation of cards, resolving to one price on a gauge of the oracle band.
- **Sessions.** A live 24-hour dial of the US equity clock with the current regime lit, the regime table and the conditions that halt quoting.
- **Venue, Compared, Chain, Promises.** The two execution lanes and the router, a comparison with generic pools, a chain datasheet, and the commitments, each with a line on how to verify it.
- **Questions** and a closing call to action above the roadmap.

## The platform

The trading app lives under `/platform`, behind a shell (`src/components/platform/PlatformShell.tsx`) with a grouped sidebar and a top bar that shows where you are, the live session and your account.

| Page | What it shows |
| --- | --- |
| Overview | Headline figures, volume by hour, the session, the markets table (filter by tier; a row opens that market in Swap), TVL by market and the latest fills |
| Swap | The quote ticket with every line itemised, slippage bound and route details. `/platform/swap?market=AAPLx` opens with that market selected |
| Liquidity | Vaults with TVL, inventory against the 50% target, spread share, and what LPs earn and risk |
| Portfolio | Your fills and attestations, with holdings and LP positions once the venue indexer is connected (requires sign-in) |
| Explorer | Execution against mid for every fill, the fills table with side and venue filters, parameters in force and the governance log |
| Settings | Your profile and eligibility attestations (requires sign-in) |

### How the platform works

- **Pricing.** Prices on the swap ticket, the market list and the explorer all come from the OracleVault formula in `src/lib/platform/markets.ts`: a guarded mid, the tier half-spread multiplied by the session multiplier, a signed inventory skew and an itemised fee. The trading regime comes from the live US-equity clock, so spreads widen and clips shrink outside the regular session, just as they do in the venue's contracts.
- **Venue data.** `useVenue()` in `src/components/platform/usePlatformData.ts` reads markets, prices, vault snapshots, fills and the governance log from the Supabase read model. If those tables are empty or unreachable it falls back to the built-in catalogue, and the pages say which source they are showing. Until the venue indexer is connected, mids, inventories and fill history are indicative. Every chart is drawn from these rows; nothing is synthesised.
- **Reads.** Anyone can read public content without an account. Reads of profiles and attestations are scoped to each user.
- **Writes and private reads** (profile, attestations) go to `POST /api/platform/db` together with the user's Privy access token. That route checks the token, validates the arguments against `src/lib/platform/ops.ts`, and then executes the operation through a service-role Supabase client, which passes the verified user id in an `x-canopic-actor` header. The `app_user_id()` database function accepts that header only on requests made with the service role.
- **Settlement.** Swaps are settled on-chain via the SwapRouter, and `contracts/` holds the contracts along with their deployment records.
- **Eligibility.** A role attestation (`TRADER`, `LP`, `MAKER`, `RELAYER`) is needed to trade, to provide liquidity and to make markets. Each one appears in Settings, and the EligibilityRegistry enforces it on-chain.

## Design system

A dark theme lit by a single ice-blue accent beside a monochrome mark. Everything is defined in `src/app/globals.css`.

- **Colour.** Tokens are prefixed `ir-`: `void`, `base`, `surface`, `raised` and `steel` for backgrounds; `fg` to `fg-4` for text; `ice`, `ice-bright` and `ice-deep` as the one accent; `up`, `down` and `warn` only for values and status; `line` and `line-strong` for hairlines. Dark only.
- **Type.** Space Grotesk for headlines (`font-display`), Geist for body copy and figures (`num` gives tabular numerals), Geist Mono only for addresses, hashes and timestamps.
- **Classes.** `card`, `card-lit`, `panel`, `btn` (`btn-primary`, `btn-secondary`, `btn-ghost`), `field`, `tag`, `seg`, `lbl`, `caps`, `eyebrow`, plus atmosphere helpers (`glow`, `grid-lines`, `hairline`, `noise`).
- **Platform components.** `src/components/platform/ui.tsx` holds the building blocks (Sheet, PageHead, StatCard, Table, Segmented, Meter, BarList, BarChart, SplitBar and more). `TokenLogo.tsx` draws the issuer mark for each market, falling back to a two-letter tile for any symbol without one.
- **Gotchas.** Never name a class `overline` (Tailwind's own utility draws a line over the text). Give every CSS grid a `grid-cols-[minmax(0,1fr)]` base, or wide content will push it off-screen on phones.

## Project layout

```
src/app/                 routes: homepage, /platform pages, /api/platform/db, metadata and icons
src/components/home/     homepage sections
src/components/platform/ platform shell, UI kit, data hooks and token logos
src/lib/platform/        pricing math, queries, formatting, chain and env config
public/                  hero artwork, app icons and logo marks
supabase/                schema, seed data and setup guide
contracts/               Solidity contracts (Foundry), deploy scripts and deployment records
docs/                    public documentation (GitBook)
```

## Brand assets

- `public/new-logo.png` is the master logo. The marks in `public/images/` (`logo-mark*.png`, `logo.png`), the app icons, `favicon.ico` and `src/app/opengraph-image.png` are all cut from it.
- `public/hero.png` is the homepage hero background; `public/images/mark-hero.png` is the large star mark, on a transparent background, above the headline.
- Company logos in the platform come from [Simple Icons](https://simpleicons.org) (CC0).

## Related

- Documentation: [`docs/`](docs/README.md)
- Contracts: [`contracts/`](contracts/README.md)
- Follow us on X at [@usecanopic](https://x.com/usecanopic)
