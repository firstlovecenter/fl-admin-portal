# Testing — FL Admin Portal

How we test this codebase. Operational companion to [ADR-013](kb/06-adr.md#adr-013--test-stack-and-the-test-first-refactor-loop). Read this **before** writing or running a test.

The coverage backlog lives in the Jira epic **[SYN-62 — Testing strategy & coverage backlog](https://codefoundry.atlassian.net/browse/SYN-62)**. Pick a child ticket, follow this doc.

---

## Stacks

| Package | Runner | Notes |
| --- | --- | --- |
| `web-react-ts/` | Vitest 3 + React Testing Library + MSW + jsdom | Vite-native — no extra transformer. Apollo via `@apollo/client/testing` (submodule of `@apollo/client`, no extra install) for shallow tests; MSW for the network layer. `@testing-library/jest-dom/vitest` matchers (`toBeInTheDocument`, etc.) are wired in `src/test-utils/setup.ts`. |
| `api/` | Jest 29 + babel-jest | Reuses the production `babel.config.js`. **No ts-jest.** Tests use the same transformer as the build. **babel-jest strips types** — `tsc --noEmit` runs separately via lint-staged. A test with a type error will still execute; rely on the type-check step, not the test runner, to catch them. |

### Scripts per package

| Script | `web-react-ts/` | `api/` |
| --- | --- | --- |
| `test` | Vitest watch mode | full Jest suite |
| `test:run` | full Vitest suite, one-shot | — |
| `test:ui` | interactive Vitest UI | — |
| `test:coverage` | v8 coverage | Jest coverage |
| `test:integration` | — | gated; dev Neo4j only |

Do not introduce alternate runners or rename these scripts.

## Running

```sh
# Frontend
cd web-react-ts
npm run test:run                 # full suite, one-shot
npm run test:run -- AuthContext  # filter by filename pattern
npm run test:ui                  # interactive UI
npm run test:coverage            # v8 coverage report

# Backend
cd api
npm test                         # full unit suite
npm test -- permissions          # filter — Jest treats trailing positional args as a path regex
npm run test:coverage            # coverage
npm run test:integration         # gated; hits dev Neo4j
```

**Do not claim "tests pass" without running them — quote the runner output.** Lint-staged and the IDE may show false greens during heavy refactors.

## File layout

- Tests live **next to** the source: `foo.ts` → `foo.test.ts`. No `__tests__/` folders.
- A test file imports only from its sibling and from `web-react-ts/src/test-utils/` (existing — see `setup.ts`) or `api/src/test-utils/` (forward-looking — to be created with the first BE fixture; tracked by [SYN-63](https://codefoundry.atlassian.net/browse/SYN-63)).
- Cross-cutting fixtures (role tables, sample JWTs, canonical ServiceRecords) go in those `test-utils/` directories. Shared fixtures are how the ADR-001 permission mirror suite stays honest — one source of truth for both FE and BE. The shared scenario constant does not yet exist; building it is the first step in [SYN-63](https://codefoundry.atlassian.net/browse/SYN-63).

## What we test (priority order, per ADR-013 §4)

ADR-013 §4 names three priority surfaces — those are the floor. SM5/SM6 are tracked in the coverage backlog ([SYN-70](https://codefoundry.atlassian.net/browse/SYN-70), [SYN-71](https://codefoundry.atlassian.net/browse/SYN-71)) but are an extension, not an ADR-013 mandate.

1. **Permission helpers** — `web-react-ts/src/permission-utils.ts` ↔ `api/src/resolvers/permissions.ts` mirror. One scenario table, two suites.
2. **State machine invariants** — `kb/04-state-machines.md` SM1–SM4 (the ADR-013 §4 list):
   - SM1 — `ServiceRecord.transactionStatus` idempotency (ADR-005)
   - SM2 — banking proof transitions
   - SM3 — vacation handling
   - SM4 — servant slot transitions (ADR-006)
3. **Money math** — anything that adds, settles, or reconciles cedis or foreign-currency amounts on `ServiceRecord`, account expenses, or arrivals payments.

## What we do NOT test

- Trivial getters / DTO mappers.
- Pure presentational components.
- Auto-generated `@neo4j/graphql` resolvers — that's the library's contract, not ours.
- Snapshot tests of rendered Bootstrap markup — too brittle. (Tailwind/Shadcn snapshots: case-by-case, generally still avoid.)
- Old code stays untested **until it is refactored or extended** — then ADR-013's test-first loop kicks in. We do not backfill tests for unchanged code.

## The test-first refactor loop (mandatory)

Refactors **must** follow this order. Bug fixes and feature work do not — unless they touch a target that is also being refactored.

1. **Characterize** — write tests against the *current* behavior of the target. Tests pass on the current code, even if the code is ugly. Capture known bugs as `TODO` in the test; do not fix in the same change.
2. **Refactor** — change the implementation. Leave the test file untouched (renaming a public symbol is the only allowed edit during the refactor).
3. **Verify** — tests green, `tsc --noEmit` green, ESLint green.
4. **Review** — dispatch `code-reviewer` on the diff. `cypher-reviewer` and `security-reviewer` if their triggers fire.

Orchestrated by `/refactor`. The `refactor` agent **refuses to run** unless tests exist on the target.

## Test patterns

### Frontend — component with Apollo + Auth

```tsx
// example: web-react-ts/src/pages/services/RecordService.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import RecordService from './RecordService'
import { RECORD_SERVICE } from './services-queries'

const mocks = [
  {
    request: { query: RECORD_SERVICE, variables: { /* exact shape */ } },
    result: { data: { /* exact response */ } },
  },
]

describe('RecordService form', () => {
  it('refuses negative amounts client-side', async () => {
    render(
      <MemoryRouter>
        <MockedProvider mocks={mocks}>
          <RecordService />
        </MockedProvider>
      </MemoryRouter>
    )
    await userEvent.type(screen.getByLabelText(/cash/i), '-100')
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/cannot be negative/i)).toBeInTheDocument()
  })
})
```

### Frontend — network layer with MSW

```ts
// web-react-ts/src/test-utils/msw-server.ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(
  http.post('http://localhost:4001/graphql', () =>
    HttpResponse.json({ data: { /* … */ } })
  ),
)
```

Use MSW (not `MockedProvider`) when the test exercises the retry link, error link, or auth header. `MockedProvider` short-circuits the link chain.

### Backend — resolver with neo4j-driver mock

Illustrative only — the exact shape of args, params, and the Cypher template differs per resolver. Ground your test in the real resolver you are testing (e.g. `api/src/resolvers/services/service-resolvers.ts` exports `serviceMutation` whose `RecordService` key takes `{ churchId, serviceDate, attendance, income, foreignCurrency, … }`).

```ts
// api/src/resolvers/services/service-resolvers.test.ts
import serviceMutation from './service-resolvers'

const mockSession = () => {
  const tx = {
    run: jest.fn().mockResolvedValue({
      records: [{ get: jest.fn().mockReturnValue({ id: 'sr-1', income: 200 }) }],
    }),
  }
  return {
    executeRead: jest.fn(async (cb: (tx: typeof tx) => unknown) => cb(tx)),
    executeWrite: jest.fn(async (cb: (tx: typeof tx) => unknown) => cb(tx)),
    close: jest.fn(),
    _tx: tx,
  }
}

describe('serviceMutation.RecordService', () => {
  it('issues parameterised Cypher with the call args', async () => {
    const session = mockSession()
    const context = {
      executionContext: { session: () => session },
      jwt: { roles: ['leaderBacenta'], sub: 'mem-1' },
    }
    await serviceMutation.RecordService(null, {
      churchId: 'ch-1',
      serviceDate: '2026-05-10',
      attendance: 42,
      income: 200,
      foreignCurrency: '',
      numberOfTithers: 5,
      treasurers: ['mem-2'],
      treasurerSelfie: 'https://…',
      familyPicture: 'https://…',
    }, context)

    // Parameterised — never assert on interpolated values
    expect(session._tx.run).toHaveBeenCalledWith(
      expect.stringContaining('$churchId'),
      expect.objectContaining({ churchId: 'ch-1', income: 200 })
    )
  })
})
```

Two non-negotiables:
- **Parameterised Cypher only.** Assertions look for `$paramName` substrings *and* an `objectContaining` for the params object. ADR-012.
- **`isAuth` is the first call.** Add a negative test: a context with a wrong role array must throw and must not reach `session.run`.

### Backend — multi-step Cypher via dev Neo4j

When unit-mocking the driver doesn't give confidence (e.g., aggregation logic, multi-step `MERGE` paths), write an integration test gated under `npm run test:integration`. These hit **dev Neo4j only** (the `neo4j` MCP server / `dev-neo4j.firstlovecenter.com`). **Never** target production data.

```ts
// foo.integration.test.ts
import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  process.env.NEO4J_URI ?? 'bolt://localhost:7687',
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
)

beforeAll(/* seed dev fixtures */)
afterAll(() => driver.close())
```

## Mirror suites — keeping FE/BE in lockstep (ADR-001)

The permission helpers exist in two places. The target state is a single shared scenario table that both `permission-utils.test.ts` and `permissions.test.ts` import — building it is the first step in [SYN-63](https://codefoundry.atlassian.net/browse/SYN-63). Today each file owns its own assertions.

Once the shared table lands, adding a role looks like:

1. Add the role to both `permission-utils.ts` and `permissions.ts` (ADR-001).
2. Add one entry to the shared scenario constant.
3. Both suites pick up the new case automatically. A one-sided edit fails the mirror test.

## Coverage policy

Coverage is reported per-PR but is **not a merge gate** (ADR-013 §7). A "100% covered" file with assertion-free tests is worse than 60% with sharp assertions. Reviewers look at coverage to understand *what was exercised*, not to clear a threshold.

## CI

**Not yet live.** Today there is no CI test job — `.github/workflows/` only runs deploy workflows. The target state, tracked by [SYN-83](https://codefoundry.atlassian.net/browse/SYN-83), is GitHub Actions jobs `test-frontend` and `test-backend` running on every PR, with `test:integration` on manual dispatch. Until SYN-83 lands, run the suites locally before pushing and quote the output in the PR description.

AWS Amplify continues to handle the FE build; it does not and will not run tests.

## E2E

Today: the **`e2e-tester` Claude Code agent** drives Chrome DevTools MCP against the dev server using role-matched accounts from [`kb/07-test-accounts.md`](kb/07-test-accounts.md). This is per-PR exploratory verification, not a regression net.

A complementary Playwright suite for canonical flows (W1, W4, W5) is under decision in **SYN-84**.

## Adding a test — checklist

- [ ] Test file is `*.test.ts` / `*.test.tsx` next to the source.
- [ ] Import paths are absolute from `src/` (ADR-009). No `../../../`.
- [ ] Frontend test uses `MockedProvider` (shallow) or MSW (link layer), not both for the same case.
- [ ] Backend test asserts the Cypher *contains* its expected fragments and the *exact params* — not a snapshot of the full string.
- [ ] Backend test asserts `isAuth` is enforced (negative test for an unauthorised role).
- [ ] Test name references the SM/W/ADR it pins (e.g., "SM1: re-delivered webhook does not double-credit").
- [ ] You ran the test and pasted the output in the PR description.

## Common pitfalls

- **Don't mock `permission-utils.ts` / `permissions.ts`.** They are the system under test, not a dependency. Pass real role arrays.
- **Don't snapshot Bootstrap markup.** Use semantic queries (`getByRole`, `getByLabelText`). Bootstrap is being migrated to Tailwind/Shadcn — snapshots rot at deploy speed.
- **Don't share Neo4j sessions across `await`s** in test fixtures any more than in production code. The "test passed locally, failed in CI" bug is almost always a session leak (root `CLAUDE.md` "Sessions").
- **Don't write tests that depend on `Date.now()` without faking time** — `vi.useFakeTimers()` on FE, `jest.useFakeTimers()` on BE. The Sabbath gate and weekly aggregates are date-sensitive.
- **Don't trust `args.roles` in a test fixture.** Build the context from a real-shaped JWT (`{ jwt: { roles: [...], sub: '...' } }`). Server-side trust boundary lives there.

## References

- [`kb/06-adr.md` — ADR-013](kb/06-adr.md#adr-013--test-stack-and-the-test-first-refactor-loop) (test stack & loop)
- [`kb/06-adr.md` — ADR-001](kb/06-adr.md#adr-001--permission-helpers-are-duplicated-frontendbackend) (duplicated permission helpers)
- [`kb/03-workflows.md`](kb/03-workflows.md) (W1–W8)
- [`kb/04-state-machines.md`](kb/04-state-machines.md) (SM1–SM8)
- [`kb/07-test-accounts.md`](kb/07-test-accounts.md) (e2e credentials)
- [`SYN-62`](https://codefoundry.atlassian.net/browse/SYN-62) — coverage backlog
