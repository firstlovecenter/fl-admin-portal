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
- [x] `ArrivalsCounterDashboard.tsx`, `StreamTellerDashboard.tsx` — fully
      localized this pass: scoped-role labels, church-level badges, date
      formatting, metrics, chart copy, banking CTAs, accessibility labels,
      empty states, and quick-action cards now use `dashboard.*` keys. The
      existing translation-aware greeting fallback remains unchanged. Final
      runtime verification is deferred until the full frontend localization
      sweep is complete, per the requested sequencing.
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
- [x] **Deferred test coverage backfilled.** `DisplayChurchDetails.test.tsx`,
      `DetailsPages.test.tsx`, and `MemberGridPages.test.tsx` now cover the
      shared detail component, all 7 `Details*.tsx` wrappers, and all 7
      `grids/*.tsx` wrappers. The focused test run passed 6/6. This closes
      the user-approved coverage exception from the original commit.
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

### 3d — quick-facts this-month pages (DONE, committed `1e009b93`)

**API spend limit hit mid-branch.** The `test-author` subagent dispatch for
the 3b batch failed twice — a transient 529, then a hard stop: *"You've hit
your monthly spend limit."* Asked the user how to proceed; they chose to
keep going with translation work but write tests inline myself (no
`test-author`/`code-reviewer` subagent dispatches) rather than pause. This
phase and everything after it in this session follows that mode.

- [x] Surveyed `pages/directory/quick-facts/` fully. Found the
      `components/` subfolder (`AttendanceQuickFactsCard.tsx`,
      `BussingQuickFactsCard.tsx`, `IncomeQuickFactsCard.tsx`,
      `QuickFactsSlider.tsx`, `QuickFactsSelect.tsx`, `quick-fact-utils.ts`)
      is **dead code** — confirmed via grep that nothing outside their own
      files imports them, and `directoryRoutes.ts` only routes the 5
      `this-month/*.tsx` pages. `QuickFactsHeader.tsx` (translated in 3a) is
      *also* dead by the same test — orphaned, only referenced by its own
      test file. Skipped translating the dead `components/` files; no
      value in maintaining translations for unreachable code.
- [x] Localized the 5 routed `this-month/*AvgWeekdayQuickFacts.tsx` pages
      (Bacenta/Campus/Council/Governorship/Stream) and their shared
      `QuickFactComparisonCard.tsx`. New
      `directory.quickFacts.avgWeekday.*` and
      `directory.quickFactComparisonCard.*` namespaces, several
      interpolated (`compareDescriptionPrefix/Suffix`,
      `explainerBodyPrefix/Suffix`, `benchmarkLabel`, `benchmarkContext`,
      `atBenchmark`/`aboveBenchmark`/`belowBenchmark`). Same
      prefix/suffix-around-a-styled-`<span>` pattern established in 3b's
      `churchLevelMembers` fallback message, including per-locale
      leading-space/punctuation handling (German suffixes carry the verb
      and a leading space; French/Spanish/Portuguese don't need one before
      the period).
- [x] Added `directory.leaderTitle.governorshipLeader` = "Governorship
      Leader" — deliberately **not** reusing the existing
      `directory.leaderTitle.governor` ("Governor") key, because the
      source itself uses two different labels for the same role on two
      different pages (`DetailsGovernorship.tsx` vs. this one). Preserved
      faithfully rather than silently merged, same policy as the
      Members-vs-level-name inconsistency found in 3b's `grids/*.tsx`.
- [x] **Tests written inline by me** (not `test-author`, per the spend-limit
      workaround above): 15 new tests across 6 files, `MockedProvider` +
      the real `lib/i18n.ts` instance, English + French coverage per file.
      Validated the `MockedProvider`/`ApolloWrapper` pattern on
      `BacentaAvgWeekdayQuickFacts.test.tsx` first (which required
      `placeholder` + awaiting the mocked query resolve via `findByText`,
      since `ApolloWrapper`'s `placeholder` prop bypasses its own loading
      gate) before replicating across the other 4 pages.
