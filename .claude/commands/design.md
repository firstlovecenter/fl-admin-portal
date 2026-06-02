---
description: Redesign a page or component using the Shadcn/UI + Tailwind CSS design system. Use for all new UI work and when migrating existing Bootstrap pages to the new design.
---

You are running `/design` on the FL Admin Portal. This skill governs every UI
decision in the codebase. It replaces Bootstrap 5 + react-bootstrap with
**Shadcn/UI + Tailwind CSS** as the design system.

Read this file **completely** before touching any UI. It is the north star.

---

## Design philosophy

The FL Admin Portal is a **mobile-first PWA** used by church leaders and
pastors in Ghana. The design is inspired by two aesthetics:

1. **Command dashboard** — dark, data-dense, sidebar navigation. For
   desktop / tablet administrative views.
2. **Mobile fintech** — light backgrounds, bold typography, card-based
   layouts, bottom navigation, clear CTAs. For the primary mobile PWA
   surface.

The goal is a UI that feels **native to both**: light mode on mobile
(primary), dark mode available, desktop sidebar for power users. Clean,
confident, and fast — not flashy.

---

## Colour system

### Design tokens (defined in `src/index.css` via CSS variables)

All colours are expressed as CSS custom properties on `:root` and `[data-theme="dark"]`. Tailwind reads them through `var(--...)` in `tailwind.config.ts`. **Never hardcode a hex value** — always use a token.

```css
/* Brand */
--brand:           oklch(55% 0.25 10);   /* #ff2c5e — the FLC red/pink */
--brand-foreground: oklch(98% 0 0);

/* Feature accents — map from legacy CSS vars */
--members:    oklch(82% 0.14 185);   /* #68e0d7 teal  */
--churches:   oklch(75% 0.18 265);   /* purple        */
--arrivals:   oklch(75% 0.15 250);   /* indigo        */
--defaulters: oklch(72% 0.20 30);    /* orange        */
--banking:    oklch(72% 0.18 145);   /* green         */
--campaigns:  oklch(72% 0.22 290);   /* violet        */
--maps:       oklch(72% 0.18 220);   /* cyan          */

/* Neutral scale (Shadcn default) */
--background:   oklch(100% 0 0);
--foreground:   oklch(9% 0 0);
--card:         oklch(100% 0 0);
--card-foreground: oklch(9% 0 0);
--muted:        oklch(96% 0 0);
--muted-foreground: oklch(45% 0 0);
--border:       oklch(90% 0 0);
--input:        oklch(90% 0 0);
--ring:         oklch(55% 0.25 10);  /* matches --brand */

/* State colours */
--destructive:  oklch(60% 0.22 25);
--success:      oklch(55% 0.18 145);
--warning:      oklch(75% 0.18 85);
```

Dark mode mirrors every token under `[data-theme="dark"]` with appropriate
dark values. The existing `data-bs-theme` attribute should be migrated to
`data-theme` and keep supporting both during transition.

### Tailwind config `tailwind.config.ts`

```ts
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:      'oklch(from var(--brand) l c h)',
        members:    'var(--members)',
        churches:   'var(--churches)',
        arrivals:   'var(--arrivals)',
        defaulters: 'var(--defaulters)',
        banking:    'var(--banking)',
        campaigns:  'var(--campaigns)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card:       { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        muted:      { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        border:     'var(--border)',
        input:      'var(--input)',
        ring:       'var(--ring)',
        destructive: 'var(--destructive)',
        success:    'var(--success)',
        warning:    'var(--warning)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',   /* cards */
        xl: '1rem',      /* modal, bottom sheet */
        '2xl': '1.5rem', /* hero cards */
        full: '9999px',  /* pills, avatars */
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

---

## Typography scale

| Token | Tailwind class | Usage |
| --- | --- | --- |
| Display | `text-3xl font-bold tracking-tight` | Page hero numbers (offering total, member count) |
| Heading 1 | `text-2xl font-bold tracking-tight` | Page title — **always `font-bold`, never `font-semibold`** |
| Heading 2 | `text-lg font-semibold` | Section / card title |
| Heading 3 | `text-base font-medium` | Sub-section label |
| Body | `text-sm` | Default body copy |
| Caption | `text-xs text-muted-foreground` | Timestamps, secondary labels |
| Monospace | `font-mono text-sm` | IDs, phone numbers, amounts |

Numbers that represent money or counts get `tabular-nums` (`font-variant-numeric: tabular-nums`) via the Tailwind class `tabular-nums`.

### Page heading convention — MANDATORY

Every redesigned page **must** use this `<h1>` pattern:

```tsx
<h1 className="text-2xl font-bold tracking-tight text-foreground">
  {contextName}{' '}
  <span className="text-[feature-accent]">Section Name</span>
