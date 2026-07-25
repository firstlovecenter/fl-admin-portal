# Multi-language support (i18n) — implementation plan

Branch: `SYN-multilingual-support` (renamed from `claude/multi-language-support-ekhrgu`)

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

## Phase 1 — infrastructure + login page (DONE, verified)

- [x] `react-i18next` + `i18next-browser-languagedetector` wired up
      (`web-react-ts/src/lib/i18n.ts`). Resources bundled at build time.
- [x] Locale files: `web-react-ts/src/locales/{en,fr,es,pt,de}.json`.
- [x] `useLanguage()` hook, `LanguageSwitcherMenu` component (desktop +
      mobile nav), `flc-language` localStorage persistence.
- [x] `pages/auth/SimpleLogin.tsx` fully localized (template page).
- [x] `kb/01-glossary.md` — "Localization — do not translate" section.
- [x] **Verification run** (`npm install`, `tsc --noEmit`, `eslint`,
      `vitest`, manual review): all clean. Two genuine test-infra bugs found
      and fixed along the way:
      - `LanguageSwitcherMenu.test.tsx`'s language-switch test was silently
        failing because jsdom has no real layout engine, so Radix's submenu
        "pointer grace area" logic closes the submenu mid-interaction under
        simulated pointer clicks. Fixed by switching that interaction to
        keyboard nav (`ArrowRight`/`ArrowDown`/`Enter`), which exercises the
        same selection code without depending on jsdom's broken geometry.
      - `SimpleLogin.test.tsx` crashed at import because `__APP_VERSION__`
        (a Vite `define` global) was never mirrored into `vitest.config.ts`.
        Fixed; also fixed a real `getByText('Synago')` ambiguous-match bug
        in the test itself (matched both the heading and the SVG logo's
        `<title>`).
  - `createApolloClient.test.tsx`'s 11 failures are **pre-existing and
    unrelated** (MSW/AbortSignal version mismatch) — confirmed via `git diff`
    that this branch never touches that file. Not fixed here; out of scope.
- [ ] **Not verified in a live browser session**: Chrome DevTools MCP was
      unavailable this pass, and the local backend (Neo4j + API) wasn't
      running (Docker not started; `api/src/resolvers/secrets.ts` only
      supports AWS Secrets Manager or a hardcoded `localhost:7687` fallback —
      it does not read DB connection info from `.env`). Component/unit tests
      exercise the real rendered login page and switcher via jsdom+RTL, but
      a real-browser/PWA install-and-open check is still outstanding.

## Phase 2 — dashboards page group (DONE this pass)

Highest-traffic page group per the priority order below. All of
`pages/dashboards/` is already on Shadcn/Tailwind (no Bootstrap migration
was needed here — confirmed via grep before starting).

- [x] `UserDashboard.tsx` (the main dashboard — `FullUserDashboard`,
      `BacentaWeeklyTasks`, `WeeklyTaskCard`) — every visible string
      localized: header date (now formats via a locale-mapped `Intl` locale
      instead of hardcoded `en-GB`), metrics, trend chart labels/toggle,
      quick actions, current-focus card, record-service dialog, weekly task
      cards/statuses.
- [x] `ArrivalsCounterDashboard.tsx`, `StreamTellerDashboard.tsx` — **not**
      fully localized yet (their own strings are still English-only — next
      up if dashboards work continues), but both got one targeted fix: the
      `firstName` fallback (shown when `currentUser.fullName` is absent)
      changed from the hardcoded literal `'there'` to
      `t('dashboard.greetings.fallbackName')`, since both feed into the
      now-translation-aware `useHourlyGreeting` hook. Note: this fallback
      branch is currently unreachable in the rendered UI in both files (and
      in `UserDashboard.tsx` too) — `isLoading` and the fallback-name
      condition key off the same `!currentUser?.fullName` check, so the
      header renders a `<Skeleton>` instead of the greeting whenever the
      fallback would matter. Pre-existing structural pattern, not introduced
      by this branch; harmless but worth a follow-up to decouple if the
      fallback is ever meant to be visible.