- [x] **Self-reviewed the diff manually** (no `code-reviewer` dispatch, same
      reason). Confirmed symmetric locale-file diffs and structurally
      identical per-page diffs across all 5 `this-month` pages.
- [x] `tsc --noEmit` + `eslint --max-warnings=0` clean. Key parity
      reconfirmed across all 5 locale files. Full suite: 421 passing
      (406 + 15 new) / same 11 pre-existing unrelated failures.

### 3e — not started yet (rest of `pages/directory/`)

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

### 3e — create/ directory pages + BacentaForm.tsx (DONE, committed `f5fb8b86`)

Translated all 7 `pages/directory/create/*.tsx` wrappers. Found and fixed a
real gap while doing so: `BacentaForm.tsx` (`reusable-forms/`) was missed
entirely in phase 3a's church-level-forms pass — caught because
`CreateBacenta.tsx` renders it. Unlike the six forms done in 3a,
`BacentaForm.tsx` is already fully Tailwind, so no Bootstrap-preservation
constraint applied; translated normally. New `directory.create.*`,
`directory.createMember.*`, `directory.bacentaForm.*` namespaces, plus
`directory.common.cancel`. `directory.create.createNewLevel` handles the
shared "Create a New {{level}}" pattern (Campus/Council/Governorship/
Oversight/Stream); Bacenta keeps its own `startNewBacenta` key since the
source uses different wording ("Start a New Bacenta"). Tests written inline
(26 new — first batch under the spend-limit workaround, see 3d above).
`tsc`/`eslint` clean, full suite 439 passing / same 11 pre-existing
failures.

### 3f — update/ directory pages (DONE, committed `d59c8381`)

Translated the 6 near-identical `Update{Level}.tsx` wrappers plus
`UpdateMember.tsx`, `MemberCollisionDialog.tsx`, and
`UpdateBusPaymentDialog.tsx`. New `directory.update.*` namespace (shared,
interpolated by level — distinct from the existing `directory.
updateDenomination.*` from 3a, left untouched), plus
`directory.memberCollisionDialog.*`, `directory.updateBusPaymentDialog.*`,
`directory.updateMember.*`.

**Deliberate non-translation, documented for future readers**:
`historyRecord` template strings passed to `LOG_*_HISTORY` mutations
(audit-trail text persisted to `HistoryLog` nodes) are left in English —
these are stored data, not runtime UI. Translating them would mean a
church's audit trail mixes languages depending on which locale was active
when each change was made, which is worse than a consistent single
language. Same reasoning as leaving `throwToSentry(...)` messages
untranslated (dev/Sentry-only), a precedent now applied consistently since
phase 3b.

**Real test-infra bug found and fixed**: `UpdateMember.test.tsx` (existing,
from an earlier SYN-205 fix) never imported `lib/i18n`. Once
`UpdateMember.tsx`/`MemberCollisionDialog.tsx` started calling
`useTranslation()`, `t()` silently returned raw key strings
(e.g. `"directory.updateMember.updateProfileError"`) instead of translated
text, because react-i18next's singleton was never initialized in that
file's module graph — every toast/dialog assertion in that file started
failing. Fixed with the same side-effect import used everywhere else in
this branch (`import 'lib/i18n'`). This is a real gotcha worth remembering:
**any existing test file that renders a component newly touched to call
`useTranslation()` needs this import added**, or its `t()` calls will
silently no-op to raw keys instead of throwing.

25 new tests, written inline (test-author/code-reviewer subagent dispatch
still blocked by the spend limit — see 3d). One full-render test
(`UpdateCampus.test.tsx`) establishes the `MockedProvider` +
`DISPLAY_CAMPUS` pattern; the other five `Update*.tsx` wrappers use a
lighter translation-key-resolution test instead of repeating the same
scaffolding six times (documented in each file). `tsc`/`eslint` clean,
full suite 464 passing / same 11 pre-existing failures.