</h1>
```

- **`contextName`** — the church name, entity name, or omit when the section name is the full heading (e.g. Reports, Arrivals hub).
- **`Section Name`** — the domain label that matches the sidebar accent for that section.
- **Always `font-bold`** — never `font-semibold` on an `<h1>`.
- On responsive pages add `lg:text-3xl` for the desktop breakpoint.

**Section → accent class mapping** (from `navigation-config.tsx`):

| Section | Accent class |
| --- | --- |
| Arrivals | `text-arrivals` |
| Services / Trends / Graphs | `text-churches` |
| Banking / Reports | `text-banking` |
| Members / Directory | `text-members` |

**Examples:**

```tsx
// Arrivals page
<h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
  {bacenta?.name} <span className="text-arrivals">Arrivals</span>
</h1>

// Services page
<h1 className="text-2xl font-bold tracking-tight text-foreground">
  {church?.name} <span className="text-churches">Services</span>
</h1>

// Banking page
<h1 className="text-2xl font-bold tracking-tight text-foreground">
  {church?.name} <span className="text-banking">Banking</span>
</h1>

// Section hub (no church name context)
<h1 className="text-2xl font-bold tracking-tight text-foreground">
  <span className="text-arrivals">Arrivals</span>
</h1>
```

When a skeleton is needed during loading, wrap the entire `<h1>` content in the loading check — do not show partial text while loading.

---

## Spacing & layout rhythm

- Base unit: 4 px (Tailwind default).
- Page padding: `px-4 py-5` on mobile, `px-6 py-6` on desktop.
- Card gap: `gap-4` in grid, `gap-3` in lists.
- Section spacing: `space-y-6` between top-level sections on a page.
- Inner card padding: `p-4` (mobile), `p-5` (desktop: `sm:p-5`).

---

## Component library

### Source of truth

All Shadcn components live in `web-react-ts/src/components/ui/`. They are
**generated once** via the Shadcn CLI (`npx shadcn@latest add <component>`)
and then owned by this repo — not treated as an external dependency.

Never re-implement a component that Shadcn already provides. Check
`src/components/ui/` first.

### Component catalogue and usage

#### Structural

| Need | Shadcn component | Notes |
| --- | --- | --- |
| Page wrapper | `src/components/base-component/PageContainer` (keep, restyle) | Inject `className` for Tailwind overrides |
| Card container | `<Card>` from `ui/card` | Use `<CardHeader>`, `<CardContent>`, `<CardFooter>` sub-components |
| Stat card | `<StatCard>` (custom — see pattern below) | Wraps `<Card>` + feature accent icon |
| Dialog / modal | `<Dialog>` from `ui/dialog` | Replaces react-bootstrap `<Modal>` |
| Bottom sheet | `<Drawer>` from `ui/drawer` | For mobile action sheets; NOT available in Bootstrap |
| Tabs | `<Tabs>` from `ui/tabs` | Replaces react-bootstrap `<Tabs>` |
| Accordion | `<Accordion>` from `ui/accordion` | |
| Separator | `<Separator>` from `ui/separator` | |
| Scroll area | `<ScrollArea>` from `ui/scroll-area` | |

#### Navigation

| Surface | Pattern |
| --- | --- |
| Desktop sidebar | Custom `<AppSidebar>` with `<SidebarNav>` items — icon + label, active accent bg |
| Mobile bottom bar | Custom `<BottomNav>` — 4-5 icon + label items, active item gets brand colour |
| Breadcrumb | `<Breadcrumb>` from `ui/breadcrumb` |

The app currently has no persistent sidebar. When redesigning a desktop
layout, add `<AppSidebar>` as a parallel layout component, not a replacement
for mobile navigation.

#### Forms

| Need | Shadcn component | Migration from |
| --- | --- | --- |
| Text input | `<Input>` from `ui/input` + `<FormField>` | `components/formik/Input` → wrap in FormField |
| Select | `<Select>` from `ui/select` | `components/formik/Select` |
| Combobox / search | `<Combobox>` from `ui/combobox` | `components/formik/Combobox` |
| Checkbox | `<Checkbox>` from `ui/checkbox` | |
| Radio | `<RadioGroup>` from `ui/radio-group` | |
| Switch | `<Switch>` from `ui/switch` | |
| Date picker | `<Calendar>` + `<Popover>` | |
| Textarea | `<Textarea>` from `ui/textarea` | |
| File / image upload | Keep existing Cloudinary wrappers; restyle the trigger | |
| Form label | `<Label>` from `ui/label` | |
| Form message | `<FormMessage>` from `ui/form` | replaces `<ErrorText>` |

Formik integration: wrap Shadcn inputs inside the existing `components/formik/*`
wrappers by replacing the inner rendered element. Keep the Formik `Field` /
`useField` logic untouched; only swap the rendered primitive.

#### Feedback & status

| Need | Shadcn component | Notes |
| --- | --- | --- |
| Toast / snackbar | Keep `notistack` | It is wired into Apollo error link; do not replace |
| Alert banner | `<Alert>` from `ui/alert` | |
| Badge | `<Badge>` from `ui/badge` | Replaces Bootstrap badge |
| Progress | `<Progress>` from `ui/progress` | |
| Skeleton | `<Skeleton>` from `ui/skeleton` | Replaces spinner for data loading |
| Spinner | `<Loader2 className="animate-spin" />` from `lucide-react` | Inline spinner |

#### Actions

| Need | Shadcn component | Notes |
| --- | --- | --- |
| Primary action | `<Button variant="default">` | brand-coloured fill |
| Secondary action | `<Button variant="outline">` | |
| Destructive action | `<Button variant="destructive">` | |
| Ghost / text | `<Button variant="ghost">` | |
| Icon button | `<Button variant="ghost" size="icon">` | 44×44 px minimum (PWA rule) |
| Floating action | Custom `<Fab>` wrapping `<Button>` | For primary mobile CTA |
| Dropdown menu | `<DropdownMenu>` from `ui/dropdown-menu` | Replaces react-bootstrap `<Dropdown>` |

##### Button width rule — MANDATORY

**Never ship a full-width button on desktop.** Full-width buttons are a
mobile pattern: they enlarge the tap target on a narrow viewport. On `sm+`
the button must shrink to its intrinsic width and align to the natural
edge of its container — usually centred for a single primary CTA in a
card, right-aligned for a form action row, or inline within a toolbar.

A button stretched edge-to-edge across a wide desktop card looks like an
unfinished landing page; the user has flagged this explicitly. Use this
shape for any primary CTA that needs to be full-width on mobile:

```tsx
{/* Full-width on mobile (≤640 px), centred + intrinsic on sm+ */}
<div className="flex justify-center">
  <Button className="h-12 w-full gap-2 px-8 text-base font-semibold sm:w-auto sm:min-w-64">
    <Icon className="size-5" />
    Action label
  </Button>
