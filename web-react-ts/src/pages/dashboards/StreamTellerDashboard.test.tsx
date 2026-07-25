/**
 * Regression test for the `firstName` fallback change in
 * StreamTellerDashboard.tsx.
 *
 * When `currentUser.fullName` is absent, `firstName` used to fall back to the
 * hardcoded English literal `'there'`. It now falls back to
 * `t('dashboard.greetings.fallbackName')` so the shared `useHourlyGreeting`
 * hook (dashboard-shared.tsx, already translation-aware) never splices an
 * untranslated English word into a non-English greeting — *if and when* that
 * greeting text is ever displayed.
 *
 * TODO(refactor): identical finding to `ArrivalsCounterDashboard.test.tsx` —
 * this fallback branch is currently unreachable in the rendered UI.
 * `isLoading` is computed as `!currentUser?.fullName`, the exact same falsy
 * check that triggers the `firstName` fallback, so whenever `firstName`
 * would need the translated fallback, the header is still showing its
 * loading `<Skeleton>` instead of `highlightName(greeting, firstName)`.
 * Verified experimentally: with `fullName` undefined, `heading.textContent`
 * is the empty string in both languages. See the sibling test file for the
 * full writeup; not fixed here per the test-author contract.
 *
 * This file characterizes the ACTUAL current behavior — no visible name
 * text, in either language, while `fullName` is absent — and additionally
 * locks in the translation lookup itself so a future regression that reverts
 * the fallback to the literal `'there'` still gets caught the moment the
 * `isLoading` coupling above is fixed and the branch becomes reachable.
 *
 * Heavy dependencies are mocked:
 *  - `contexts/ChurchRoleScopeContext`'s `useChurchRoleScope` is mocked with
 *    no selected scope / no role options, so `ChurchRoleScopePicker` does not
 *    render.
 *  - `useQuery(STREAM_BANKING_DEFAULTERS_THIS_WEEK)` is satisfied by wrapping
 *    in `MockedProvider` with no mocks — with no selected scope,
 *    `selectedScope?.churchId` is undefined so the query's `skip` condition
 *    is true and no network mock is required (same pattern as
 *    `UserDashboard.test.tsx`'s skipped `WeeklyTipCard` query).
 *  - `MemberContext` is supplied via its real `.Provider` with
 *    `currentUser.fullName` unset and `userJobs: []` (so
 *    `resolveChurchFromUserJobs` short-circuits to `null`).
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { MemberContext } from 'contexts/MemberContext'
import StreamTellerDashboard from './StreamTellerDashboard'

vi.mock('contexts/ChurchRoleScopeContext', () => ({
  useChurchRoleScope: vi.fn(() => ({
    selectedScope: undefined,
    roleChurchOptions: [],
    selectedScopeKey: '',
    setSelectedScopeKey: vi.fn(),
  })),
}))

const memberContextValueNoFullName = {
  currentUser: { id: 'user-1', fullName: undefined, roles: [] as string[] },
  userJobs: [],
  setCurrentUser: vi.fn(),
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <MockedProvider mocks={[]}>
        <MemberContext.Provider value={memberContextValueNoFullName}>
          <StreamTellerDashboard />
        </MemberContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('StreamTellerDashboard fallback name i18n', () => {
  afterEach(async () => {
    cleanup()
    await i18n.changeLanguage('en')
  })

  it('never renders the untranslated English fallback "there" in the greeting heading while fullName is absent (French)', async () => {
    await i18n.changeLanguage('fr')

    renderDashboard()

    const heading = await screen.findByRole('heading', { level: 1 })
    // Current behavior: the loading gate keeps the heading empty (no
    // greeting text at all) while fullName is absent — see file header.
    expect(heading.textContent).toBe('')
    expect(heading.textContent).not.toMatch(/\bthere\b/i)
  })

  it('never renders the untranslated English fallback "there" in the greeting heading while fullName is absent (English)', async () => {
    renderDashboard()

    const heading = await screen.findByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('')
  })

  it('resolves the dashboard.greetings.fallbackName key to a non-English string in French (guards a future revert to the literal)', async () => {
    expect(i18n.t('dashboard.greetings.fallbackName')).toBe('there')

    await i18n.changeLanguage('fr')

    expect(i18n.t('dashboard.greetings.fallbackName')).toBe("l'ami")
    expect(i18n.t('dashboard.greetings.fallbackName')).not.toBe('there')
  })
})
