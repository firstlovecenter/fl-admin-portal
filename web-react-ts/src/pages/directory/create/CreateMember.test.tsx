/**
 * Tests for the i18n conversion of CreateMember.tsx.
 *
 * Only the "member already exists" AlertDialog (title, interpolated
 * message, Cancel/Request Member buttons) was translated here —
 * `MemberForm.tsx` itself (rendered by this page, 620 lines) still has its
 * own untranslated strings and is out of scope for this pass (tracked
 * separately in plan.md). Driving the dialog open requires a full form
 * submission through MemberForm's own Yup-validated fields (first/last
 * name, gender, phone, dob, marital status, bacenta search, etc.), which is
 * disproportionate scaffolding for exercising 4 strings — so this file
 * verifies:
 *  1. The page renders without the dialog open (smoke test — confirms
 *     CreateMember + MemberForm mount cleanly with the new `useTranslation`
 *     import and no missing context).
 *  2. The new translation keys resolve correctly in English and French,
 *     including the `{{error}}` interpolation in the dialog message —
 *     matches the pattern already used elsewhere in this branch (e.g.
 *     ArrivalsCounterDashboard.test.tsx's direct `i18n.t(...)` key-guard
 *     tests) for cases where full-render coverage isn't practical.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import CreateMember from './CreateMember'

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

const churchContextValue = { clickCard: vi.fn(), bacentaId: 'bacenta-1' }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/member/create']}>
      <MockedProvider mocks={[]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <CreateMember />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('CreateMember i18n', () => {
  it('renders the page without the duplicate-member dialog open', () => {
    renderPage()

    expect(
      screen.queryByText('Member already exists')
    ).not.toBeInTheDocument()
  })

  it('resolves the duplicate-dialog translation keys in English', () => {
    expect(i18n.t('directory.createMember.duplicateDialogTitle')).toBe(
      'Member already exists'
    )
    expect(
      i18n.t('directory.createMember.duplicateDialogMessage', {
        error: 'Error: email already in use',
      })
    ).toBe(
      'There was an error creating the member profile\nError: email already in use\n\nWould you like to request for the member?'
    )
    expect(i18n.t('directory.createMember.requestMember')).toBe(
      'Request Member'
    )
    expect(i18n.t('directory.common.cancel')).toBe('Cancel')
  })

  it('resolves the duplicate-dialog translation keys in French', async () => {
    await i18n.changeLanguage('fr')

    expect(i18n.t('directory.createMember.duplicateDialogTitle')).toBe(
      'Le membre existe déjà'
    )
    expect(
      i18n.t('directory.createMember.duplicateDialogMessage', {
        error: 'Error: email already in use',
      })
    ).toBe(
      "Une erreur s'est produite lors de la création du profil du membre\nError: email already in use\n\nSouhaitez-vous faire une demande pour ce membre ?"
    )
    expect(i18n.t('directory.createMember.requestMember')).toBe(
      'Demander le membre'
    )
    expect(i18n.t('directory.common.cancel')).toBe('Annuler')
  })
})