</div>
```

Variants:
- **Form action row** (Save / Cancel): `flex flex-col gap-3 sm:flex-row sm:justify-end`. Each button: `w-full sm:w-auto`.
- **Toolbar / inline action**: never `w-full` — let the button size to its content.
- **Skeleton placeholder for the same button**: match the resolved width — `mx-auto h-12 w-full rounded-md sm:w-64`. A skeleton that's `w-full` on desktop telegraphs the wrong layout.

Touch targets still apply: `min-h-11` (44 px) on the button regardless of
breakpoint. The shrink to intrinsic width should never reduce height.

#### Data display

| Need | Component | Notes |
| --- | --- | --- |
| Table | `<Table>` from `ui/table` | Responsive; add horizontal scroll wrapper on mobile |
| Avatar | `<Avatar>` from `ui/avatar` | Replaces `<UserProfileIcon>` and `<LeaderAvatar>` |
| Trend chart (services / bussing / income) | **`pages/dashboards/TrendSpark`** — see "Trend / graph pages" section below. **Never use `<ChurchGraph>` on a redesigned page** — it is legacy. |
| Pie chart | Keep `<PieChart>` | Restyle container |
| Timeline | Restyle existing `<Timeline>` | Keep logic; swap class names |

---

## Layout patterns

### Stat card (standard dashboard card)

```tsx
// components/ui/stat-card.tsx
type StatCardProps = {
  title: string
  value: string | number
  delta?: string        // e.g. "+9.97%"
  deltaUp?: boolean
  icon: React.ReactNode
  accent: string        // Tailwind bg class, e.g. "bg-members/10"
  iconAccent: string    // Tailwind text class, e.g. "text-members"
  updatedAt?: string
}

// Usage:
<StatCard
  title="Total Attendance"
  value="5,680"
  delta="+9.97%"
  deltaUp
  icon={<Users className="h-5 w-5" />}
  accent="bg-members/10"
  iconAccent="text-members"
  updatedAt="Last Sunday"