- [x] `ServantsDashboard.tsx` — fully localized ("Welcome to", dashboard
      title, avg attendance/income stat titles, `ChurchGraph` secondary
      title now runs `__typename` through `formatChurchLevel(..., t)`
      instead of raw concatenation).
- [x] `dashboard-shared.tsx` — `useHourlyGreeting` now pulls `t` from
      `useTranslation()`, depends on `i18n.language`.
- [x] `greetings.ts` — the 65 hand-written greeting strings (biblical
      wordplay/humor, e.g. "Paul-and-Silas mode unlocked") moved out of this
      file into `dashboard.greetings.<bucket>.<index>` locale keys;
      `getHourlyGreeting` now requires a `t: TFunction` param.
      **⚠️ These 65×5 translations (French/Spanish/Portuguese/German) were
      AI-generated preserving tone and biblical references as best-effort.
      They have NOT been reviewed by a native speaker or church leader and
      should be before shipping to production users** — getting Pentecostal
      humor/theology wrong in translation is exactly the kind of nuance an
      LLM can miss. Same caveat applies to the organizational-level terms
      (`Governorship`→`Gouvernorat` etc. in `shared.churchLevel`) — these
      aren't in the do-not-translate list in `kb/01-glossary.md`, so they
      were translated as ordinary words, but weren't explicitly confirmed
      with the user.
- [x] `lib/scope-display.ts` — `formatChurchLevel`/`getRoleRelationLabel`
      gained an optional trailing `t?: TFunction` param (backward compatible
      — the ~8 other call sites that don't pass `t` get byte-identical
      behavior to before). Translates via `shared.churchLevel.*` /
      `shared.roleLabel.*` keys.
- [x] `MenuItem.tsx` — checked, correctly skipped: only renders a passed-in
      `name` prop, no hardcoded literal strings.
- [x] `TrendSpark.tsx` (the trend chart `UserDashboard.tsx` renders) — missed
      in the first pass since it's a separate file. Localized: week labels,
      axis tick abbreviation (rewritten to extract the week number via regex
      instead of stripping a hardcoded English "Week " prefix — works for
      every locale now; extracted into an exported `formatWeekTick` pure
      function so it's directly unit-testable, since jsdom can't lay out
      recharts' `XAxis` for a render-based test), chart legend/tooltip
      labels (reusing `dashboard.userDashboard.legend.*` keys rather than
      duplicating strings), empty-state message, "No values in this N-week
      window..." pagination hint, Previous/Next buttons.
- [x] `dashboard-utils.ts`'s `getServantRoles` (used only by
      `ServantsDashboard.tsx` — confirmed via grep) — its 17 hardcoded role
      display names (e.g. `'Governorship Admin'`, `'Council Arrivals
      Admin'`) now compose via a `roleDisplayName(level, suffix, t?)` helper
      reusing the already-existing `shared.churchLevel.*` /
      `shared.roleLabel.*` keys — no new locale keys needed. **Important
      distinction verified during this work**: there is a similarly-named
      but entirely separate function pair, `setServantRoles`/
      `getUserServantRoles`, in the same file, called from
      `src/auth/SetPermissions.tsx` at app-wide auth bootstrap
      (`setUserJobs(...)`) — this pair was deliberately left **completely
      untouched**, since localizing it would ripple into role/scope names
      used across the entire app, not just dashboards, well outside this
      pass's tested scope.
