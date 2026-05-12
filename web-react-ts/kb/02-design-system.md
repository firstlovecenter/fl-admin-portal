# Design system — `web-react-ts/`

The design system is **Shadcn/UI + Tailwind CSS**. Bootstrap is being phased
out. New and touched pages must use Shadcn + Tailwind. Legacy pages that have
not been touched yet retain Bootstrap until they are redesigned.

The canonical reference for all design decisions is the `/design` skill at
`.claude/commands/design.md`. Read that before doing any UI work.

---

## Quick reference

### Colour tokens

All colours are CSS custom properties on `:root` / `[data-theme="dark"]` in
`src/index.css`. Tailwind reads them. Never hardcode hex.

| Token | Usage |
| --- | --- |
| `--brand` | FLC red/pink brand (#ff2c5e) |
| `--members` | Members section accent (teal) |
| `--churches` | Churches accent (purple) |
| `--arrivals` | Arrivals accent (indigo) |
| `--defaulters` | Defaulters accent (orange) |
| `--banking` | Banking accent (green) |
| `--campaigns` | Campaigns accent (violet) |
| `--maps` | Maps accent (cyan) |
| `--background` | Page background |
| `--foreground` | Default text |
| `--card` | Card background |
| `--muted` | Muted backgrounds / secondary areas |
| `--muted-foreground` | Secondary labels, captions |
| `--border` | Dividers and input borders |
| `--destructive` | Error / delete state |
| `--success` | Success state |
| `--warning` | Warning state |

Dark mode tokens are defined under `[data-theme="dark"]`.

### Typography

| Style | Tailwind classes | Usage |
| --- | --- | --- |
| Display | `text-3xl font-bold tracking-tight tabular-nums` | Hero numbers, totals |
| H1 | `text-2xl font-bold tracking-tight` | Page title — always `font-bold`, never `font-semibold`. Section name accented with feature token (see "Page heading convention" in `/design` skill). |
| H2 | `text-lg font-semibold` | Card / section title |
| H3 | `text-base font-medium` | Sub-section |
| Body | `text-sm` | Default prose |
| Caption | `text-xs text-muted-foreground` | Timestamps, labels |

Font family: **Inter** (inherited from CSS root, no class needed).

---

## Components to use

Shadcn components live in `src/components/ui/`. Check there before building
anything new.

| Need | Component |
| --- | --- |
| Page wrapper | `components/base-component/PageContainer` (restyle with Tailwind) |
| Card | `ui/card` → `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardFooter>` |
| Stat / metric card | Custom `<StatCard>` — see `/design` skill for the pattern |
| Dialog / modal | `ui/dialog` → `<Dialog>` |
| Bottom sheet (mobile) | `ui/drawer` → `<Drawer>` |
| Tabs | `ui/tabs` |
| Button | `ui/button` — variants: `default`, `outline`, `ghost`, `destructive`, `secondary` |
| Icon button | `<Button variant="ghost" size="icon">` (44×44 px min) |
| Input | `ui/input` + `ui/form` + `ui/label` |
| Select | `ui/select` |
| Combobox / search | `ui/combobox` |
| Checkbox | `ui/checkbox` |
| Radio group | `ui/radio-group` |
| Switch | `ui/switch` |
| Badge | `ui/badge` |
| Alert | `ui/alert` |
| Skeleton | `ui/skeleton` (loading state; prefer over spinner for data) |
| Progress | `ui/progress` |
| Avatar | `ui/avatar` |
| Table | `ui/table` |
| Separator | `ui/separator` |
| Scroll area | `ui/scroll-area` |
| Dropdown menu | `ui/dropdown-menu` |
| Breadcrumb | `ui/breadcrumb` |
| Toast / snackbar | Keep `notistack` — do not replace |
| Charts | Keep `recharts` (`components/ChurchGraph`, `components/pie-chart`) |

### Icons

Use **`lucide-react`** for all new icons. Keep `react-bootstrap-icons` /
`react-icons` only where Lucide lacks an equivalent.

Icon sizes: `h-5 w-5` (nav/stat), `h-4 w-4` (inline), `h-6 w-6` (FAB).

---

## Formik wrappers

The existing wrappers in `components/formik/` retain their Formik API.
When migrating a form, swap only the **inner rendered element** from a
Bootstrap input to a Shadcn `<Input>` / `<Select>` / etc. The consuming page
sees no change.

---

## Trend / graph pages

There are two complementary chart components in this codebase. Use the right
one for the job; do not mix them.

| Component | Use for | Notes |
| --- | --- | --- |
| **`components/ChurchGraph`** | Per-church-level **graph pages** in `pages/services/graphs/` (BacentaGraphs, FellowshipGraphs, CouncilGraphs, StreamGraphs, CampusGraphs, OversightGraphs, GovernorshipGraphs, MinistryGraphs, DenominationGraphs). Drives the `/{level}/graphs` routes. | The canonical chart for graph pages. Drives all per-level views off a single `graphType` prop. **This is the upgrade target — keep using it.** |
| **`pages/dashboards/TrendSpark`** | The **UserDashboard** spark / trend chart only. | Dashboard-specific (own data window, own drill-down semantics). Do not import on graph pages — keep the chart implementations separate so each can evolve independently. |

`ChurchGraph` was modernized in 2026-Q2 to match the dashboard's visual
language (token colours, dashed gridlines, rounded bar caps, themed tooltip,
compact-number labels). The legacy `ChurchGraph.css` chart variables
(`--chart-primary-color`, etc.) are deprecated — the component now reads
design tokens directly via `hsl(var(--token))`.

### `ChurchGraph` visual contract — keep these in lock-step with `TrendSpark`

| Concern | Pattern |
| --- | --- |
| Bar fills (primary) | Mapped from `graphType` to a token: bussing → `hsl(var(--destructive))`, services → `hsl(var(--arrivals))`, rehearsals/onStage → `hsl(var(--churches))` / `hsl(var(--campaigns))` |
| Bar fills (income, secondary) | `hsl(var(--success))` |
| Bar caps | `radius={[6, 6, 0, 0]}`, `maxBarSize={48}` |
| Grid | `<CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 6" vertical={false} opacity={0.55} />` |
| Axes | `tickLine={false}`, `axisLine={false}`, X tick `fontSize={11}`, week label `W{n}`, Y `hide` |
| Labels | `<LabelList content={renderBarLabel} />` with `Intl.NumberFormat('en', { notation: 'compact' })` (`1234` → `1.2K`); skip non-positive values |
| Tooltip | Custom: `rounded-xl border border-border bg-card shadow-lg`; rows use `size-2 rounded-full` swatches; tabular-nums values; bussing meta (urvans / sprinters / cars) shown in muted text below the rows |
| Cursor | `{ fill: 'hsl(var(--accent) / 0.24)' }` — never the default grey |
| Empty state | Surface "No service data" via the page; the chart itself just renders nothing meaningful |
| Loading | Single `<Skeleton>` filling the chart area — no inline `ScaleLoader` |
| Title | `text-sm font-medium text-foreground` rendered above the chart by the chart itself |

If `TrendSpark` ever evolves a new visual treatment (a new tooltip style,
animation, etc.), port it into `ChurchGraph` in the same PR so the two stay
visually aligned.

### Container pattern (graph pages)

Wrap `ChurchGraph` in a Shadcn `<Card>` so the chart sits inside the page's
design rhythm. Keep the page's own header / stat cards / filter controls
**outside** the chart card:

```tsx
<Card>
  <CardContent className="px-3 pb-2 pt-4 sm:px-5 sm:pt-5">
    <ChurchGraph
      stat1="attendance"
      stat2={showIncome ? 'income' : null}
      churchData={churchData || []}
      church="bacenta"
      graphType={graphs}
      income={!currentUser.noIncomeTracking}
    />
  </CardContent>
  {/* Page-level pagination footer goes here as a sibling div with border-t */}
</Card>
```

**Pagination is client-side, over a fetched 24-week window.** Fetch the
graph query once with `limit: 24, skip: 0` (no refetching on Older / Newer),
keep a `windowEnd` state on the page, and slice `[windowEnd-4, windowEnd]`
of the active dataset for the chart. The footer row has chevron + label +
chevron buttons that just `setWindowEnd(...)` — no Apollo refetch.

**Why client-side, not server-side `skip`:**

- Older/Newer must **not** invalidate the page's stable data — membership,
  leader avatar, and the three header averages are part of the same query
  and refetching them on every paginate causes them to flash and refetch.
- 24 weeks is a small payload; the savings from server-side pagination are
  not worth the UX regression.
- The averages must remain **fixed** across paginations: they should always
  reflect the most-recent four weeks of *the full fetched dataset*, not the
  weeks currently visible on the chart. Compute them once with
  `getMonthlyStatAverage(fullDataset, ...)` and never re-derive on window
  change.

### Header stats — always show all relevant averages

On a per-level graph page, the stat-card row sits **above** the
chart-type Tabs and is therefore not scoped to the active tab. Show every
average the page can compute, regardless of which graph is selected:

| Stat | Source dataset | Behaviour |
| --- | --- | --- |
| Membership | `bacenta.memberCount` | Static — never change with pagination or tab |
| Avg Weekly Bussing | `recentBussingData` (with stale-bussing filter) | Always shown; active-tab pagination updates it (see below) |
| Avg Weekly Attendance | `weekdayData` (services) | Always shown; active-tab pagination updates it |
| Avg Weekly Income | `weekdayData` (services) | Show "Not tracked" if `currentUser.noIncomeTracking`; never hide the card |

**Averages track the visible chart window.** When the chart paginates
(Older / Newer), the average tied to the active tab's dataset must
re-compute from the visible window:

- Bussing tab active → `Avg Weekly Bussing` reflects the visible 4-week
  bussing slice; `Avg Weekly Attendance` and `Avg Weekly Income` reflect the
  latest-4 of the full weekday dataset.
- Services tab active → `Avg Weekly Attendance` and `Avg Weekly Income`
  reflect the visible 4-week services slice; `Avg Weekly Bussing` reflects
  the latest-4 of the full bussing dataset.

`getMonthlyStatAverage(slice, key)` already takes the latest 4 of whatever
you pass it, so passing the windowed slice averages those weeks; passing the
full 24-week dataset averages the latest 4. **Membership is the only stat
that is genuinely static — never re-derive it from the window.**

### Compact-on-mobile stat tiles for graph pages

Use `<StatCard compact />` for the four-card stat row on graph pages.

The `compact` prop is **mobile-only**: at `< md` (768 px) the card renders as
a tight horizontal icon-on-left tile (`p-3`, `text-xl` value, ~60-70 px tall);
at `md+` it expands back to the full hero layout (`p-5 sm:p-6`, `text-3xl`
value). The component renders both layouts and toggles them via Tailwind's
`md:hidden` / `hidden md:block` — there is no breakpoint detection in JS.

Use this whenever you have ≥ 3 stat cards in a single row that would
otherwise eat half the mobile viewport before the user reaches actionable
content. **Don't** use compact for hero stats (single big number on a
dashboard) — those keep the default hero layout always. Same `accent`,
`loading`, `hint`, and `delta` props.