/>
```

Rendered structure:
```
┌──────────────────────────────────────┐
│  ○ icon   Title              value   │
│  (accent bg)                         │
│  Updated: ...        ↑ +delta%       │
└──────────────────────────────────────┘
```

### Button width rule — MANDATORY

**Never ship a `w-full` button on `sm+`.** Full-width buttons are a mobile
pattern — on a desktop card 800–1200 px wide they look like an unfinished
landing page. Every primary CTA must shrink to its intrinsic width on `sm`
and up, and align to the natural edge of its container (centred for a
single CTA in a card, right for a form action row, inline for a toolbar).

Canonical shape (full-width on mobile, centred + intrinsic on `sm+`):

```tsx
<div className="flex justify-center">
  <Button className="h-11 w-full gap-2 px-8 font-semibold sm:w-auto sm:min-w-64">
    <Icon className="size-4" />
    Action label
  </Button>
</div>
```

Adjust `sm:min-w-64` (256 px) up or down depending on label length — never
set the button itself to `w-full` without the `sm:w-auto` companion. The
loading skeleton that stands in for the button must match: `mx-auto h-11
w-full sm:w-64`. A `w-full` skeleton on desktop telegraphs the wrong
layout. The full Actions section (variants for form action rows,
toolbars, FAB) is in the Component library further down.

This rule is not negotiable — repeated violations have shipped to prod.

### Reserved mobile corners — MANDATORY

On mobile (`< md`), the `AppShell` (`components/shell/AppShell.tsx`) renders
**two floating absolute-positioned controls** that sit on top of every
page:

| Position | Component | Class |
| --- | --- | --- |
| `right-3 top-3` (size-11, 44 × 44 px) | Sidebar / `MobileNav` toggle (`PanelLeftOpen` / `PanelLeftClose`) | `absolute right-3 top-3 z-20 ... md:hidden` |
| `left-3 top-3` (size-11, 44 × 44 px) | `BackButton` (PWA-standalone only) | `absolute left-3 top-3 z-20 md:hidden` |

These are owned by the app shell. **Pages must not place their own
controls in the same 56 × 56 px corner zones on mobile** — the icons
visually compete with the shell and one will end up tapping through to
the other.

**Rule.** Any page-level top-right header action (Settings dropdown, Edit
button, More menu, kebab, etc.) MUST clear the shell toggle on mobile via
one of:

1. **Reserve right padding on the header flex row** —
   `pr-14 md:pr-0` on the heading container. The header's right-aligned
   action sits 56 px left of the page edge on mobile, flush right on
   `md+`. This is the simplest fix and preserves the heading layout.
2. **Stack the header vertically on mobile** —
   `flex flex-col gap-3 md:flex-row md:items-start md:justify-between`.
   The action moves below the title block on mobile, alongside on
   desktop. Use this when the action is text + icon (not a bare icon
   button) so it reads naturally as a row.
3. **Hide the action on mobile and surface it inside the page body** —
   `max-md:hidden` on the button, and add a tappable card / list item
   somewhere on the page (Settings section, action shelf) that exposes
   the same affordances. Use when the action set is large and a small
   icon button on the heading row is the wrong density on mobile anyway.

Top-left action zones (`< md`) have the same rule against the BackButton
— mirror the choice.

Desktop (`md+`) is unaffected: both shell toggles are `md:hidden`, so the
page owns its top corners and can place actions inline freely.

### Summary placement rule — MANDATORY

**On mobile, the summary/supporting column MUST appear above the primary
content — never below it.** On desktop the 2-column layout is unchanged
(supporting column on the right is the default). This rule is about visual
order on narrow viewports, not column placement on wide ones.

The default `flex flex-col lg:grid` pattern follows source order, so a
right-side `<aside>` falls *below* the primary `<section>` when the grid
collapses on mobile. That puts the summary number — the thing the user
opened the page to see — below the fold. Invert it.

Canonical pattern — supporting `<aside>` first in DOM, placed in the right
column on `lg+` via `lg:col-start-2`:

```tsx
<div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start">
  {/* Supporting column — first in DOM so it sits on top on mobile.
      On lg+ grid placement pushes it to column 2 (right side). */}
  <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
    {/* Summary cards, totals, CTA buttons, filters */}
  </aside>

  {/* Primary column — second in DOM, but placed in column 1 on lg+. */}
  <section className="space-y-4 lg:col-start-1 lg:row-start-1">
    {/* Primary list / form / data */}
  </section>
