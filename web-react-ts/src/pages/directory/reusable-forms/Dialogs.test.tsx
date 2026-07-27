/**
 * Translation coverage for the two directory dialogs and the avatar upload.
 *
 * Both dialogs had a module-scope Yup `validationSchema`, which can't call the
 * component's `t` — those became `buildValidationSchema(t)` factories, and the
 * cases below assert a validation message actually renders translated rather
 * than just checking the schema compiles.
 *
 * What is deliberately NOT asserted: the persisted deletion `reason` and the
 * `historyRecord` strings. Those are HistoryLog audit text, stored in English
 * on purpose and translated at display time by
 * `lib/translate-history-record.ts`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'

import MemberDeleteDialog, { buildValidationSchema } from './MemberDeleteDialog'
import MemberTitleDialog from './MemberTitleDialog'
import MemberAvatarUpload from './MemberAvatarUpload'

vi.mock('@apollo/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apollo/client')>()
  return {
    ...actual,
    useQuery: () => ({ data: undefined, loading: false, error: undefined }),
    useMutation: () => [vi.fn(), { loading: false }],
  }
})

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const wrap = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      {/* Both dialogs read memberId off MemberContext. */}
      <MemberContext.Provider
        value={
          { memberId: 'm1', currentUser: { id: 'u1', roles: [] } } as never
        }
      >
        {/* MemberDeleteDialog navigates away via clickCard on success. */}
        <ChurchContext.Provider value={{ clickCard: vi.fn() } as never}>
          {ui}
        </ChurchContext.Provider>
      </MemberContext.Provider>
    </MemoryRouter>
  )

describe('MemberDeleteDialog', () => {
  const props = {
    open: true,
    onClose: vi.fn(),
    memberFirstName: 'Ama',
    memberLastName: 'Mensah',
  }

  it('renders its title and note placeholder in English', () => {
    wrap(<MemberDeleteDialog {...props} />)

    expect(screen.getByText('Delete this member?')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        'Add any context that helps explain this decision'
      )
    ).toBeInTheDocument()
  })

  it('translates the title and placeholder', async () => {
    await i18n.changeLanguage('de')
    wrap(<MemberDeleteDialog {...props} />)

    expect(screen.getByText('Dieses Mitglied löschen?')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        'Fügen Sie Kontext hinzu, der diese Entscheidung erklärt'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('Delete this member?')).not.toBeInTheDocument()
  })

  it('builds a schema whose messages are translated', async () => {
    // Asserted against the factory directly rather than by driving the form:
    // the schema was module-scope before this pass, so the thing worth pinning
    // is that it now resolves through the caller's `t`.
    await i18n.changeLanguage('fr')
    const schema = buildValidationSchema(i18n.t.bind(i18n) as never)

    await expect(
      schema.validate({ reasonCategory: '', reason: '' }, { abortEarly: false })
    ).rejects.toMatchObject({
      errors: expect.arrayContaining([
        'Veuillez choisir une catégorie de motif',
        'Veuillez indiquer la raison de la suppression de ce membre',
      ]),
    })
  })
})

describe('MemberTitleDialog', () => {
  it('translates its heading and the three date labels', async () => {
    await i18n.changeLanguage('es')
    wrap(<MemberTitleDialog open onClose={vi.fn()} />)

    expect(screen.getByText('Títulos pastorales')).toBeInTheDocument()
    expect(
      screen.getByText('Fecha de nombramiento pastoral')
    ).toBeInTheDocument()
    expect(screen.getByText('Fecha de ordenación')).toBeInTheDocument()
    expect(screen.getByText('Fecha de consagración')).toBeInTheDocument()
    expect(screen.queryByText('Pastoral Titles')).not.toBeInTheDocument()
  })
})

describe('MemberAvatarUpload', () => {
  it('translates the upload affordance and format hint', async () => {
    await i18n.changeLanguage('pt')
    wrap(
      <MemberAvatarUpload
        name="pictureUrl"
        value=""
        initials="AM"
        setFieldValue={vi.fn()}
      />
    )

    expect(
      screen.getByText('PNG, JPG ou WebP. Máx. 10 MB.')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('PNG, JPG or WebP. Max 10MB.')
    ).not.toBeInTheDocument()
  })
})