- [x] **Must-Fix bug found by code review, fixed**: `RoleCard.tsx` (still
      Bootstrap-styled) derives its background colour class from
      `role.toLowerCase()` — once `role` became a translated display string
      (via the `getServantRoles` change above), non-English role cards
      rendered with no matching CSS class (`Dashboards.css`'s `.colour-*`
      selectors are English-only), i.e. blank card colour. Fixed by deriving
      the colour class from `authRoles` instead (already passed to
      `RoleCard`, always the untranslated internal role key, e.g.
      `'adminGovernorship'`) — a minimal, surgical fix touching only the
      class-derivation logic, no markup/styling changed. This is the one
      place this pass touched Bootstrap-styled code; a full Shadcn migration
      of `RoleCard.tsx` was deliberately NOT done in the same pass, since
      that's a visual redesign outside an i18n-only, "don't change existing
      functionality" pass — flagging this as a tradeoff, not silently
      absorbing it.
- [x] Tests written for every touched file (Vitest + RTL, using the real
      `lib/i18n.ts` instance, not mocked): `UserDashboard.test.tsx`,
      `dashboard-shared.test.tsx`, `greetings.test.ts`, `scope-display.test.ts`,
      `ServantsDashboard.test.tsx`, `ArrivalsCounterDashboard.test.tsx`,
      `StreamTellerDashboard.test.tsx`, `RoleCard.test.tsx`, plus extended
      `dashboard-utils.test.ts` and `TrendSpark.test.tsx`. ~50 new/changed
      tests, all passing.
- [x] Four `code-reviewer` passes completed across this phase. Findings:
      one Should-Fix (missing `Oversight`/`Denomination` church-level
      translations — added), one Must-Fix (the `RoleCard.tsx` colour bug
      above — fixed), one Should-Fix (the week-abbreviation tick had no
      explicit fallback for the "unknown week" case — added a dedicated
      `weekAbbrevUnknown` locale key and unit test).
- [x] **Verified in a live browser session** (Chrome DevTools MCP, which
      became available partway through this session): login page renders
      correctly in English; switching to French via `localStorage`
      (`flc-language=fr`) + reload renders the fully-translated page
      correctly end-to-end in a real browser, including the untranslated
      "Synago" brand name per the do-not-translate list; no new console
      errors/warnings in either language; no horizontal overflow at a
      375px-wide mobile viewport. **Still not verified**: the authenticated
      dashboards themselves (Sidebar/MobileNav switcher, `UserDashboard`,
      etc.) — login against the live dev backend failed with a raw,
      untranslated `Failed to execute 'json' on 'Response'` browser error
      (pre-existing `lib/auth-service.ts` behavior, not something this
      branch touches — the local API still isn't reachable; Docker Desktop
      remains stopped in this environment).

**Full suite status after this pass:** 367 passing / 11 pre-existing
unrelated failures (`createApolloClient.test.tsx`, confirmed untouched by
this branch) / 0 new failures. `tsc --noEmit` and `eslint --max-warnings=0`
clean on every touched file.

## Phase 3 — directory page group (IN PROGRESS)

