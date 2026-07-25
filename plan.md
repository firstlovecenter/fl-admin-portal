# Multi-language support (i18n) — implementation plan

Branch: `claude/multi-language-support-ekhrgu`

## Goal

Add multi-language support to the FL Admin Portal frontend so pastors/admins
in Francophone, Hispanophone, Lusophone, and German-speaking regions can use
the app in their own language. Initial languages: **English** (source),
**French**, **Spanish**, **Portuguese**, **German** — architected as an
open-ended set so more languages are a content-only addition later (one more
locale JSON file + one entry in `SUPPORTED_LANGUAGES`).

Full architecture decision recorded in **`kb/06-adr.md` → ADR-017**. Read
that first — this file is the working/status doc, ADR-017 is the durable
record.

## Scope of this phase (phase 1 — DONE, on this branch)

Deliberately narrow: infrastructure + switcher + **one** fully-localized page
as the template, not a big-bang rewrite of all ~300 pages.

- [x] `react-i18next` + `i18next-browser-languagedetector` wired up
      (`web-react-ts/src/lib/i18n.ts`). Resources bundled at build time (no
      HTTP backend) so translation keeps working offline per the PWA rules
      in the root `CLAUDE.md`.
- [x] Locale files: `web-react-ts/src/locales/{en,fr,es,pt,de}.json`.
- [x] `useLanguage()` hook (`web-react-ts/src/hooks/useLanguage.ts`).
- [x] `LanguageSwitcherMenu` component
      (`web-react-ts/src/components/shell/LanguageSwitcherMenu.tsx`) —
      a Radix `DropdownMenuSub` with a radio list of native language names,
      embedded into the existing profile dropdown in both `Sidebar.tsx`
      (desktop) and `MobileNav.tsx` (mobile sheet), next to the existing
      theme toggle.
- [x] `pages/auth/SimpleLogin.tsx` — the **real** pre-auth screen (not the
      dead `LoginPage.tsx`, which was left untouched) fully localized as the
      template page for the rest of the migration.
- [x] `flc-language` localStorage persistence, mirroring the existing
      `flc-theme` pattern from `ThemeProvider`.
- [x] `kb/01-glossary.md` — "Localization — do not translate" section:
      Bacenta, Anagkazo, Sonta, Basonta (plurals: Bacentas, Sontas,
      Basontas — plain English `+s` in every locale, never conjugated),
      Momo, IMCL, GHS/Cedi(s), Poimen, Synago (brand name), and official
      church/Stream proper names.
- [x] Tests written: `lib/i18n.test.ts` (locale key-parity across all 5
      files), `hooks/useLanguage.test.ts`, `components/shell/
      LanguageSwitcherMenu.test.tsx`, `pages/auth/SimpleLogin.test.tsx`
      (new — none existed before).
- [x] `code-reviewer` pass completed; all Should-Fix and Consider items
      addressed (Suspense safety net, export style, import ordering,
      `useCallback`, ADR-017 added).

## ⚠️ Known blocker — verification not run

**Nothing in this branch has been executed.** The sandbox this was built in
has no `node_modules` and cannot run `npm install`: an unrelated
pre-existing dependency (`xlsx`, pinned to `https://cdn.sheetjs.com/...` in
`web-react-ts/package.json`) is blocked by that environment's network
policy. This blocks *any* install in `web-react-ts` right now, not just
this change.

Consequences:
- `web-react-ts/package.json` was **hand-edited** to add `i18next`,
  `react-i18next`, `i18next-browser-languagedetector` (versions confirmed
  resolvable against the real npm registry from an isolated scratch
  install, not verified in-repo).
- `package-lock.json` was **not regenerated**.
- `tsc --noEmit`, `eslint`, and `vitest` have **not been run**. The code was
  reviewed statically (by a `code-reviewer` agent) but not executed.

### First thing to do in the IDE