### Number formatting

```ts
const formatNumber = (value: string | undefined) =>
  value && value !== 'NaN'
    ? Number(value).toLocaleString('en-GH', { maximumFractionDigits: 0 })
    : '—'

const formatCurrency = (amount: number, currencyCode?: unknown) => {
  const currency =
    (typeof currencyCode === 'string' && currencyCode.trim().toUpperCase()) ||
    'GHS'
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(amount)
  }
}
```

`tabular-nums` on every numeric stat so digits don't reflow.

### Stale-bussing filter

`Bacenta.bussing` SDL has no recency cap — dormant Bacentas leak years-old
records into averages. When you compute or chart bussing data anywhere,
drop records older than `currentYear - 1`:

```ts
const recentBussing = bussingData.filter((r) => {
  if (typeof r?.year === 'number' && Number.isFinite(r.year))
    return r.year >= currentYear - 1
  if (r?.date) {
    const y = new Date(r.date).getFullYear()
    if (Number.isFinite(y)) return y >= currentYear - 1
  }
  return false
})
```

### What NOT to do

- ❌ Replace `<ChurchGraph>` with `<TrendSpark>` on graph pages. They are not
  interchangeable; `TrendSpark` is dashboard-internal.
- ❌ Hard-code chart colours. Always `hsl(var(--token))`. The legacy
  `--chart-*-color` CSS variables in `ChurchGraph.css` are deprecated — do
  not introduce new consumers.