### 3g — user-profile/ (DONE, committed `ab70a8c7`)

Translated `DisplayPage.tsx` (`/user-profile` route): edit button,
accordion section titles (Bio/History/Church Groups), all bio/church-group
field labels. New `directory.userProfile.*` namespace; "Bacenta" label
routed through the existing `shared.churchLevel.Bacenta` key.
`EditPage.tsx` (`/user-profile/edit`) has no hardcoded strings of its own —
thin `<MemberForm>` wrapper, left untouched pending the MemberForm.tsx
pass. 4 new tests (Radix Accordion unmounts collapsed content, so
field-label assertions click triggers open first; also worked around an
Apollo `MockedProvider` quirk where the accordion-click interaction caused
a query to re-fire once more than a single-consumption mock allows, fixed
by duplicating each mock). Full suite 468 passing / same 11 pre-existing
failures.

### 3h — church-history/ (DONE, committed `00123a7b`)

Translated the shared `ChurchHistoryView.tsx` (nested under
`display/church-history/`, not a top-level folder — audit-trail heading,
empty state, Summary/About-this-log sidebar) and the 6 `*History.tsx`
wrapper pages (Bacenta/Campus/Council/Governorship/Stream/Member). New
`directory.churchHistory.*` namespace. `parentTypename` routes through
`shared.churchLevel.*` for the audit-trail sentence, except `"Member"`
(not a `ChurchLevel`), which gets its own `memberTypeName` key.
`historyRecord` entries (actual log content) stay untranslated stored
data, same reasoning as phase 3f. 22 new tests — `hooks/useInfiniteScroll`
mocked (Apollo + IntersectionObserver internals out of scope), one
full-render wrapper test (`BacentaHistory.test.tsx`) plus a thorough
`ChurchHistoryView.test.tsx`, the other five wrappers using lighter
key-resolution tests. Full suite 490 passing / same 11 pre-existing
failures.

### 3i — MemberForm.tsx (DONE, committed `f837815e`)

Translated the shared `MemberForm.tsx` (620 lines — rendered by
`CreateMember`, `UpdateMember`, and the user-profile edit page):
validation messages, header, the four section titles (Basic Information /
Contact / Personal / Church Membership), all field labels and
placeholders, and the submit footer. New `directory.memberForm.*`
namespace. "Basonta" (label and value) left untranslated per
`kb/01-glossary.md`'s do-not-translate list, same as "Bacenta"; the
`SearchBacenta` label ("Bacenta *") routes through
`shared.churchLevel.Bacenta`. 3 new tests (register mode, update mode,
French). Full suite 493 passing / same 11 pre-existing failures.

### 3j — MemberDisplay.tsx (DONE, committed `516cf0fb`)

Translated `MemberDisplay.tsx` (844 lines — the member detail page): the
sticky-note dialog, top action bar, identity/contact panel, church
membership rows, personal-information rows, leadership-roles and
church-history headings, and the vCard export. New
`directory.memberDisplay.*` namespace.

**The translate-vs-don't line, now settled and test-pinned.** This file
forced the distinction to be made explicit, so it's worth recording:

- `historyRecord` values (`"Added Sticky Note: …"`, `"Deleted Sticky
  Note"`) — **not translated.** Persisted to `HistoryLog` nodes and read
  later by other users; translating them would mean one church's audit
  trail mixes languages depending on whichever locale each editor
  happened to have active. Same call as phases 3f and 3h.
- The **vCard export — translated.** Superficially similar (it's
  "exported data"), but it's generated fresh on each download and read
  only by the person who downloaded it, so there's no stored-data or
  cross-user consistency problem. `generateVCard` takes `t` as a third
  param, following the module-level-helper pattern already used by
  `getHourlyGreeting(t)` and `convertToString(value, t)`.
