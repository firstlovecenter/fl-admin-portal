/**
 * Tests for the i18n conversion of DenominationForm.tsx.
 *
 * Every hardcoded English string in this form moved to
 * `t('directory.denominationForm.*')` / `t('shared.churchLevel.*')`. No
 * markup, layout, or business logic changed — this file covers the i18n
 * wiring (default English render + French re-render), not a full
 * characterization of Formik/Yup validation or the (untouched) `onSubmit`
 * contract.
 *
 * Heavy dependencies are mocked/minimal:
 *  - `contexts/AuthContext`'s `useAuth` is mocked to `isAuthenticated: true`
 *    (matching `ServantsDashboard.test.tsx` / `UpdateMember.test.tsx`) so
 *    `HeadingPrimary` / `HeadingSecondary` / `Input` / `Select`'s
 *    `PlaceholderCustom` loading-skeleton gate renders its real children
 *    instead of a skeleton, and so `RoleView`'s `isAuthorised` guard can
 *    pass.
 *  - `MemberContext` supplies `currentUser.roles: ['fishers']` so the
 *    `RoleView roles={['fishers']}`-gated leader search renders.
 *  - `SearchMember` fires a debounced (`DEBOUNCE_TIMER`) `useLazyQuery` on
 *    mount; no test here waits past that debounce, so no network mock is
 *    required — `MockedProvider` is present only so the Apollo hook has a
 *    client to bind to (same reasoning as `UserDashboard.test.tsx`'s
 *    `WeeklyTipCard`).
 *  - `SearchMember`'s underlying combobox is `cmdk`-based and needs
 *    `ResizeObserver`, which jsdom does not implement — stubbed in
 *    `beforeAll`, matching `UpdateMember.test.tsx`.
 *
 * `title` is an opaque prop (already translated by the caller, e.g.
 * `UpdateDenomination.tsx` — see `UpdateDenomination.test.tsx` for that
 * i18n key). This file does not assert i18n behavior on `title` itself,
 * only that it renders.
 *
 * NOTE (pre-existing, out of scope): the leader field's `<Label
 * htmlFor="leaderId">` never actually associates with its `cmdk` input —
 * `SearchCombobox` (an untouched shared component, not one of the 8 i18n
 * targets) passes `id={inputId}` to `CommandPrimitive.Input`, but `cmdk`
 * generates its own `id` internally and the rendered `<input>` ends up with
 * a `radix-:r_:`-style id instead. `getByLabelText` therefore cannot find
 * this field; the label text is asserted with `getByText` instead. Flagged
 * to the user, not fixed here (out of scope for this i18n-only PR).
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { MemberContext } from 'contexts/MemberContext'
import type { Oversight } from 'global-types'
import DenominationForm, { DenominationFormValues } from './DenominationForm'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}

    unobserve() {}

    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).ResizeObserver = ResizeObserverStub
})

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['fishers'] },
}

const withOversights: DenominationFormValues = {
  name: 'First Love',
  leaderName: 'Kwame Owusu',
  leaderId: 'leader-1',
  leaderEmail: 'kwame@example.com',
  adminId: '',
  oversights: [
    { id: 'oversight-1', name: 'Tema' } as unknown as Oversight,
  ],
}

const noOversights: DenominationFormValues = {
  ...withOversights,
  oversights: [''] as unknown as Oversight[],
}

function renderForm(initialValues: DenominationFormValues) {
  return render(
    <MockedProvider mocks={[]}>
      <MemberContext.Provider value={memberContextValue}>
        <DenominationForm
          initialValues={initialValues}
          onSubmit={vi.fn()}
          title="Update Denomination Form"
          newDenomination={false}
        />
      </MemberContext.Provider>
    </MockedProvider>
  )
}

describe('DenominationForm i18n', () => {
  it('renders the default English heading, labels, and oversight list', () => {
    renderForm(withOversights)

    expect(
      screen.getByRole('heading', { name: 'Update Denomination Form' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'First Love Denomination' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name of Denomination')).toHaveValue(
      'First Love'
    )
    expect(screen.getByText('Choose a Leader')).toBeInTheDocument()
    expect(screen.getByText('Oversights')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Tema Oversight' })
    ).toBeInTheDocument()
  })

  it('renders the "No Oversights" fallback when the oversights list is empty', () => {
    renderForm(noOversights)

    expect(screen.getByText('No Oversights')).toBeInTheDocument()
  })

  it('re-renders the heading, labels, and oversight list in French', async () => {
    renderForm(withOversights)

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', { name: 'First Love Dénomination' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nom de la dénomination')).toHaveValue(
      'First Love'
    )
    expect(screen.getByText('Choisir un responsable')).toBeInTheDocument()
    expect(screen.getByText('Supervisions')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Tema Supervision' })
    ).toBeInTheDocument()
  })

  it('renders the "No Oversights" fallback translated in French', async () => {
    renderForm(noOversights)

    await i18n.changeLanguage('fr')

    expect(await screen.findByText('Aucune supervision')).toBeInTheDocument()
  })
})