- ❌ Re-introduce the old `chart-title font-weight-bold` / `church-name`
  Bootstrap classes inside the chart. Use the design-token typography above.
- ❌ Drop the bussing recency filter. Stale Bacentas inflate "no bussing"
  pages with irrelevant 2020 records.

---

## Reserved mobile corners — MANDATORY

On mobile (`< md`), `AppShell` floats two absolute-positioned controls
above every page: the sidebar / `MobileNav` toggle at `right-3 top-3`
(size-11) and the PWA `BackButton` at `left-3 top-3` (size-11). Both are
44 × 44 px buttons in a `z-20` layer the page cannot override.

Page-level header actions (Settings dropdown, Edit button, More menu,
kebab) placed in the top-right of the page header MUST offset on mobile
so they don't collide with the floating sidebar toggle. Three accepted
fixes:

1. `pr-14 md:pr-0` on the page-header flex row — simplest; pushes the
   right-aligned action 56 px left on mobile.
2. `flex flex-col gap-3 md:flex-row md:items-start md:justify-between`
   on the header — stacks the action below the title on mobile.
3. `max-md:hidden` on the action and surface the same options inside the
   page body — for large action sets.

Top-left actions follow the same rule against the BackButton. Desktop
(`md+`) is unaffected — both shell toggles are `md:hidden`.

