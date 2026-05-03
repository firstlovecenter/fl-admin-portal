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
| Heading 1 | `text-2xl font-semibold` | Page title |
| Heading 2 | `text-lg font-semibold` | Section / card title |
| Heading 3 | `text-base font-medium` | Sub-section label |
| Body | `text-sm` | Default body copy |
| Caption | `text-xs text-muted-foreground` | Timestamps, secondary labels |
| Monospace | `font-mono text-sm` | IDs, phone numbers, amounts |

Numbers that represent money or counts get `tabular-nums` (`font-variant-numeric: tabular-nums`) via the Tailwind class `tabular-nums`.

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

#### Data display

| Need | Component | Notes |
| --- | --- | --- |
| Table | `<Table>` from `ui/table` | Responsive; add horizontal scroll wrapper on mobile |
| Avatar | `<Avatar>` from `ui/avatar` | Replaces `<UserProfileIcon>` and `<LeaderAvatar>` |
| Chart | Keep `recharts` (`<ChurchGraph>`) | Restyle container only |
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

### Page layout (mobile-first)

```tsx
// Default page: full-width, safe-area aware
<div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
  <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
    <BackButton />
    <h1 className="text-lg font-semibold text-foreground">Page Title</h1>
  </header>

  <main className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
    {/* content */}
  </main>
</div>
```

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