- `throwToSentry(...)` — not translated (dev-only diagnostics), and
  "Basonta"/"Bacenta" values stay as coined loanwords.

Two of the 4 new tests exist specifically to pin the do-not-translate
and translate-the-vCard decisions so a later pass can't silently flip
either one. Full suite 497 passing / same 11 pre-existing failures.

### 3k — shared member-grid components (IMPLEMENTED, verification pending)

Translated the final two hardcoded-UI components under `components/members-grids/`:
`MembersGrid.tsx` (search placeholder, member/match count suffixes, Add member,
Download, Filters, download accessibility label, and filter-sheet title) and
`Filters.tsx` (all filter group labels plus Reset/Apply Filters). `MemberTable.tsx`
was reconfirmed as having no hardcoded user-facing strings and remains untouched.

New `directory.memberGrid.*` and `directory.memberFilters.*` keys were added to
all five locale files. This is a text-only i18n pass: class names, component
structure, filtering, pagination, queries, and permissions are unchanged.

`MembersGrid.test.tsx` and `Filters.test.tsx` provide English/French coverage.
Both were re-run during the phase-4 verification pass below and pass.

## Phase 4 — arrivals page group + final verification (DONE, committed `e3d93ae7`)

The last page group, and the commit that closes the sweep. Landed together
with the grid components above, the two remaining dashboards, and the test
backfill that phase 3b had deferred.

- [x] **`pages/arrivals/` (20 files)** — bacenta arrivals, bussing and
      vehicle forms, the four level dashboards (Campus/Council/Stream/
      Governorship), arrivals payment data, countdown components, live
      feed, download button, pre-mobilisation picture. New `arrivals.*`
      namespace covering visible UI, accessibility labels, toasts, and
      client-generated CSV/Excel export copy.
- [x] **`components/members-grids/{MembersGrid,Filters}.tsx`** — the last
      `pages/directory/` dependency. `MemberTable.tsx` re-surveyed and
      confirmed to have no user-facing strings; left untouched.
- [x] **`ArrivalsCounterDashboard.tsx` / `StreamTellerDashboard.tsx`** now
      fully localized, closing the phase-2 gap where only the greeting
      fallback had been converted.
- [x] **Test backfill for `efe16a04`** — `DisplayChurchDetails.test.tsx`,
      `DetailsPages.test.tsx`, `MemberGridPages.test.tsx`. This closes the
      15-file coverage gap that the monthly API spend limit forced in phase
      3b; it is no longer outstanding.

**Two real bugs caught by the verification pass** (neither was an i18n
mistake — both were latent in the new code):

1. `ArrivalsPaymentData.tsx` called an **undefined `formatNumber`** in the
   topUp column. This is a runtime crash, not a type-only complaint — the
   column would have thrown as soon as it rendered. Fixed to
   `info.getValue().toLocaleString(i18n.language)`, matching the adjacent
   `vehicleCost` column and keeping number formatting locale-aware rather
   than reintroducing a hardcoded formatter.
2. Two new test fixtures failed `tsc`: `DisplayChurchDetails.test.tsx`'s
   `leader` object was missing required `MemberWithoutBioData` fields, and
   `MembersGrid.test.tsx`'s `useInfiniteScroll` mock was missing `reset`.

**Verification (all quoted from real runs):** `tsc --noEmit` clean;
`eslint --max-warnings=0` clean across all 31 changed files; locale key
parity confirmed by a standalone Node script — **737 keys in each of the 5
files, no missing, no extra, no blank values**. Full suite **507 passing**
(up from 497) / the same **11 pre-existing `createApolloClient.test.tsx`
failures**, reconfirmed untouched by this branch via
`git diff main...HEAD -- src/lib/createApolloClient*`.

## Remaining work (not started — future phases)

Roughly in priority order:

