/**
 * Regression test for the `firstName` fallback change in
 * ArrivalsCounterDashboard.tsx.
 *
 * When `currentUser.fullName` is absent, `firstName` used to fall back to the
 * hardcoded English literal `'there'`. It now falls back to
 * `t('dashboard.greetings.fallbackName')` so the shared `useHourlyGreeting`
 * hook (dashboard-shared.tsx, already translation-aware) never splices an
 * untranslated English word into a non-English greeting — *if and when* that
 * greeting text is ever displayed.
 *
 * TODO(refactor): as written, this fallback branch is currently unreachable
 * in the rendered UI. `isLoading` is computed as `!currentUser?.fullName` —
 * the exact same falsy check that triggers the `firstName` fallback — so
 * whenever `firstName` would need the translated fallback, the header is
 * still showing its loading `<Skeleton>` instead of `highlightName(greeting,
 * firstName)`. The fallback value is computed (and flows into the
 * `useHourlyGreeting` hash) but never rendered. This means the underlying
 * literal-vs-`t()` bug the fallback change fixes cannot be observed via a
 * component render today — verified experimentally: with `fullName`
 * undefined, `heading.textContent` is the empty string in both languages,
 * skeleton only. Decoupling `isLoading` from the fullName-presence check
 * (e.g. an explicit `loading` flag from `MemberContext`) would be needed
 * before this fallback text can ever reach the DOM and be characterized
 * directly. Filed as a finding, not fixed here per the test-author contract.
 *
 * Given that, this file characterizes the ACTUAL current behavior — no
 * visible name text, in either language, while `fullName` is absent — and
 * additionally locks in the translation lookup itself (`i18n.t(
 * 'dashboard.greetings.fallbackName')`) so a future regression that reverts
 * the fallback to the literal `'there'` still gets caught the moment the
 * `isLoading` coupling above is fixed and the branch becomes reachable.
 *
 * Heavy dependencies are mocked:
 *  - `./useComponentQuery` is mocked (same pattern as `UserDashboard.test.tsx`)
 *    to skip its internal `useLazyQuery` fan-out.
 *  - `contexts/ChurchRoleScopeContext`'s `useChurchRoleScope` is mocked with
 *    no selected scope / no role options, so `ChurchRoleScopePicker` does not
 *    render and no scope-dependent Apollo call is needed.
 *  - `MemberContext` is supplied via its real `.Provider` with
 *    `currentUser.fullName` unset.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { MemberContext } from 'contexts/MemberContext'
import ArrivalsCounterDashboard from './ArrivalsCounterDashboard'

vi.mock('./useComponentQuery', () => ({
  default: vi.fn(() => ({ assessmentChurch: undefined })),
}))

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
      <MemberContext.Provider value={memberContextValueNoFullName}>
        <ArrivalsCounterDashboard />
      </MemberContext.Provider>
    </MemoryRouter>
  )
}

describe('ArrivalsCounterDashboard fallback name i18n', () => {
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
