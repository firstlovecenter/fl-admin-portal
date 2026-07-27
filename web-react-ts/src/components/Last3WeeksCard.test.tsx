/**
 * Last3WeeksCard renders inside DisplayChurchDetails — an already-localized
 * component — but shipped nine hardcoded English strings ("Forms", "Week N",
 * "Income Form", "Filled" / "Not Filled", …) until this branch.
 *
 * `shouldFill` is covered too: it is exported alongside the card, drives
 * whether a Bacenta is prompted to record service, and treats
 * `vacationStatus === 'Vacation'` as a valid reason not to (SM3).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { getWeekNumber } from 'global-utils'
import i18n from 'lib/i18n'
import Last3WeeksCard, { shouldFill } from './Last3WeeksCard'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const weeks = [
  { number: 30, filled: true, banked: true },
  { number: 29, filled: true, banked: false },
  { number: 28, filled: false, banked: false },
]

describe('Last3WeeksCard', () => {
  it('renders every label in English by default', () => {
    render(<Last3WeeksCard last3Weeks={weeks} />)

    expect(screen.getByText('Forms')).toBeInTheDocument()
    expect(screen.getByText('Week 30')).toBeInTheDocument()
    expect(screen.getAllByText('Income Form')).toHaveLength(3)
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('Not Submitted')).toBeInTheDocument()
    expect(screen.getByText('Not Filled')).toBeInTheDocument()
  })

  it('renders every label in the active language', async () => {
    await i18n.changeLanguage('fr')
    render(<Last3WeeksCard last3Weeks={weeks} />)

    expect(screen.getByText('Formulaires')).toBeInTheDocument()
    expect(screen.getByText('Semaine 30')).toBeInTheDocument()
    expect(screen.getByText('Non soumis')).toBeInTheDocument()
    expect(screen.queryByText('Forms')).not.toBeInTheDocument()
  })

  it('translates the No Service row', async () => {
    await i18n.changeLanguage('es')
    render(
      <Last3WeeksCard
        last3Weeks={[
          { number: 30, filled: false, banked: 'No Service' },
          { number: 29, filled: true, banked: true },
        ]}
      />
    )

    expect(screen.getByText('Sin servicio')).toBeInTheDocument()
  })

  it('renders nothing when every week is No Service', () => {
    const { container } = render(
      <Last3WeeksCard
        last3Weeks={[
          { number: 30, filled: false, banked: 'No Service' },
          { number: 29, filled: false, banked: 'No Service' },
        ]}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('hides the banking row until the income form is filled', () => {
    render(<Last3WeeksCard last3Weeks={[{ number: 30, filled: false, banked: false }]} />)

    expect(screen.getByText('Not Filled')).toBeInTheDocument()
    expect(screen.queryByText('Banking Slip')).not.toBeInTheDocument()
  })
})

describe('shouldFill', () => {
  const thisWeek = getWeekNumber()

  it('is false once this week is already filled', () => {
    expect(
      shouldFill({
        last3Weeks: [{ number: thisWeek, filled: true, banked: false }],
        vacation: 'Active',
      })
    ).toBe(false)
  })

  it('is true when this week is still unfilled', () => {
    expect(
      shouldFill({
        last3Weeks: [{ number: thisWeek, filled: false, banked: false }],
        vacation: 'Active',
      })
    ).toBe(true)
  })

  it('is false on vacation regardless of the forms — SM3', () => {
    expect(
      shouldFill({
        last3Weeks: [{ number: thisWeek, filled: false, banked: false }],
        vacation: 'Vacation',
      })
    ).toBe(false)
  })
})
