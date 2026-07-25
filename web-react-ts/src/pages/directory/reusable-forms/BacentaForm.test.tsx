/**
 * Tests for the i18n conversion of BacentaForm.tsx.
 *
 * This form was missed in the earlier reusable-forms i18n pass (which
 * covered Denomination/Governorship/Council/Stream/Campus/Oversight) —
 * caught while localizing CreateBacenta.tsx, which renders this form.
 * Unlike those six forms, BacentaForm.tsx is already fully Tailwind (no
 * Bootstrap markup to preserve), so this is a normal `t()`-wrapping pass.
 *
 * Same mocking approach as GovernorshipForm.test.tsx:
 *  - `contexts/AuthContext`'s `useAuth` is mocked to `isAuthenticated: true`
 *    (RoleView/useAuth need this).
 *  - `MemberContext` supplies `currentUser.roles: ['adminDenomination']` —
 *    a member of every `permitAdminArrivals(churchLevel)` list, so the
 *    role-gated Leadership and Quick actions sections render.
 *  - `ChurchContext` is not needed directly by this component (it's not
 *    read here), so it's omitted.
 *  - `SearchMember` (cmdk-based) needs `ResizeObserver`, stubbed in
 *    `beforeAll`, matching other reusable-forms tests.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import BacentaForm, { BacentaFormValues } from './BacentaForm'

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

const churchContextValue = { bacentaId: 'bacenta-1' }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

const initialValues: BacentaFormValues = {
  name: 'Kaneshie',
  leaderName: 'Kwame Owusu',
  leaderId: 'leader-1',
  leaderEmail: 'kwame@example.com',
  governorship: undefined,
  vacationStatus: 'Active',
  meetingDay: 'Thursday',
  venueLatitude: '0.0',
  venueLongitude: '0.0',
}

function renderForm(values: BacentaFormValues = initialValues) {
  return render(
    <MemoryRouter initialEntries={['/bacenta/create']}>
      <MockedProvider mocks={[]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <BacentaForm
              initialValues={values}
              onSubmit={vi.fn()}
              title="Start a New Bacenta"
            />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('BacentaForm i18n', () => {
  it('renders the default English heading, section titles, and field labels', () => {
    renderForm()

    expect(
      screen.getByRole('heading', { name: 'Kaneshie Bacenta' })
    ).toBeInTheDocument()
    expect(screen.getByText('Bacenta Details')).toBeInTheDocument()
    expect(screen.getByText('Name, status, and meeting day')).toBeInTheDocument()
    expect(screen.getByLabelText('Name of Bacenta')).toHaveValue('Kaneshie')
    expect(screen.getByText('Leadership')).toBeInTheDocument()
    expect(screen.getByText('Select a Leader')).toBeInTheDocument()
    expect(screen.getByText('Service Venue')).toBeInTheDocument()
    expect(screen.getByLabelText('Latitude')).toBeInTheDocument()
    expect(screen.getByText('Current status')).toBeInTheDocument()
    expect(
      screen.getByText('Active — a service record is expected each week.')
    ).toBeInTheDocument()
    expect(screen.getByText('Quick actions')).toBeInTheDocument()
    expect(screen.getByText('Edit Bussing Details')).toBeInTheDocument()
    expect(screen.getByText('About this form')).toBeInTheDocument()
  })

  it('shows the "New Bacenta" heading when there is no existing name', () => {
    renderForm({ ...initialValues, name: '' })

    expect(screen.getByRole('heading', { name: 'New Bacenta' })).toBeInTheDocument()
  })

  it('re-renders the heading, section titles, and field labels in French', async () => {
    renderForm()

    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', { name: 'Kaneshie Bacenta' })
    ).toBeInTheDocument()
    expect(screen.getByText('Détails du Bacenta')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du Bacenta')).toHaveValue('Kaneshie')
    expect(screen.getByText('Responsables')).toBeInTheDocument()
    expect(screen.getByText('Sélectionner un responsable')).toBeInTheDocument()
    expect(screen.getByText('Lieu du culte')).toBeInTheDocument()
    expect(
      screen.getByText('Actif — un compte rendu de culte est attendu chaque semaine.')
    ).toBeInTheDocument()
  })
})