**Course-correction, mid-phase (important):** the original plan was to pair
i18n with a full Shadcn/Tailwind visual migration on the Bootstrap-mixed
directory forms (per the repo-wide "every touched file must be fully
migrated" rule). The user explicitly overrode that for this branch: *"we had
moved to Shadcn about 2 months ago — can't we do the language additions
without touching the existing UI?"* All directory work from that point on is
**pure text-content translation only** — wrap hardcoded strings in `t()`,
add the `useTranslation` import/hook, change **zero** classNames, JSX
structure, or components — even on files that still have legacy Bootstrap
divs (`form-group`, `HeadingPrimary`/`HeadingSecondary`). This deliberately
does not follow the repo's usual "fully migrate every touched file" rule; it
is a scoped, explicit user override for this branch only.

This correction came right after a real incident: a first attempt at
`GovernorshipForm.tsx` did a full visual redesign and accidentally dropped
two functional dialogs (Add Bacenta, Close Down Governorship) while
restructuring JSX. Caught on self-review and fixed before the course
correction landed, but it's the concrete reason the safer text-only pattern
is now the rule for the rest of this phase, not just a style preference.

### 3a — church-level forms (DONE, committed `a41e5eb7`)

- [x] `DenominationForm.tsx`, `GovernorshipForm.tsx`, `CouncilForm.tsx`,
      `StreamForm.tsx`, `CampusForm.tsx`, `OversightForm.tsx`,
      `QuickFactsHeader.tsx`, `UpdateDenomination.tsx` — text-only pass,
      Bootstrap markup left untouched.
- [x] New locale namespaces: `directory.common.*`,
      `directory.<level>Form.*` (×6), `directory.quickFacts.*`,
      `directory.updateDenomination.*`, and `shared.churchLevelPlural.*`
      (new — proper per-language plurals for Governorship/Council/Stream/
      Campus/Oversight/Denomination, since naive `{{word}}+s` concatenation
      is wrong in Spanish/French/German; Bacenta is the deliberate exception
      — always untranslated + plain English `+s` per `kb/01-glossary.md`).
- [x] 39 new tests (`test-author`), `code-reviewer` pass fixed 8 dead locale
      keys (leftovers from the reverted visual-migration attempt) and one
      duplicated key (`oversightsTitle` → reused
      `shared.churchLevelPlural.Oversight`).
- [x] Full suite 406 passing (367 + 39) / same 11 pre-existing unrelated
      failures. `tsc --noEmit` + `eslint --max-warnings=0` clean. Production
      build succeeded.

### 3b — DisplayChurchDetails + display/ + grids/ wrapper pages (DONE except tests, committed `efe16a04`)

- [x] `shared.churchLevelPlural.Bacenta` added ("Bacentas", identical in all
      5 locales per the glossary rule) — unifies the plural lookup so every
      church level, Bacenta included, can go through the same
      `t(\`shared.churchLevelPlural.${level}\`)` call.
- [x] `components/DisplayChurchDetails/DisplayChurchDetails.tsx` (727 lines,
      shared by all 7 `Details*.tsx` pages below, already pure Tailwind —
      no Bootstrap-preservation constraint here) — fully localized. New
      `directory.displayChurchDetails.*` namespace (24 keys, several
      interpolated: `changeAdminDialogTitle`, `subChurchLocations`,
      `viewAllSubChurch`, `moreCount`, `moreSubChurches`, `addNewSubChurch`,
      `adminChangedSuccess`). The "Record this week's service" dialog
      (Bacenta-only) reuses the existing `dashboard.userDashboard.dialog.*`
      keys from phase 2 instead of duplicating near-identical strings.
      `props.churchType`/`props.subChurch` now route through
      `shared.churchLevel.*` / `shared.churchLevelPlural.*`. The local
      `plural()` util import (from `global-utils`) was removed — no longer
      used. `throwToSentry`'s dev-facing message was deliberately left as a
      raw English literal (matches the established phase-3a precedent —
      Sentry diagnostics aren't user-facing); only the `displayError`
      toast message was translated.
- [x] The 7 `Details*.tsx` wrapper pages (`DetailsBacenta`, `DetailsCampus`,
      `DetailsCouncil`, `DetailsDenomination`, `DetailsGovernorship`,
      `DetailsOversight`, `DetailsStream`) — their `details[].title` stat
      labels and `leaderTitle` props translated. New
      `directory.detailsStats.*` (members/pastors/status/meetingDay/code/
      momoNumber/outboundStatus/urvanTopUp/sprinterTopUp/incomeTracking/
      currency/conversionRate/vacationStatus/bankAccount/yes/no/inAndOut/
      inOnly) and `directory.leaderTitle.*` (bacentaLeader/campusLeader/
      councilLeader/governor/oversightLeader/streamLeader/leadPastor)
      namespaces; entity-count titles (Bacentas/Governorships/Councils/
      Streams/Campuses) reuse `shared.churchLevelPlural.*` rather than
      duplicating.
- [x] The 7 `grids/*.tsx` member-grid wrapper pages (`BacentaMembers`,
      `CampusMembers`, `CouncilMembers`, `GovernorshipMembers`,
      `OversightMembers`, `StreamMembers`, `ChurchLevelMembers`) — grid
      headings translated (mix of `shared.churchLevel.*` and
      `directory.detailsStats.members`, matching each file's pre-existing
      choice of showing the level name vs. the word "Members" — an
      inconsistency in the original source, preserved faithfully rather
      than silently "fixed"). `ChurchLevelMembers.tsx`'s defensive
      "level not supported" fallback message got a new
      `directory.churchLevelMembers.*` prefix/suffix pair split around the
      translated level name — checked each locale's punctuation spacing
      convention (no space before a period in French/Spanish/Portuguese;
      German needs the verb after the noun, so its suffix carries the verb).
- [x] `tsc --noEmit` and `eslint --max-warnings=0` clean on every file in
      this sub-batch. Key parity across all 5 locale files reconfirmed
      twice via a standalone Node script (not just the Vitest key-parity
      test) after each addition.
- [ ] **Tests deliberately deferred — real gap, not silently skipped.** The
      `test-author` subagent dispatch for `DisplayChurchDetails.tsx` + the 7
      `Details*.tsx` pages failed twice: first a transient API 529/overload
      (retried), then a hard failure — **the account hit its monthly API
      spend limit**. Tests for the 7 `grids/*.tsx` pages were never
      dispatched at all as a result. Asked the user how to proceed
      (write inline myself / pause until the limit is raised / commit
      without tests); user explicitly chose to commit without tests this
      round. This means **15 files in this sub-batch have zero test
      coverage**, against this repo's normally-mandatory "every touched
      file ships with tests in the same PR" rule — a deliberate,
      user-approved exception, not an oversight. **Follow-up required**:
      backfill tests for all 15 files (`DisplayChurchDetails.tsx` + 7
      `Details*.tsx` + 7 `grids/*.tsx`) once the spend limit is raised.
- [ ] `code-reviewer` pass for this whole sub-batch was also skipped for the
      same reason (would have hit the same spend-limit wall). Substituted
      with a manual self-review instead: read the full diff for all 15
      source files plus all 5 locale JSON diffs, confirmed symmetric +60
      line additions across all 5 locales, reran `tsc --noEmit` and
      `eslint --max-warnings=0` (clean) and the key-parity check (clean).
      This is not a substitute for the usual second-pass review — flagged
      as outstanding follow-up too.
- [x] Committed as `efe16a04` (`feat(directory): localize
      DisplayChurchDetails and display/grids wrapper pages`). Full suite:
      406 passing / same 11 pre-existing unrelated failures
      (`createApolloClient.test.tsx`, reconfirmed untouched by this branch
      via `git diff --stat`).

### 3c — not started yet (rest of `pages/directory/`)

- `quick-facts/` (remaining files beyond `QuickFactsHeader.tsx`, already
  done in 3a)
- `create/`, remainder of `update/` (beyond `UpdateDenomination.tsx`)
- `user-profile/`, `church-history/`
- `reusable-forms/MemberForm.tsx` (620 lines), `MemberDisplay.tsx` (844
  lines) — the two largest remaining files in this page group
- Shared grid components used by all 7 `grids/*.tsx` pages:
  `components/members-grids/MembersGrid.tsx` (261 lines),
  `MemberTable.tsx` (191 lines), `Filters.tsx` (142 lines) — not yet
  surveyed for hardcoded strings
- Two pre-existing, unrelated bugs were noticed in passing during 3a/3b and
  **deliberately left unfixed** (flagged instead of silently patched, since
  they're outside this branch's diff): `SearchCombobox.tsx`'s `<Label
  htmlFor>` doesn't associate with the underlying `cmdk` input (affects
  every `Search*` field app-wide); `StreamForm.tsx`'s "Close Down Stream"
  success handler navigates to `/council/displayall` instead of
  `/stream/displayall` (copy/paste artifact from commit `58adb4bd`);
  `UpdateDenomination.tsx`'s `onSubmit` doesn't inspect
  `updateResult.errors` under `errorPolicy: 'all'`.

## Remaining work (not started — future phases)

Roughly in priority order:

1. **Backfill tests for the 15 files committed in `efe16a04` without
   coverage** (`DisplayChurchDetails.tsx`, the 7 `Details*.tsx` pages, the 7
   `grids/*.tsx` pages) — blocked purely by the account's monthly API spend
   limit at commit time, not a code issue. Do this before any further
   subagent-driven work in this repo if possible, so the gap doesn't grow.
   Also do the deferred `code-reviewer` second-pass review on that commit.
2. **Native-speaker review of the greeting pool and organizational-level
   terms** (see the ⚠️ above) — should happen before this ships to real
   users, independent of further page localization.
3. **Finish `pages/dashboards/`**: `ArrivalsCounterDashboard.tsx` and
   `StreamTellerDashboard.tsx` still have their own English-only strings
   (bussing counters, banking-defaulter CTAs, etc.) beyond the one
   fallback-name fix already made.
4. **Finish `pages/directory/`** — see Phase 3 above; 3c (quick-facts/
   create/update remainder, user-profile, church-history,
   MemberForm/MemberDisplay, shared grid components:
   `MembersGrid.tsx`/`MemberTable.tsx`/`Filters.tsx`).
5. **`pages/arrivals/`** — after directory. Not started.
6. Then accounts/banking/reports, translating error/validation copy as each
   page is migrated (Yup schema messages, Apollo/notistack-surfaced errors
   are still English-only everywhere, including on already-localized pages).
7. **Backend-sourced strings** (still explicitly out of scope): if any
   generated PDF/report exports or SMS text ever need localizing, that's a
   distinct, later decision — not assumed by ADR-017.
8. **AI Assistant page** (`pages/ai-assistant/`, nav entry `/ai-assistant`,
   `navigation-config.tsx:135-139`) — deliberately deferred, needs its own
   design decision (translate the source corpus? generate in-language?
   translate output post-hoc?) before implementation. Two separate problems:
   UI chrome (straightforward `t()` pass) and AI-generated content itself
   (English-only corpus per ADR-015, a different kind of problem).
9. **Keep `kb/01-glossary.md`'s do-not-translate list in sync** as new
   coined terms or proper names enter the domain.
10. Optional later optimization: lazy-load only the active locale's JSON
   instead of bundling all five. If this happens, the `useSuspense: false`
   guard in `lib/i18n.ts` becomes load-bearing rather than precautionary —
   pair it with a real `<Suspense>`/`<ErrorBoundary>` above `SimpleApp` at
   that point (see ADR-017 consequences).

## File manifest

**New (phase 1):**
- `web-react-ts/src/lib/i18n.ts`, `i18n.test.ts`
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
- `web-react-ts/src/hooks/useLanguage.ts`, `useLanguage.test.ts`
- `web-react-ts/src/components/shell/LanguageSwitcherMenu.tsx`,
  `LanguageSwitcherMenu.test.tsx`
- `web-react-ts/src/pages/auth/SimpleLogin.test.tsx`

**New (phase 2 — dashboards):**
- `web-react-ts/src/pages/dashboards/UserDashboard.test.tsx`
- `web-react-ts/src/pages/dashboards/dashboard-shared.test.tsx`
- `web-react-ts/src/pages/dashboards/greetings.test.ts`
- `web-react-ts/src/pages/dashboards/ServantsDashboard.test.tsx`
- `web-react-ts/src/pages/dashboards/ArrivalsCounterDashboard.test.tsx`
- `web-react-ts/src/pages/dashboards/StreamTellerDashboard.test.tsx`
- `web-react-ts/src/pages/dashboards/RoleCard.test.tsx`
- `web-react-ts/src/lib/scope-display.test.ts`

**Modified (phase 1):**
- `web-react-ts/package.json` (3 new deps), `package-lock.json` (regenerated)
- `web-react-ts/src/index.tsx` (i18n side-effect import)
- `web-react-ts/src/pages/auth/SimpleLogin.tsx` (fully localized)
- `web-react-ts/src/components/shell/Sidebar.tsx`,
  `web-react-ts/src/components/shell/MobileNav.tsx` (switcher wired in)
- `web-react-ts/vitest.config.ts` (`__APP_VERSION__` define fix — see Phase 1
  verification notes above)
- `kb/01-glossary.md` (do-not-translate section)
- `kb/06-adr.md` (ADR-017)

**Modified (phase 2 — dashboards):**
- `web-react-ts/src/pages/dashboards/UserDashboard.tsx`,
  `dashboard-shared.tsx`, `greetings.ts`, `ServantsDashboard.tsx`,
  `ArrivalsCounterDashboard.tsx`, `StreamTellerDashboard.tsx`,
  `TrendSpark.tsx`, `TrendSpark.test.tsx` (pre-existing, needed an `lib/i18n`
  import fix), `dashboard-utils.ts`, `dashboard-utils.test.ts`,
  `RoleCard.tsx` (colour-class bug fix only, see above)
- `web-react-ts/src/lib/scope-display.ts`
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json` (dashboard.*, shared.*
  keys added)

Not touched: `web-react-ts/src/pages/auth/LoginPage.tsx` (dead code, not
imported anywhere), any backend code, `pages/dashboards/MenuItem.tsx` (no
translatable literal strings), `useComponentQuery.tsx` (checked — no
user-visible literal strings), `dashboard-utils.ts`'s `setServantRoles`/
`getUserServantRoles` (deliberately left alone — see above, used by
app-wide auth bootstrap, out of scope for this pass).

**New (phase 3a — church-level forms, committed `a41e5eb7`):**
- `web-react-ts/src/pages/directory/reusable-forms/{Denomination,
  Governorship,Council,Stream,Campus,Oversight}Form.test.tsx`
- `web-react-ts/src/pages/directory/quick-facts/components/QuickFactsHeader.test.tsx`
- `web-react-ts/src/pages/directory/update/UpdateDenomination.test.tsx`

**Modified (phase 3a):**
- `web-react-ts/src/pages/directory/reusable-forms/{Denomination,
  Governorship,Council,Stream,Campus,Oversight}Form.tsx` (text-only,
  Bootstrap markup untouched)
- `web-react-ts/src/pages/directory/quick-facts/components/QuickFactsHeader.tsx`
- `web-react-ts/src/pages/directory/update/UpdateDenomination.tsx`
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json` (`directory.common.*`,
  `directory.<level>Form.*`, `directory.quickFacts.*`,
  `directory.updateDenomination.*`, `shared.churchLevelPlural.*` added)

**Modified (phase 3b — DisplayChurchDetails + display/ + grids/, committed `efe16a04`):**
- `web-react-ts/src/components/DisplayChurchDetails/DisplayChurchDetails.tsx`
- `web-react-ts/src/pages/directory/display/{DetailsBacenta,DetailsCampus,
  DetailsCouncil,DetailsDenomination,DetailsGovernorship,DetailsOversight,
  DetailsStream}.tsx`
- `web-react-ts/src/pages/directory/grids/{BacentaMembers,CampusMembers,
  CouncilMembers,GovernorshipMembers,OversightMembers,StreamMembers,
  ChurchLevelMembers}.tsx`
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
  (`shared.churchLevelPlural.Bacenta`, `directory.displayChurchDetails.*`,
  `directory.detailsStats.*`, `directory.leaderTitle.*`,
  `directory.churchLevelMembers.*` added)

**Missing (phase 3b — real gap, tracked as priority-1 follow-up above):** no
test files exist for any of the 15 files in the bullet above. Both
`test-author` dispatch attempts failed (transient 529, then a hard monthly
API spend-limit stop) and the user explicitly chose to commit without tests
rather than wait. Backfill before further subagent-driven work in this repo.