**The core sweep is complete.** Every page group originally in scope
(auth → dashboards → directory → arrivals) is localized, committed, and
verified. What follows is genuinely new scope or pre-ship QA, not
leftovers.

1. **Runtime verification in a real browser — the biggest open risk.**
   Everything to date is proven by `tsc`, `eslint`, and jsdom/RTL tests.
   Those confirm the *keys resolve*; they do **not** confirm the app looks
   right. Still unverified: the authenticated app in a live browser (the
   local backend has never been reachable this whole branch — Docker
   stopped, and `secrets.ts` reads only AWS Secrets Manager or a hardcoded
   `localhost:7687`), layout integrity with longer German/French strings
   (compound words overflowing buttons/table headers is the classic
   failure), and the PWA install-and-open cycle at a 375 px viewport.
2. **Native-speaker review of the greeting pool and organizational-level
   terms** (see the ⚠️ above) — should happen before this ships to real
   users. The 65×5 greeting translations carry biblical wordplay an LLM
   can plausibly get subtly wrong, and the `shared.churchLevel.*` terms
   were translated as ordinary words without explicit confirmation.
3. **Remaining page groups not in the original scope**: accounts, banking,
   reports. Yup schema messages and Apollo/notistack-surfaced errors are
   still English-only there — and note that a handful of shared
   error/validation strings surface on already-localized pages too.
4. **Backend-sourced strings** (still explicitly out of scope): if any
   generated PDF/report exports or SMS text ever need localizing, that's a
   distinct, later decision — not assumed by ADR-017.
5. **AI Assistant page** (`pages/ai-assistant/`, nav entry `/ai-assistant`,
   `navigation-config.tsx:135-139`) — deliberately deferred, needs its own
   design decision (translate the source corpus? generate in-language?
   translate output post-hoc?) before implementation. Two separate problems:
   UI chrome (straightforward `t()` pass) and AI-generated content itself
   (English-only corpus per ADR-015, a different kind of problem).
6. **Keep `kb/01-glossary.md`'s do-not-translate list in sync** as new
   coined terms or proper names enter the domain.
7. Optional later optimization: lazy-load only the active locale's JSON
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

**Backfilled (phase 3b):** `DisplayChurchDetails.test.tsx`,
`DetailsPages.test.tsx`, and `MemberGridPages.test.tsx` now cover all 15
previously untested source files. The focused run passed 6/6.

**New (phase 3d — quick-facts this-month, committed `1e009b93`, written
inline, no subagent):**
- `web-react-ts/src/pages/directory/quick-facts/this-month/{Bacenta,Campus,
  Council,Governorship,Stream}AvgWeekdayQuickFacts.test.tsx`
- `web-react-ts/src/pages/directory/quick-facts/this-month/QuickFactComparisonCard.test.tsx`

**Modified (phase 3d):**
- `web-react-ts/src/pages/directory/quick-facts/this-month/{Bacenta,Campus,
  Council,Governorship,Stream}AvgWeekdayQuickFacts.tsx`
- `web-react-ts/src/pages/directory/quick-facts/this-month/QuickFactComparisonCard.tsx`
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
  (`directory.quickFacts.avgWeekday.*`, `directory.quickFactComparisonCard.*`,
  `directory.leaderTitle.governorshipLeader` added)

Not touched (phase 3d, confirmed dead code): `web-react-ts/src/pages/directory/quick-facts/components/{AttendanceQuickFactsCard,BussingQuickFactsCard,IncomeQuickFactsCard,QuickFactsSlider,QuickFactsSelect}.tsx`, `quick-fact-utils.ts` — unreachable from any route, not worth translating.

**Modified/new (phase 3e — create/ + BacentaForm, committed `f5fb8b86`):**
- `web-react-ts/src/pages/directory/create/{CreateBacenta,CreateCampus,
  CreateCouncil,CreateGovernorship,CreateOversight,CreateStream,
  CreateMember}.tsx` + matching `.test.tsx` for each (new)
