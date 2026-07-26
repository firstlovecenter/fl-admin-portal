/**
 * Tests for the i18n conversion of MemberForm.tsx.
 *
 * Every hardcoded string moved to `t('directory.memberForm.*')`. "Basonta"
 * (the field label and the loanword itself) is left untranslated per
 * `kb/01-glossary.md`'s do-not-translate list, matching "Bacenta"
 * elsewhere in this branch — only the surrounding `SearchBacenta` label
 * ("Bacenta *") routes through `shared.churchLevel.Bacenta`. No markup,
 * validation logic, or submit behavior changed.
 *
 * Rendered via `CreateMember`-style usage (register mode, `update`
 * undefined) and update mode (`update` true) to cover both header/submit
 * variants. `GET_CAMPUS_BASONTAS` is mocked via `MockedProvider`;
 * `contexts/AuthContext` is mocked for `RoleView`/`SearchBacenta`'s
 * internal auth checks; `ResizeObserver` is stubbed for the cmdk-based
 * `SearchBacenta` component.
 */

import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { GET_CAMPUS_BASONTAS } from 'queries/ListQueries'
import MemberForm from './MemberForm'
import { CreateMemberFormOptions } from '../create/CreateMember'

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

const CAMPUS_ID = 'campus-1'
const churchContextValue = { campusId: CAMPUS_ID }
const memberContextValue = {
  currentUser: { id: 'user-1', roles: ['adminDenomination'] },
}

const campusBasontasMock: MockedResponse = {
  request: { query: GET_CAMPUS_BASONTAS, variables: { id: CAMPUS_ID } },
  result: {
    data: {
      campuses: [{ id: CAMPUS_ID, name: 'Achimota Campus', basontas: [] }],
    },
  },
}

const initialValues: CreateMemberFormOptions = {
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  phoneNumber: '',
  whatsappNumber: '',
  email: undefined,
  dob: '',
  maritalStatus: '',
  occupation: '',
  pictureUrl: '',
  visitationArea: '',
  bacenta: '' as unknown as CreateMemberFormOptions['bacenta'],
  basonta: '',
}

function renderForm(update = false) {
  return render(
    <MemoryRouter>
      <MockedProvider mocks={[campusBasontasMock]} addTypename={false}>
        <ChurchContext.Provider value={churchContextValue}>
          <MemberContext.Provider value={memberContextValue}>
            <MemberForm
              initialValues={initialValues}
              onSubmit={vi.fn()}
              loading={false}
              update={update}
            />
          </MemberContext.Provider>
        </ChurchContext.Provider>
      </MockedProvider>
    </MemoryRouter>
  )
}

describe('MemberForm i18n', () => {
  it('renders the English register-mode heading, section titles, and field labels', async () => {
    renderForm(false)

    expect(
      await screen.findByRole('heading', { name: 'Register a New Member' })
    ).toBeInTheDocument()
    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(screen.getByText('Personal')).toBeInTheDocument()
    expect(screen.getByText('Church Membership')).toBeInTheDocument()
    expect(screen.getByText('Bacenta *')).toBeInTheDocument()
    expect(screen.getByLabelText('Basonta')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Register Member' })
    ).toBeInTheDocument()
  })

  it('renders the English update-mode heading and Save Changes button', async () => {
    renderForm(true)

    expect(
      await screen.findByRole('heading', { name: 'Edit Member' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Save Changes' })
    ).toBeInTheDocument()
  })

  it('re-renders the register-mode heading, section titles, and field labels in French', async () => {
    await i18n.changeLanguage('fr')
    renderForm(false)

    expect(
      await screen.findByRole('heading', { name: 'Inscrire un nouveau Membre' })
    ).toBeInTheDocument()
    expect(screen.getByText('Informations de base')).toBeInTheDocument()
    expect(screen.getByText('Appartenance à l\'église')).toBeInTheDocument()
    expect(screen.getByText('Bacenta *')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Inscrire le membre' })
    ).toBeInTheDocument()
  })
})