```bash
cd web-react-ts
npm install                      # regenerates package-lock.json
npx tsc -p tsconfig.json --noEmit
npx eslint src/lib/i18n.ts src/hooks/useLanguage.ts \
  src/components/shell/LanguageSwitcherMenu.tsx \
  src/components/shell/Sidebar.tsx src/components/shell/MobileNav.tsx \
  src/pages/auth/SimpleLogin.tsx src/index.tsx --max-warnings=0
npm run test:run
```

Fix whatever surfaces — the code was written carefully but is genuinely
unverified. Commit `package-lock.json` once `npm install` succeeds.

Then smoke-test manually (`npm start`): open `/login` (unauthenticated),
switch languages via the profile menu once logged in, confirm the switcher
appears correctly on both desktop (`Sidebar.tsx`) and mobile
(`MobileNav.tsx`, < md breakpoint), confirm the choice survives a reload.

## Remaining work (not started — future phases)

Roughly in priority order:

1. **Verify phase 1** (see blocker above) — this must happen before
   anything else builds on top of it.
2. **Expand localized pages incrementally**, ideally in the same PR as
   each page's Bootstrap → Shadcn/Tailwind migration (per the ongoing
   migration effort) rather than as a separate pass — see ADR-017
   consequences. Suggested order: dashboards → directory → arrivals
   (highest traffic first), then accounts/banking/reports.
3. **Translate error/validation copy** as pages are migrated — Yup schema
   messages and Apollo/notistack-surfaced errors are currently English-only
   and out of scope for phase 1.
4. **Backend-sourced strings** (still explicitly out of scope): if any
   generated PDF/report exports or SMS text ever need localizing, that's a
   distinct, later decision — not assumed by ADR-017.
5. **AI Assistant page (`pages/ai-assistant/`, nav entry `/ai-assistant`,
   `navigation-config.tsx:135-139`)** — two separate localization problems,
   deliberately deferred:
   - **UI chrome** (composer, buttons, headers, `TodaysTipBanner`, chat
     history sidebar) — same static-string treatment as any other page,
     but a `@assistant-ui/react`-built chat surface, so worth its own pass
     rather than assuming it's a drop-in `t()` swap like `SimpleLogin`.
   - **AI-generated content itself** (weekly tips, chat responses) — grounded
     in an English-only corpus (founder's books + KJV/WEB Scripture, per
     ADR-015) and generated by Claude in English. Localizing this is a
     different kind of problem (translate the source corpus? generate
     directly in the target language? translate the output post-hoc?) and
     needs its own design decision before implementation — not assumed by
     ADR-017.
5. **Keep `kb/01-glossary.md`'s do-not-translate list in sync** as new
   coined terms or proper names enter the domain.
6. Optional later optimization: lazy-load only the active locale's JSON
   instead of bundling all five. If this happens, the `useSuspense: false`
   guard in `lib/i18n.ts` becomes load-bearing rather than precautionary —
   pair it with a real `<Suspense>`/`<ErrorBoundary>` above `SimpleApp` at
   that point (see ADR-017 consequences).

## File manifest (this branch so far)

**New:**
- `web-react-ts/src/lib/i18n.ts`, `i18n.test.ts`
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
- `web-react-ts/src/hooks/useLanguage.ts`, `useLanguage.test.ts`
- `web-react-ts/src/components/shell/LanguageSwitcherMenu.tsx`,
  `LanguageSwitcherMenu.test.tsx`
- `web-react-ts/src/pages/auth/SimpleLogin.test.tsx`

**Modified:**
- `web-react-ts/package.json` (3 new deps, hand-edited — see blocker)
- `web-react-ts/src/index.tsx` (i18n side-effect import)
- `web-react-ts/src/pages/auth/SimpleLogin.tsx` (fully localized)
- `web-react-ts/src/components/shell/Sidebar.tsx`,
  `web-react-ts/src/components/shell/MobileNav.tsx` (switcher wired in)
- `kb/01-glossary.md` (do-not-translate section)
- `kb/06-adr.md` (ADR-017)

Not touched: `web-react-ts/src/pages/auth/LoginPage.tsx` (dead code, not
imported anywhere — confirmed during Phase 2 codebase analysis, left alone
as out of scope), any backend code.