</div>
```

`lg:row-start-1` on both keeps them aligned on the same row on desktop;
`lg:col-start-N` overrides the natural source-order column flow.

**Why source order matters:** screen readers and tab order follow DOM, and
on mobile the grid collapses to a single column in DOM order. The right
column always being source-second means the user always has to scroll past
the primary content to find the summary on mobile — exactly backwards from
their intent.

**Where this applies:** every **new or touched** page that uses the
`[1fr_320px]` or `[1fr_360px]` 2-column layout with a sidebar `<aside>`.
Legacy pages still using "primary first, aside second" are grandfathered
until next touched — same migration policy as Bootstrap. Touch a page,
migrate it fully in the same PR. The 3-column entity-detail layout is
unaffected — its identity panel is already on the left.

### Desktop layout rule — MANDATORY

**Every page MUST use at least a 2-column layout on `lg` screens.** A single
full-width column is only acceptable on mobile. On desktop (`lg+`), split the
content into a primary column and a secondary/supporting column at minimum.

| Page type | Desktop grid | Mobile |
| --- | --- | --- |
| Entity detail (member, church, leader) | 3-column: `lg:grid-cols-[280px_1fr_280px]` | Single column (see profile layout below) |
| Detail / summary page (service, bussing, record) | 2-column: `lg:grid-cols-[1fr_360px]` — main content left, summary/actions right | Single column |
| Form page | 2-column: `lg:grid-cols-[1fr_320px]` — form left, help/context right | Single column |
| List / directory page | 2-column: `lg:grid-cols-[1fr_280px]` — list left, filters/actions right | Single column |
| Dashboard | Stat grid `grid-cols-2 lg:grid-cols-4` + chart, then optional sidebar | 2-col stat grid |

For a 2-column layout, the canonical split is — **supporting column first
in DOM** so it lands above the primary content when the grid collapses on
mobile (see "Summary placement rule" above):

```tsx
{/* 2-column on lg+, stacked on mobile (supporting → primary) */}
<div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
  {/* Supporting column — first in DOM, placed in column 2 on lg+ */}
  <div className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-[73px]">
    {/* Supporting cards — totals, quick actions, links */}
  </div>

  {/* Primary column — second in DOM, placed in column 1 on lg+ */}
  <div className="space-y-4 lg:col-start-1 lg:row-start-1">
    {/* Main content — stats, data, form */}
  </div>
</div>
```

Adjust column widths to fit the content — `360px` is a guide, not a hard rule.
`280px` for narrower supporting columns; `400px` for wider ones.

### Page layout (mobile-first)

```tsx
// Default page: full-width, safe-area aware
<div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
  <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
    <BackButton />
    <h1 className="text-lg font-semibold text-foreground">Page Title</h1>
  </header>

  {/* max-w-6xl on desktop to give the 2-column grid room */}
  <main className="max-w-6xl mx-auto px-4 lg:px-6 py-5 space-y-6">

    {/* 2-column grid on lg+, single column on mobile — MANDATORY.
        Supporting column first in DOM so it sits above primary on mobile. */}
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-4 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-[73px]">
        {/* Summary / supporting cards */}
      </div>
      <div className="space-y-4 lg:col-start-1 lg:row-start-1">
        {/* Primary content */}
      </div>
    </div>

  </main>
</div>
```

### Profile / detail page layout (3-column on desktop)

**Mandatory for all entity detail pages** (member, church, leader, etc.) on `lg`
screens. Mobile remains a single stacked column.

The three columns are:

| Column | Width | Contents |
| --- | --- | --- |
| Left (identity) | `280px` | Avatar, name, primary badges, key action button (save contact, etc.), role/stat summary |
| Center (main data) | `1fr` | The primary data card — form fields, bio info, stats |
| Right (supporting) | `280px` | Contextual cards — alerts/notes, contact links, membership, quick navigation |

Full-width section below the grid: history, timeline, related lists.

```tsx
{/* ── Top action bar — full width, sticky ── */}
<div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
  <div className="max-w-6xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
    <EditButton ... />
    <SecondaryActionButton ... />
  </div>
</div>

