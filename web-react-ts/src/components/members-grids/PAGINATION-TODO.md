# Members Grid + Download — Pagination TODO

This is a follow-up to the in-grid Download Membership modal. The grid and the
download both pull the **entire** member collection in a single GraphQL
request and apply filters in JavaScript. That works at Bacenta scale
(tens — low hundreds of members) but degrades at higher church levels and
makes the bundle, the network, and the DOM all do unnecessary work.

## Why this matters

| Surface | Query | Approx upper bound |
| --- | --- | --- |
| `MembersGrid` | `GET_<LEVEL>_MEMBERS` | full `members` collection for the level |
| Download modal | `DISPLAY_<LEVEL>_MEMBERSHIP` (`downloadMembership`) | full collection again, with extra columns |

At Council / Stream / Campus / Oversight scope the same person can be returned
across thousands of nodes in one payload. We then `memberFilter()` over the
whole array client-side. The Apollo cache holds two large overlapping
collections per church.

## Recommended order of work

1. **Server-side pagination on the grid query.** `@neo4j/graphql` exposes
   `options: { limit, offset, sort }` on every collection field. Add it to
   `GET_<LEVEL>_MEMBERS` and surface a "Load more" / cursor pattern in
   `MemberTable`.
2. **Server-side filter pushdown.** `gender`, `maritalStatus`, `leaderRank`,
   `leaderTitle`, `basonta`, name search → translate into `where:` clauses on
   the SDL collection so Cypher does the filtering, not
   `member-filter-utils.js`. This is the single biggest perf win and unblocks
   step 3.
3. **Virtualised rendering.** `@tanstack/react-virtual` over `MemberTable`
   once the array is bounded by pagination. Today we render every node into
   the DOM.
4. **Streamed / paged CSV export.** Once the server supports filtered paging,
   the download modal can request pages and stream rows into a CSV writer
   (`papaparse` or a `WritableStream`) instead of loading everything into
   memory and handing it to `react-csv`. This keeps mobile devices from OOMing
   on the Campus-level export.
5. **Aggregate count.** Add a `memberCount` (already on `Church` for some
   levels) aware of the active filter set so the UI can show
   `123 of 4,200 members` without fetching the rest.

## Risks / dependencies

- Filter pushdown requires touching `member-filter-utils.js` and the
  permission-aware leadership filters (`leadsBacenta`, `isAdminForCouncil`,
  …). These currently rely on relationship existence, which is straightforward
  to express via `where: { leadsBacenta_SOME: {} }` — but every shape change
  must be regression-tested per role.
- The download CSV today is consistent with what's on screen because both run
  the same JS filter. After pushdown, the CSV must use the same `where`
  variables as the grid query so the two stay in lockstep.
- `MembersGrid` is shared by 11 host pages. Any prop / query contract change
  must land in one PR.
- `react-csv` builds the file in memory. For >50k rows we should switch
  before paging is added, otherwise paged loads still terminate in a
  single in-memory CSV blob.

## Out of scope for this TODO

- Cursor-based vs. offset-based pagination — pick when implementing; offset
  is fine until we exceed ~10k results.
- Saved filter sets / shareable filter URLs.
- Per-column sort in the grid.
