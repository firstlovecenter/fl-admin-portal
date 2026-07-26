/**
 * i18n coverage for the small app-wide chrome components localized on this
 * branch. Each of these renders above or alongside pages that were already
 * translated, so an untranslated string here leaked English into an otherwise
 * French/Spanish/Portuguese/German session.
 *
 * Grouped into one file because each component owns only a handful of strings
 * and needs the same three-line harness; the assertions are still per
 * component.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'

import EditButton from './buttons/EditButton'
import BtnSubmitText from './formik/BtnSubmitText'
import AllChurchesSummary from './AllChurchesSummary'
import ChurchSearch from './ChurchSearch'
import Sabbath from 'auth/Sabbath'
import { UnauthMsg } from 'auth/UnauthMsg'
import PageNotFound from 'pages/page-not-found/PageNotFound'
import Reconciliation from 'pages/reconciliation/Reconciliation'

// DisplayChurchList (rendered by ChurchSearch) pulls in router + card chrome
// that is irrelevant here — the search input is what this file asserts on.
vi.mock('./DisplayChurchList', () => ({
  default: () => <div data-testid="church-list" />,
}))

// `formik/Input` and `Placeholder` both read `useAuth` to decide whether to
// show a skeleton; none of these components is what's under test here.
vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const withRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('EditButton', () => {
  it('translates its label and its aria-label together', async () => {
    withRouter(<EditButton link="/directory/edit" />)
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument()

    cleanup()
    await i18n.changeLanguage('de')
    withRouter(<EditButton link="/directory/edit" />)
    expect(screen.getByRole('link', { name: 'Bearbeiten' })).toBeInTheDocument()
  })
})

describe('BtnSubmitText', () => {
  it('shows the confirm copy at rest and the spinner copy while submitting', async () => {
    const { rerender } = render(<BtnSubmitText loading={false} />)
    expect(screen.getByText("Yes, I'm sure")).toBeInTheDocument()

    rerender(<BtnSubmitText loading />)
    expect(screen.getByText('Submitting…')).toBeInTheDocument()

    cleanup()
    await i18n.changeLanguage('es')
    render(<BtnSubmitText loading={false} />)
    expect(screen.getByText('Sí, estoy seguro')).toBeInTheDocument()
  })
})

describe('AllChurchesSummary', () => {
  it('translates the Members tile label', async () => {
    await i18n.changeLanguage('pt')
    withRouter(
      <AllChurchesSummary
        churchType="Council"
        numberOfChurchesBelow={4}
        route="council"
        memberCount={120}
      />
    )

    expect(screen.getByText('Membros')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
  })
})

describe('ChurchSearch', () => {
  it('translates the search placeholder', async () => {
    await i18n.changeLanguage('fr')
    withRouter(<ChurchSearch data={[]} churchType="Council" />)

    expect(
      screen.getByPlaceholderText('Rechercher une église ou un dirigeant')
    ).toBeInTheDocument()
  })
})

describe('Sabbath', () => {
  it('translates the gate copy but never the author attribution', async () => {
    await i18n.changeLanguage('fr')
    render(<Sabbath />)

    // The accent segment survives <Trans> as its own element…
    expect(screen.getByText('Sabbat !')).toBeInTheDocument()
    // …inside the full translated sentence.
    expect(
      screen.getByRole('heading', { name: "Aujourd'hui, c'est le Sabbat !" })
    ).toBeInTheDocument()
    expect(screen.getByText('Exode 20:8-10')).toBeInTheDocument()
    // A person's name — on the do-not-translate list.
    expect(screen.getByText('- Dag Heward-Mills')).toBeInTheDocument()
  })

  it('lets a language reorder the emphasis instead of forcing English word order', async () => {
    // Regression guard. The title used to be a `title` + `titleAccent` pair
    // glued together in English order, which rendered Spanish as
    // "Hoy es el ¡Sábado!" — an inverted exclamation stranded mid-sentence.
    // A single <Trans> key lets each language place the emphasis itself.
    await i18n.changeLanguage('es')
    render(<Sabbath />)

    const heading = screen.getByRole('heading', {
      name: '¡Hoy es el día de reposo!',
    })
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).not.toMatch(/\s¡/)
  })
})

describe('UnauthMsg', () => {
  it('translates the denial copy and the dashboard link', async () => {
    withRouter(<UnauthMsg />)
    expect(
      screen.getByRole('link', { name: 'Go back to the dashboard' })
    ).toBeInTheDocument()

    cleanup()
    await i18n.changeLanguage('de')
    withRouter(<UnauthMsg />)
    expect(
      screen.getByRole('heading', {
        name: 'Sie haben keinen Zugriff auf diese Seite',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Zurück zum Dashboard' })
    ).toBeInTheDocument()
  })
})

describe('PageNotFound', () => {
  it('keeps 404 numeric and translates the rest', async () => {
    await i18n.changeLanguage('es')
    withRouter(<PageNotFound />)

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver al panel' })
    ).toBeInTheDocument()
  })
})

describe('Reconciliation', () => {
  it('translates the placeholder page', async () => {
    await i18n.changeLanguage('fr')
    render(<Reconciliation />)

    expect(screen.getByText('Réconciliation')).toBeInTheDocument()
    expect(
      screen.getByText(/fonctionnalité de réconciliation/i)
    ).toBeInTheDocument()
  })
})