- `web-react-ts/src/pages/directory/reusable-forms/BacentaForm.tsx` +
  `BacentaForm.test.tsx` (new)
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json` (`directory.create.*`,
  `directory.createMember.*`, `directory.bacentaForm.*`,
  `directory.common.cancel` added)

**Modified/new (phase 3f — update/, committed `d59c8381`):**
- `web-react-ts/src/pages/directory/update/{UpdateBacenta,UpdateCampus,
  UpdateCouncil,UpdateGovernorship,UpdateOversight,UpdateStream,
  UpdateMember,MemberCollisionDialog,UpdateBusPaymentDialog}.tsx` +
  matching `.test.tsx` for each (new, except `UpdateMember.test.tsx`
  which already existed and was fixed — see 3f notes above)
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json` (`directory.update.*`,
  `directory.memberCollisionDialog.*`, `directory.updateBusPaymentDialog.*`,
  `directory.updateMember.*` added)

**Modified/new (phase 3g — user-profile, committed `ab70a8c7`):**
- `web-react-ts/src/pages/directory/user-profile/DisplayPage.tsx` +
  `DisplayPage.test.tsx` (new)
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
  (`directory.userProfile.*` added)

**Modified/new (phase 3h — church-history, committed `00123a7b`):**
- `web-react-ts/src/pages/directory/display/church-history/{ChurchHistoryView,
  BacentaHistory,CampusHistory,CouncilHistory,GovernorshipHistory,
  StreamHistory,MemberHistory}.tsx` + matching `.test.tsx` for each (new)
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
  (`directory.churchHistory.*` added)

**Modified/new (phase 3i — MemberForm, committed `f837815e`):**
- `web-react-ts/src/pages/directory/reusable-forms/MemberForm.tsx` +
  `MemberForm.test.tsx` (new)
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
  (`directory.memberForm.*` added)

**Modified/new (phase 3j — MemberDisplay, committed `516cf0fb`):**
- `web-react-ts/src/pages/directory/reusable-forms/MemberDisplay.tsx` +
  `MemberDisplay.test.tsx` (new)
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
  (`directory.memberDisplay.*` added, including the `vcard.*` sub-block)

**Modified/new (phases 3k + 4 — grids, arrivals, dashboards, test backfill;
all committed together in `e3d93ae7`):**
- `web-react-ts/src/components/members-grids/{MembersGrid,Filters}.tsx` +
  matching `.test.tsx` files (new).
  `MemberTable.tsx` deliberately untouched — no user-facing strings.
- `web-react-ts/src/pages/arrivals/` — 20 files:
  `{Arrivals,BacentaArrivals,BusFormDetails,BusVehicleFormDetails,
  DownloadArrivalsButton,PreMobilisationPicture}.tsx`,
  `arrival-payment-data/ArrivalsPaymentData.tsx`,
  `components/{ArrivalsDashboardMeta,live-feed}.tsx`,
  `countdown-component/{ExpiredNotice,ShowCounter}.tsx`,
  `pages-dashboards/Dashboard{Campus,Council,Governorship,Stream}.tsx`,
  `pages-forms/Form{AddVehicleRecord,AttendanceConfirmation,
  MobilisationSubmission,PayVehicleRecord}.tsx`
- `web-react-ts/src/pages/dashboards/{ArrivalsCounterDashboard,
  StreamTellerDashboard}.tsx` (completing the phase-2 gap)
- **Test backfill closing the `efe16a04` gap** (new):
  `components/DisplayChurchDetails/DisplayChurchDetails.test.tsx`,
  `pages/directory/display/DetailsPages.test.tsx`,
  `pages/directory/grids/MemberGridPages.test.tsx`
- `web-react-ts/src/locales/{en,fr,es,pt,de}.json`
  (`arrivals.*`, `directory.memberGrid.*`, `directory.memberFilters.*`
  added — 737 keys per file at close of sweep)
