/**
 * Tests for the i18n conversion of UpdateDenomination.tsx.
 *
 * Every hardcoded English string this page owns moved to
 * `t('directory.updateDenomination.*')`: the form title passed into
 * `<DenominationForm title={...} />`, the leader-changed success toast, and
 * the two `throwToSentry(...)` error-toast messages. The underlying
 * mutation sequence (`UpdateDenomination` -> optional `LogDenominationHistory`
 * -> optional `MakeDenominationLeader`) is untouched business logic.
 *
 * `MockedProvider` is configured with `defaultOptions.mutate.errorPolicy:
 * 'all'`, mirroring `lib/createApolloClient.tsx`'s real prod configuration
 * (see the same setup in `UpdateMember.test.tsx`). Under that policy a
 * GraphQL error surfaces on `result.errors` rather than rejecting the
 * mutate() promise — this file's error-toast tests therefore use a
 * network-level `error:` mock (which *does* reject regardless of
 * errorPolicy) to legitimately exercise the `catch` blocks around
 * `UpdateDenomination(...)` and `MakeDenominationLeader(...)`, matching how
 * these catches can actually fire in production.
 *
 * NOTE (found while writing this file, out of scope — not fixed):
 * `onSubmit`'s outer `try { await UpdateDenomination(...) } catch` never
 * inspects `updateResult.errors`, unlike the fixed `UpdateMember.tsx`
 * (SYN-205). Under the real `errorPolicy: 'all'` default, a GraphQL error
 * on the name-update mutation would resolve (not reject) and fall through
 * as if it succeeded — the same bug class as SYN-205, left unfixed here.
 * This is pre-existing business logic, unrelated to the i18n change;
 * flagged to the user rather than silently patched.
 *
 * Heavy dependencies:
 *  - `contexts/AuthContext`'s `useAuth` is mocked to `isAuthenticated: true`
 *    (see `DenominationForm.test.tsx`).
 *  - `sonner`'s `toast` is mocked so `alertSuccess` / `throwToSentry`'s
 *    `toast.success` / `toast.error` calls land on spies (matching
 *    `UpdateMember.test.tsx`).
 *  - `ResizeObserver` is stubbed for the `cmdk`-based leader search.
 *  - The leader-change tests drive `SearchMember`'s real debounced
 *    (`DEBOUNCE_TIMER` = 500ms) search-and-select flow with real timers,
 *    the same pattern as `UpdateMember.test.tsx`'s
 *    `selectBacentaFromDropdown`.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { toast } from 'sonner'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { DISPLAY_DENOMINATION } from 'pages/directory/display/ReadQueries'
import { UPDATE_DENOMINATION_MUTATION } from 'pages/directory/update/UpdateMutations'
import { MAKE_DENOMINATION_LEADER } from 'pages/directory/update/ChangeLeaderMutations'
import { GET_DENOMINATION_OVERSIGHTS } from 'queries/ListQueries'
import { MEMBER_MEMBER_SEARCH } from 'components/formik/SearchMemberQueries'
import UpdateDenomination from './UpdateDenomination'

vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
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
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})

const DENOMINATION_ID = 'denom-1'
const USER_ID = 'user-1'
const OLD_LEADER_ID = 'leader-1'
const NEW_LEADER_ID = 'leader-2'

const churchContextValue = { denominationId: DENOMINATION_ID }
const memberContextValue = {
  currentUser: { id: USER_ID, roles: ['fishers'] },
}

const displayDenominationMock: MockedResponse = {
  request: { query: DISPLAY_DENOMINATION, variables: { id: DENOMINATION_ID } },
  result: {
    data: {
      denominations: [
        {
          id: DENOMINATION_ID,
          name: 'First Love',
          campusCount: 0,
          streamCount: 0,
          councilCount: 0,
          governorshipCount: 0,
          bacentaCount: 0,
          vacationBacentaCount: 0,
          memberCount: 0,
          pastorCount: 0,
          oversights: [],
          admin: null,
          leader: {
            id: OLD_LEADER_ID,
            firstName: 'Kwame',
            lastName: 'Owusu',
            fullName: 'Kwame Owusu',
            currentTitle: null,
            nameWithTitle: 'Kwame Owusu',
            pictureUrl: '',
          },
          history: [],
        },
      ],
    },
  },
}

// SearchMember debounces (DEBOUNCE_TIMER=500ms) then always fires
// MEMBER_MEMBER_SEARCH — once for the initial mount value (leaderName =
// 'Kwame Owusu') and again once the user types. Matched loosely on the
// query alone and supplied twice, matching `memberBacentaSearchMock`'s
// reasoning in `UpdateMember.test.tsx`.
const memberSearchMock: MockedResponse = {
  request: { query: MEMBER_MEMBER_SEARCH },
  variableMatcher: () => true,
  result: {
    data: {
      members: [
        {
          id: USER_ID,
          memberSearch: [
            {
              id: NEW_LEADER_ID,
              firstName: 'Ama',
              middleName: '',
              lastName: 'Mensah',
              pictureUrl: '',
              email: 'ama@example.com',
              location: null,
            },
          ],
        },
      ],
    },
  },
}

const updateDenominationSuccessMock: MockedResponse = {
  request: {
    query: UPDATE_DENOMINATION_MUTATION,
    variables: { denominationId: DENOMINATION_ID, name: 'First Love' },
  },
  result: {
    data: {
      UpdateDenominationDetails: {
        id: DENOMINATION_ID,
        name: 'First Love',
        oversights: [],
        admin: null,
        leader: { id: OLD_LEADER_ID, firstName: 'Kwame', lastName: 'Owusu' },
        history: [],
      },
    },
  },
}

const updateDenominationErrorMock: MockedResponse = {
  request: {
    query: UPDATE_DENOMINATION_MUTATION,
    variables: { denominationId: DENOMINATION_ID, name: 'First Love' },
  },
  error: new Error('Network error updating denomination'),
}

const getDenominationOversightsMock: MockedResponse = {
  request: { query: GET_DENOMINATION_OVERSIGHTS, variables: { id: DENOMINATION_ID } },
  result: {
    data: {
      denominations: [
        {
          id: DENOMINATION_ID,
          name: 'First Love',
          leader: {
            id: OLD_LEADER_ID,
            firstName: 'Kwame',
            lastName: 'Owusu',
            fullName: 'Kwame Owusu',
          },
          memberCount: 0,
          admin: null,
          oversights: [],
        },
      ],
    },
  },
}

const makeDenominationLeaderSuccessMock: MockedResponse = {
  request: {
    query: MAKE_DENOMINATION_LEADER,
    variables: {
      denominationId: DENOMINATION_ID,
      newLeaderId: NEW_LEADER_ID,
      oldLeaderId: OLD_LEADER_ID,
    },
  },
  result: {
    data: {
      RemoveDenominationLeader: {
        id: OLD_LEADER_ID,
        firstName: 'Kwame',
        lastName: 'Owusu',
      },
      MakeDenominationLeader: {
        id: NEW_LEADER_ID,
        firstName: 'Ama',
        lastName: 'Mensah',
        leadsDenomination: [
          {
            id: DENOMINATION_ID,
            leader: { id: NEW_LEADER_ID, firstName: 'Ama', lastName: 'Mensah' },
          },
        ],
      },
    },
  },
}

const makeDenominationLeaderErrorMock: MockedResponse = {
  request: {
    query: MAKE_DENOMINATION_LEADER,
    variables: {
      denominationId: DENOMINATION_ID,
      newLeaderId: NEW_LEADER_ID,
      oldLeaderId: OLD_LEADER_ID,
    },
  },
  error: new Error('Network error making leader'),
}

function renderPage(mocks: MockedResponse[]) {
  return render(
    <MemoryRouter initialEntries={['/denomination/update']}>
      <ChurchContext.Provider value={churchContextValue}>
        <MemberContext.Provider value={memberContextValue}>
          <MockedProvider
            mocks={mocks}
            defaultOptions={{
              // Mirrors prod's createApolloClient defaultOptions.mutate.
              mutate: { errorPolicy: 'all' },
              watchQuery: { errorPolicy: 'all' },
              query: { errorPolicy: 'all' },
            }}
          >
            <UpdateDenomination />
          </MockedProvider>
        </MemberContext.Provider>
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

// Selects a new leader through SearchMember's real debounced search+select
// flow, matching `selectBacentaFromDropdown` in `UpdateMember.test.tsx`.
// Queried by role rather than placeholder text so this also works after a
// language change (the placeholder itself is translated).
const selectNewLeader = async () => {
  const user = userEvent.setup()
  const leaderInput = await screen.findByRole('combobox')
  await user.click(leaderInput)
  await user.clear(leaderInput)
  await user.type(leaderInput, 'Ama')
  const option = await screen.findByText('Ama Mensah', undefined, {
    timeout: 3000,
  })
  await user.click(option)
}

// Resolves the button label through i18next rather than hardcoding /submit/i:
// the French cases below change the active language first, at which point the
// English label no longer exists in the DOM.
const submitForm = async () => {
  const user = userEvent.setup()
  const submitButton = await screen.findByRole('button', {
    name: i18n.t('shared.form.submit'),
  })
  await user.click(submitButton)
}

describe('UpdateDenomination i18n', () => {
  it('renders the translated form title on the default English render', async () => {
    renderPage([displayDenominationMock])

    expect(
      await screen.findByRole('heading', {
        name: 'Update Denomination Form',
      })
    ).toBeInTheDocument()
  })

  it('renders the translated form title in French', async () => {
    renderPage([displayDenominationMock])

    await screen.findByRole('heading', { name: 'Update Denomination Form' })
    await i18n.changeLanguage('fr')

    expect(
      await screen.findByRole('heading', {
        name: 'Formulaire de mise à jour de la dénomination',
      })
    ).toBeInTheDocument()
  })

  it('shows the translated success toast after changing the leader', async () => {
    renderPage([
      displayDenominationMock,
      memberSearchMock,
      memberSearchMock,
      updateDenominationSuccessMock,
      getDenominationOversightsMock,
      makeDenominationLeaderSuccessMock,
    ])

    await screen.findByRole('heading', { name: 'Update Denomination Form' })
    await selectNewLeader()
    await submitForm()

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Leader Changed Successfully')
    )
  })

  it('shows the translated success toast (French) after changing the leader', async () => {
    renderPage([
      displayDenominationMock,
      memberSearchMock,
      memberSearchMock,
      updateDenominationSuccessMock,
      getDenominationOversightsMock,
      makeDenominationLeaderSuccessMock,
    ])

    await screen.findByRole('heading', { name: 'Update Denomination Form' })
    await i18n.changeLanguage('fr')
    await selectNewLeader()
    await submitForm()

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Responsable changé avec succès')
    )
  })

  it('shows the translated error toast when changing the leader fails', async () => {
    renderPage([
      displayDenominationMock,
      memberSearchMock,
      memberSearchMock,
      updateDenominationSuccessMock,
      getDenominationOversightsMock,
      makeDenominationLeaderErrorMock,
    ])

    await screen.findByRole('heading', { name: 'Update Denomination Form' })
    await selectNewLeader()
    await submitForm()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('There was a problem changing the leader'),
        { duration: 10000 }
      )
    )
  })

  it('shows the translated error toast (French) when changing the leader fails', async () => {
    renderPage([
      displayDenominationMock,
      memberSearchMock,
      memberSearchMock,
      updateDenominationSuccessMock,
      getDenominationOversightsMock,
      makeDenominationLeaderErrorMock,
    ])

    await screen.findByRole('heading', { name: 'Update Denomination Form' })
    await i18n.changeLanguage('fr')
    await selectNewLeader()
    await submitForm()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Un problème est survenu lors du changement de responsable'
        ),
        { duration: 10000 }
      )
    )
  })

  it('shows the translated error toast when the denomination update itself fails', async () => {
    renderPage([displayDenominationMock, updateDenominationErrorMock])

    await screen.findByRole('heading', { name: 'Update Denomination Form' })
    await submitForm()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'There was a problem updating this denomination'
        ),
        { duration: 10000 }
      )
    )
  })

  it('shows the translated error toast (French) when the denomination update itself fails', async () => {
    renderPage([displayDenominationMock, updateDenominationErrorMock])

    await screen.findByRole('heading', { name: 'Update Denomination Form' })
    await i18n.changeLanguage('fr')
    await submitForm()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Un problème est survenu lors de la mise à jour de cette dénomination'
        ),
        { duration: 10000 }
      )
    )
  })
})
