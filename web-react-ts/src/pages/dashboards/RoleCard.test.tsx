/**
 * `role` is now sometimes a translated display string (e.g. "Gouvernorat
 * Administrateur" in French, built by `roleDisplayName` in
 * dashboard-utils.ts), not always the English name it used to always be.
 * RoleCard's background colour class was deriving directly from
 * `role.toLowerCase()`, which only matches Dashboards.css's English-only
 * `.colour-*` selectors — so a translated `role` produced a class with no
 * matching CSS rule (blank card colour). The fix derives the colour class
 * from `authRoles` (always the untranslated internal role key, e.g.
 * "adminGovernorship") instead. These tests lock in that behavior.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import RoleCard from './RoleCard'

// PlaceholderCustom (components/Placeholder) calls useAuth internally;
// RoleCard renders through it regardless of `loading`.
vi.mock('contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}))

const renderCard = (props: {
  number: number | string
  role: string
  authRoles: string
  loading: boolean
}) =>
  render(
    <MockedProvider mocks={[]}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <RoleCard {...(props as any)} />
    </MockedProvider>
  )

describe('RoleCard colour class', () => {
  afterEach(cleanup)

  it('derives the colour class from authRoles for an untranslated (English) role name', () => {
    const { container } = renderCard({
      number: 2,
      role: 'Governorship Admin',
      authRoles: 'adminGovernorship',
      loading: false,
    })

    const card = container.querySelector('.role-card')
    expect(card).toHaveClass('colour-governorship')
  })

  it('still derives the correct colour class when role is a translated display string', () => {
    const { container } = renderCard({
      number: 2,
      role: 'Gouvernorat Administrateur',
      authRoles: 'adminGovernorship',
      loading: false,
    })

    const card = container.querySelector('.role-card')
    expect(card).toHaveClass('colour-governorship')
  })

  it('derives colour classes for each church level from its authRoles suffix', () => {
    const cases: Array<[string, string]> = [
      ['leaderBacenta', 'colour-bacenta'],
      ['leaderCouncil', 'colour-council'],
      ['adminStream', 'colour-stream'],
      ['arrivalsAdminCampus', 'colour-campus'],
      ['leaderOversight', 'colour-oversight'],
      ['adminDenomination', 'colour-denomination'],
    ]

    cases.forEach(([authRoles, expectedClass]) => {
      const { container, unmount } = renderCard({
        number: 1,
        role: 'Some Translated Name',
        authRoles,
        loading: false,
      })
      const card = container.querySelector('.role-card')
      expect(card).toHaveClass(expectedClass)
      unmount()
    })
  })

  it('renders the passed-in role text as the card title', () => {
    const { getByText } = renderCard({
      number: 3,
      role: 'Gouvernorat Administrateur',
      authRoles: 'adminGovernorship',
      loading: false,
    })

    expect(getByText('Gouvernorat Administrateur')).toBeInTheDocument()
  })
})