{/* ── Page body ── */}
<div className="max-w-6xl mx-auto px-4 lg:px-6 py-5 lg:py-8">

  {/* 3-column grid on lg+, single column on mobile */}
  <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[280px_1fr_280px] lg:items-start">

    {/* LEFT — identity panel, sticky */}
    <aside className="lg:sticky lg:top-[73px] flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
      <Avatar className="h-32 w-32 ring-2 ring-border ring-offset-2 ring-offset-card">
        ...
      </Avatar>
      <div className="text-center space-y-1 w-full">
        <h2 className="text-lg font-semibold text-foreground">{name}</h2>
        <Badge variant="outline">{subtitle}</Badge>
      </div>
      <Button variant="outline" className="w-full gap-2">
        <SaveIcon className="h-4 w-4" /> Save Contact
      </Button>
      <Separator className="w-full" />
      {/* Role list / stats / quick links */}
    </aside>

    {/* CENTER — primary data */}
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 lg:px-5 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Section Title
          </h3>
        </div>
        <div className="px-4 lg:px-5">
          {/* field rows */}
        </div>
      </div>
    </div>

    {/* RIGHT — supporting cards */}
    <div className="space-y-4">
      {/* Alert / sticky note */}
      {hasStickyNote && (
        <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
          ...
        </div>
      )}

      {/* Contact links — use divide-y, not gap, for rows */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contact
          </h3>
        </div>
        <div className="divide-y divide-border">
          <a href="tel:..." className="flex items-center gap-3 p-4 hover:bg-muted/50 active:bg-muted transition-colors">
            <div className="h-9 w-9 rounded-full bg-arrivals/10 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-arrivals" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-mono font-medium truncate">+233...</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </a>
        </div>
      </div>

      {/* Membership / affiliation */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        ...
      </div>
    </div>

  </div>

  {/* ── Full-width below: history / timeline ── */}
  <div className="mt-8">
    <Separator className="mb-6" />
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        History
      </h3>
      <ViewAll to="..." />
    </div>
    <Timeline record={history} limit={3} />
  </div>

</div>
```

**Rules:**
- `max-w-6xl` on the outer container (1152 px cap — keeps columns readable on ultrawide).
- Left sidebar: `lg:sticky lg:top-[73px]` (73 px = height of the sticky action bar).
- Cards in Center and Right: `rounded-xl` with a `px-4 py-3 border-b` section header row and a `text-xs font-semibold uppercase tracking-wider text-muted-foreground` label.
- Right column rows: `divide-y divide-border` inside the card, `p-4` per row — never use `gap` for list rows inside a card.
- History / timeline always goes full-width **below** the 3-column grid, not inside any column.
- On mobile: `flex flex-col gap-6` collapses the grid to a single column in DOM order (left → center → right → history).

### Per-level graph pages (`/{level}/graphs`)

Two distinct chart components live in this codebase. **Use the right one
for the surface.**

| Surface | Chart |
| --- | --- |
| `pages/dashboards/UserDashboard.tsx` | `pages/dashboards/TrendSpark` (dashboard-internal — do not import elsewhere) |
| Per-level graph pages — `pages/services/graphs/*Graphs.tsx` (Bacenta, Council, Stream, Campus, Fellowship, Hub, etc.) | **`components/ChurchGraph`** (the canonical chart for graph pages) |

`ChurchGraph` was modernized in 2026-Q2 to match the dashboard's visual
language: token colours via `hsl(var(--token))`, dashed gridlines, rounded
bar caps `radius={[6, 6, 0, 0]}`, compact-number `LabelList`, themed
tooltip with `rounded-xl border border-border bg-card shadow-lg`, and a
`<Skeleton>` loading state. The legacy `--chart-*-color` CSS variables in
`ChurchGraph.css` are deprecated. **Keep `ChurchGraph` and `TrendSpark`
visually aligned** — when you change one, port the change into the other in
the same PR.

**Page structure (in order):**

1. Page header — eyebrow caption + bold church name.
2. Leader avatar in a Shadcn `<Card>` (uses `<LeaderAvatar>` — already on Tailwind).
3. **Stat header — always 4 cards, regardless of which chart tab is active:** `Membership` (clickable Link to `/{level}/members`), `Avg Weekly Bussing`, `Avg Weekly Attendance`, `Avg Weekly Income`. Layout: `grid grid-cols-2 gap-4 lg:grid-cols-4`. Income card shows `Not tracked` when `currentUser.noIncomeTracking`, never hidden.
4. Shadcn `<Tabs>` to switch the **chart** between graph types (Bussing / Services for Bacenta; level-appropriate options elsewhere). The tabs do **not** scope the stat header above.
5. `<Card>` containing `<ChurchGraph>` plus a footer row with `<ChevronLeft/>` Older — week-range label — Newer `<ChevronRight/>` buttons (`min-h-[44px]`).

**Pagination is client-side over a fetched 24-week window.** Fetch the
graph query once (`limit: 24, skip: 0` — no refetch on Older/Newer), keep
a `windowEnd` state, and slice `[windowEnd - 4, windowEnd]` of the active
dataset for the chart. **Server-side `skip` pagination is forbidden** —
refetching the whole query would flash the membership / leader / averages.

**The header averages must remain stable across pagination.** Compute them
from the full 24-week dataset (`getMonthlyStatAverage` already takes the
latest 4) — never derive them from the windowed slice.

**Bussing recency filter** — `Bacenta.bussing` SDL has no recency cap, so
dormant Bacentas leak years-old bussing into the average. Always drop
records older than `currentYear - 1` before charting / averaging bussing
data:

```ts
const recentBussingData = bussingData.filter((r) => {
  if (typeof r?.year === 'number' && Number.isFinite(r.year))
    return r.year >= currentYear - 1
  if (r?.date) {
    const y = new Date(r.date).getFullYear()
    if (Number.isFinite(y)) return y >= currentYear - 1
  }
  return false
})
```

**Number formatting** —
`Number(avg).toLocaleString('en-GH', { maximumFractionDigits: 0 })` for
counts; `Intl.NumberFormat('en-GH', { style: 'currency', currency, maximumFractionDigits: 0 })`
for money (with a try/catch fallback to `'GHS'`). Empty values render as
`'—'`, not `0`. `tabular-nums` everywhere.

**What NOT to do:**

- ❌ Replace `<ChurchGraph>` with `<TrendSpark>` on graph pages. They are
  not interchangeable; `TrendSpark` is dashboard-internal.
- ❌ Refetch the graph query on Older/Newer. The membership / leader /
  averages would flash on every click.
- ❌ Hide the income / bussing / attendance card when its tab isn't active.
  All three averages are header content, not tab content.
- ❌ Hard-code chart colours. Always `hsl(var(--token))`.

Full reference and rationale: `web-react-ts/kb/02-design-system.md` →
"Trend / graph pages".

### Dashboard layout (with sidebar on md+)

```tsx
<div className="flex min-h-svh bg-background">
  {/* Sidebar — hidden on mobile */}
  <AppSidebar className="hidden md:flex" />

  {/* Content */}
  <div className="flex-1 flex flex-col">
    <TopBar />
    <main className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* stat cards grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard ... />
      </div>
    </main>
  </div>
</div>
```

### List item (member / church / transaction row)

```tsx
<div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
  <Avatar className="h-10 w-10 shrink-0">
    <AvatarImage src={member.pictureUrl} />
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>
  <div className="min-w-0 flex-1">
    <p className="text-sm font-medium truncate">{member.fullName}</p>
    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
  </div>
  <Badge variant="outline">{member.status}</Badge>
</div>
```

---

## Icons

Use **Lucide React** (`lucide-react`) as the primary icon library. It ships
with Shadcn and is tree-shakeable.

```tsx
import { Users, ChevronRight, TrendingUp, Loader2 } from 'lucide-react'
```

Keep `react-bootstrap-icons` and `react-icons` imports only where they provide
icons not available in Lucide. Prefer Lucide for all new code.

Icon sizing:
- Navigation icons: `h-5 w-5`
- Inline icons: `h-4 w-4`
- Stat card icons: `h-5 w-5` inside a `h-10 w-10` accent circle
- FAB / large CTA: `h-6 w-6`

---

## PWA-specific requirements

These are hard requirements — never violate them.

- **Touch targets**: every interactive element must be ≥ 44×44 px. Use
  `min-h-[44px] min-w-[44px]` or Shadcn Button's `size="lg"` / `size="icon"`.
- **No hover-only states**: use `:focus-visible` and `:active` instead.
- **No `target="_blank"`** for in-app navigation. Use `<Link>` from
  `react-router-dom`.
- **Safe areas**: wrap page bottoms with `pb-[env(safe-area-inset-bottom)]`
  and fixed bottom bars with `bottom-[env(safe-area-inset-bottom)]`.
- **Bottom navigation bar**: fixed, 64 px tall (+ safe-area inset). Use
  `z-50 fixed bottom-0 inset-x-0`.
- **Inputs**: use `type="tel"` / `type="number"` / `type="email"` to trigger
  the correct mobile keyboard.

---

## Dark mode

Tailwind dark mode is triggered by `[data-theme="dark"]` on `<html>`. During
the migration period both `data-bs-theme="dark"` and `data-theme="dark"` should
be set together from `AppWithContext.tsx`.

Write dark variants inline:
```tsx
<div className="bg-background text-foreground dark:bg-background dark:text-foreground">
```

Because all colours are CSS variables that already swap under `[data-theme="dark"]`,
most elements need **no** explicit `dark:` class — they inherit from the token.
Only add `dark:` when the semantic token is insufficient.

---

## Migration strategy

### Principle

Migrate **page by page** — not component by component. A page either uses the
new design system entirely or the old one. Never mix Bootstrap grid + Tailwind
flex on the same page; the two reset layers conflict.

### Order of precedence

1. **New pages**: always use Shadcn + Tailwind. Never write Bootstrap for a
   new page.
2. **Touched pages**: when any code change touches a page, redesign that page
   fully in the same PR.
3. **Legacy pages**: leave untouched until they need a change. Do not create
   churn by migrating proactively.

### Bootstrap removal checklist (per page)

Before marking a page as migrated:

- [ ] No `import ... from 'react-bootstrap'` in the file or its components.
- [ ] No Bootstrap class names (`container`, `row`, `col-*`, `btn`, `card`,
      `d-flex`, `mt-*`, etc.) in the JSX.
- [ ] Color-theme.css legacy vars (`--bg-card`, `--icon`, etc.) replaced with
      new tokens.
- [ ] All interactive targets verified ≥ 44 × 44 px.
- [ ] Dark mode verified (toggle `data-theme`).
- [ ] `tsc --noEmit` passes.
- [ ] `eslint --max-warnings=0` passes.

### Keeping formik wrappers compatible

The formik wrappers in `components/formik/` wrap Formik `Field`; only their
**rendered output** changes. When migrating a form page:

1. Open the relevant `components/formik/Input.tsx` (etc.).
2. Replace the inner rendered element with a Shadcn `<Input>` while keeping all
   Formik props, error state, and label logic intact.
3. Apply Tailwind classes for spacing/layout.
4. The consuming page sees no change — it still uses `<Input name="..." label="..." />`.

---

## Phases for this skill

When invoked as `/design <page or component>`, execute:

### Phase 1 — Identify

- Name the exact file(s) that will change.
- State which Shadcn components you will use (check `src/components/ui/` first).
- Note any formik wrappers that need inner restyling.
- List any Bootstrap imports that will be removed.

### Phase 2 — Design intent

Write a short description (2-4 sentences) of what the redesigned page looks
like, referencing the visual language above. Confirm:
- Does this page have a stat / summary section? → Use `<StatCard>`.
- Is this primarily a form? → Use `<Card>` + `<CardContent>` form layout.
- Is this a list / directory? → Use list item pattern.
- Is this a dashboard? → Use stat card grid + chart cards.
- Is this an entity detail page (member, church, leader)? → **Use the 3-column desktop layout** (`lg:grid-cols-[280px_1fr_280px]`): left = identity panel, center = primary data, right = contact/membership. History spans full width below the grid.
- **Desktop layout (MANDATORY):** State explicitly which 2-column (or 3-column) grid you will use on `lg`. A single full-width column on desktop is never acceptable. Pick the appropriate split from the "Desktop layout rule" table above and call it out here.

**Wait for user approval** of the design intent before writing code, unless
the page is trivial (< 80 lines, no layout change).

### Phase 3 — Implementation

1. Install missing Shadcn components: `cd web-react-ts && npx shadcn@latest add <name>`.
2. Write the redesigned page / component.
3. Remove all Bootstrap imports from the file.
4. Keep all existing functionality (queries, mutations, navigation, permissions).
5. Keep `notistack` for toasts — do not replace.
6. Keep Apollo queries and Formik logic untouched; only restyle.

### Phase 4 — Verify

1. `cd web-react-ts && npx tsc -p tsconfig.json --noEmit`
2. `npx eslint <changed files> --max-warnings=0`
3. Run the Bootstrap removal checklist above.
4. Start dev server and verify the page in a 375 px viewport.
5. Toggle dark mode and verify.

### Phase 5 — Dispatch reviewers

- Always dispatch `code-reviewer` after any code change.
- Dispatch `security-reviewer` if the page touches auth, money, banking,
  arrivals, or accounts.

---

## What not to do

- ❌ Mix Bootstrap and Tailwind on the same page.
- ❌ Import from `react-bootstrap` in migrated files.
- ❌ Use `@apply` in CSS files to compose Tailwind utilities — write utilities
      in JSX directly.
- ❌ Replace `notistack` — it is wired into the Apollo error link.
- ❌ Introduce a new icon library — use `lucide-react`.
- ❌ Hardcode hex colour values — always use design tokens.
- ❌ Create Shadcn components manually — always use the Shadcn CLI to scaffold,
      then customise.
- ❌ Use `target="_blank"` for in-app links (PWA rule).
- ❌ Ship interactive elements smaller than 44 × 44 px.
- ❌ Bypass Formik logic when restyling form inputs — only swap the rendered
      element.
- ❌ Skip `isAuth(...)` in any resolver (backend rule, unrelated to this skill).
- ❌ Import `@auth0/auth0-react` — dead dep.
- ❌ **Single-column desktop layout.** Every page MUST have at least a 2-column
      grid on `lg` screens. A `max-w-2xl mx-auto` single column is mobile-only.
      On desktop, split primary content and a supporting/summary column at
      minimum — see the "Desktop layout rule" table above.
- ❌ **Full-width buttons on desktop.** A `w-full` button is a mobile pattern;
      from `sm` and up the button must shrink to intrinsic width
      (`w-full sm:w-auto sm:min-w-64`) and centre or align to its natural edge
      via the parent. Same for skeleton placeholders that stand in for the
      button. See the "Button width rule" under Actions.
