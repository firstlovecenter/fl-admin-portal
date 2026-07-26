import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'lib/i18n'
import { ChurchContext } from 'contexts/ChurchContext'
import Filters from './Filters'

vi.mock('components/formik/CheckboxGroup', () => ({
  default: ({ label }: { label: string }) => <p>{label}</p>,
}))
vi.mock('components/formik/CheckboxWithQuery', () => ({
  default: ({ label }: { label: string }) => <p>{label}</p>,
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

function renderFilters() {
  return render(
    <MemoryRouter>
      <ChurchContext.Provider value={{ campusId: 'campus-1', filters: {}, setFilters: vi.fn() } as never}>
        <Filters />
      </ChurchContext.Provider>
    </MemoryRouter>
  )
}

describe('member filters i18n', () => {
  it('renders all English filter labels and actions', () => {
    renderFilters()

    for (const label of ['Gender', 'Marital Status', 'Select a Ministry', 'Leader Rank', 'Leader Title']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply Filters' })).toBeInTheDocument()
  })

  it('renders all labels and actions in French', async () => {
    await i18n.changeLanguage('fr')
    renderFilters()

    for (const key of ['gender', 'maritalStatus', 'selectMinistry', 'leaderRank', 'leaderTitle']) {
      expect(screen.getByText(i18n.t(`directory.memberFilters.${key}`))).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: i18n.t('directory.memberFilters.reset') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: i18n.t('directory.memberFilters.applyFilters') })).toBeInTheDocument()
  })
})
