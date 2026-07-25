/**
 * Tests for the i18n conversion of UpdateBusPaymentDialog.tsx.
 *
 * Every hardcoded string moved to `t('directory.updateBusPaymentDialog.*')`
 * (dialog title, field labels/placeholders, Cancel button, verify-number
 * sub-dialog). `throwToSentry(...)` calls are left as raw English literals
 * (Sentry diagnostics aren't user-facing — established precedent). The
 * `alertMsg`/`alertSuccess` calls in `handleVerify` ARE user-facing toasts
 * and were translated, but aren't exercised here — they only fire after a
 * full OTP round-trip through `SendMobileVerificationNumber` /
 * `UpdateBusPaymentDetails`, which is disproportionate scaffolding for an
 * i18n-only change; this file focuses on what actually changed (labels).
 *
 * `currentUser.id` matches the mocked bacenta's `leader.id` and
 * `currentUser.roles` includes `adminCampus` so both `RoleView`-gated
 * sections (urvan/sprinter/outbound admin fields, and the leader-only
 * momo fields) render in the same pass.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { DISPLAY_BACENTA_BUSSING_DETAILS } from './UpdateBacentaArrivals'
import UpdateBusPaymentDialog from './UpdateBusPaymentDialog'

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

const BACENTA_ID = 'bacenta-1'
const LEADER_ID = 'leader-1'

const churchContextValue = { bacentaId: BACENTA_ID }
const memberContextValue = {
  currentUser: {
    id: LEADER_ID,
    roles: ['adminCampus', 'leaderBacenta'],
    currency: 'GHS',
  },
}

const bussingDetailsMock: MockedResponse = {
  request: {
    query: DISPLAY_BACENTA_BUSSING_DETAILS,
    variables: { id: BACENTA_ID },
  },
  result: {
    data: {
      bacentas: [
        {
          id: BACENTA_ID,
          name: 'Kaneshie Bacenta',
          leader: { id: LEADER_ID, firstName: 'Kwame' },
          sprinterTopUp: 0,
          urvanTopUp: 0,
          outbound: true,
          vacationStatus: 'Active',
          momoName: '',
          momoNumber: '',
          mobileNetwork: '',
        },
      ],
    },
  },
}

function renderDialog() {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={[bussingDetailsMock]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <UpdateBusPaymentDialog open onOpenChange={() => {}} />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('UpdateBusPaymentDialog i18n', () => {
  it('renders the English dialog title, field labels, and Cancel button once the query resolves', async () => {
    renderDialog()

    expect(
      await screen.findByText('Bus Payment Details')
    ).toBeInTheDocument()
    expect(
      await screen.findByLabelText('Urvan Church Top Up (One Way)')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Sprinter Church Top Up (One Way)')
    ).toBeInTheDocument()
    expect(screen.getByText('Are They Bussing Back?')).toBeInTheDocument()
    expect(screen.getByLabelText('MoMo Number')).toHaveAttribute(
      'placeholder',
      'Enter a number'
    )
    expect(screen.getByLabelText('MoMo Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('re-renders the dialog title and field labels in French', async () => {
    await i18n.changeLanguage('fr')
    renderDialog()

    expect(
      await screen.findByText('Détails du paiement du bus')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText("Recharge Urvan de l'église (aller simple)")
    ).toBeInTheDocument()
    expect(screen.getByText('Font-ils le trajet retour ?')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Annuler' })
    ).toBeInTheDocument()
  })
})
