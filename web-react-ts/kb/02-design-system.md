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

Dark mode tokens are defined under `[data-theme="dark"]`. During the Bootstrap
migration period, both `data-bs-theme` and `data-theme` are set together.

### Typography

| Style | Tailwind classes | Usage |
| --- | --- | --- |
| Display | `text-3xl font-bold tracking-tight tabular-nums` | Hero numbers, totals |
| H1 | `text-2xl font-semibold` | Page title |
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

## Migration rules

- **New pages**: Shadcn + Tailwind always. Never write new Bootstrap.
- **Touched pages**: redesign fully in the same PR when you change any code.
- **Untouched pages**: leave Bootstrap until the page needs a change.
- **Never mix** Bootstrap grid + Tailwind flex/grid on the same page.

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
