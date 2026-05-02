---
description: Scaffold a reusable React component under web-react-ts/src/components/.
---

You are running `/new-component` on the FL Admin Portal frontend. This command
scaffolds a **reusable** UI component — not a page (use `/new-module` for a
page).

The user-supplied component name and purpose follow.

---

## Phase 1 — Check if it already exists

Before writing anything:

- Search `web-react-ts/src/components/` for a matching name or purpose.
- Cross-check the "components to reuse" table in
  `web-react-ts/kb/02-design-system.md`.
- Check `react-bootstrap` and `react-bootstrap-icons` — many "components" are
  one line away from a stock primitive.
- If something close exists, prefer extending or composing it rather than
  duplicating.

If a duplicate or near-duplicate exists, **stop and ask**: "X already exists at
`<path>`. Do you want me to extend it, or are these distinct enough to warrant
a new component?"

## Phase 2 — Choose the directory

Existing groups under `web-react-ts/src/components/`:

- `base-component/` — page-level wrappers (PageContainer, LoadingScreen,
  ErrorScreen, ApolloWrapper, InitialLoading)
- `buttons/` — button variants (AuthButton, EditButton, MenuButton, ViewAll,
  ChurchButton, PlusMinusSign)
- `card/` — card primitives
- `formik/` — every Formik field wrapper and per-level church search
- `members-grids/` — member grid layouts
- `pie-chart/`, `ChurchGraph/` — charts
- `responsive-design/` — viewport helpers
- `Popup/`, `HeadingPrimary/`, `LeaderAvatar/`, `TableFromArrays/`,
  `Timeline/`, `UserProfileIcon/` — single-purpose folders

Pick the existing group that fits. Only add a new folder if the component is
the start of a new family of related components.

State the chosen path. Wait for approval if creating a new top-level folder.

## Phase 3 — Write the component

Conventions:

- File name: `PascalCase.tsx`. CSS (if needed): `PascalCase.css` next to it.
- Definition: arrow-function (ESLint enforces this).
- Type the props explicitly: `type FooProps = { ... }`. Do not use `any`.
- Reuse types from `global-types.ts` — never redeclare `Member`,
  `ChurchLevel`, `Role`, `ServiceRecord`, etc.
- Styling: Bootstrap classes + CSS variables from `color-theme.css` (ADR-003).
  Use `--bg-card`, `--text-primary`, feature accents (`--members-accent`,
  etc.). No Tailwind, no styled-components.
- Imports: absolute from `src/` (ADR-009). Same-folder relative imports
  allowed.
- Keep the component **under 400 lines**. If it's growing past that, split.
- No comments unless the *why* is non-obvious. Don't write JSDoc that just
  restates the prop names.

If the component reads server data, take the data via props instead of querying
inside — the parent page owns Apollo queries. Exception: components named
`*WithQuery` (`SelectWithQuery`, `CheckboxWithQuery`) which exist precisely to
own a query.

## Phase 4 — Export it

- Default export the component (matches the existing convention; rare named
  exports for utility hooks).
- If the folder has an `index.ts` barrel, add it. Otherwise consumers will
  import from the file directly — also fine.

## Phase 5 — Verify

1. `cd web-react-ts && npx tsc -p tsconfig.json --noEmit`
2. `npx eslint <new file(s)> --max-warnings=0`
3. State whether the component will be visually validated by an existing page
   or whether a temporary host page is needed for visual review (suggest, do
   not create).

## Output

- ✅ File path of the new component (and CSS file, if any).
- ✅ One-line description of how to use it (props + minimal example snippet).
- ⚠️ Anything you couldn't decide alone (e.g. "no obvious folder — defaulted
  to `base-component/`, please move if wrong").