The full rule and rationale live in `/design`
(`.claude/commands/design.md` → "Reserved mobile corners").

---

## Summary-on-top rule — MANDATORY (for new/touched pages)

On any **new or touched** 2-column page (`[1fr_320px]` / `[1fr_360px]`
with a supporting `<aside>`), the **supporting column comes first in DOM**.
On mobile the grid collapses in source order, so summary/totals/CTA must
land above primary content — never below it. On desktop,
`lg:col-start-2 lg:row-start-1` on the supporting column and
`lg:col-start-1 lg:row-start-1` on the primary column places them
side-by-side as expected.

Legacy pages using "primary first, aside second" are grandfathered until
next touched — same migration policy as Bootstrap.

A right-side aside that is second in DOM forces mobile users to scroll past
the entire list to reach the summary number they came for. Reversing the
source order with explicit grid placement fixes both mobile order and
desktop layout in one shape.

The full rule, examples, and rationale live in `/design`
(`.claude/commands/design.md` → "Summary placement rule").

---

## Migration rules

Bootstrap is **fully deprecated**. Every file you touch must be fully migrated
to Shadcn + Tailwind in the same PR — no exceptions, no partial migrations.

- **New pages**: Shadcn + Tailwind always. Never write Bootstrap.
- **Touched pages**: migrate fully in the same PR when you change any code.
- **Never mix** Bootstrap and Tailwind in the same file.

Run `/design` whenever you are starting any UI work. It contains the full
colour system, layout patterns, component catalogue, and migration checklist.

---

## What not to add

- Any CSS framework other than Tailwind (no Chakra, MUI, styled-components).
- A new icon library — use `lucide-react`.
- A new modal library — use `ui/dialog` or `ui/drawer`.
- A new toast library — keep `notistack`.
- `@apply` in CSS files — write utilities in JSX.
- Hardcoded hex values — always use design tokens.
