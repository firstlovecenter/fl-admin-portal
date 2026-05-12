import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { ChurchContext } from 'contexts/ChurchContext'
import TestProvider from 'TestProvider'
import ArrivalTimes from './ArrivalTimes'

// With no `streamId` in ChurchContext the underlying
// `getStreamArrivalTimes` query is skipped (`skip: !streamId`), so this is
// a pure render smoke test for the redesign. ADR-013: redesigns get smoke
// tests, not characterisation tests.
const renderWithProviders = (streamId?: string) =>
  render(
    <ChurchContext.Provider value={{ streamId }}>
      <MockedProvider mocks={[]} addTypename={false}>
        <TestProvider>
          <ArrivalTimes />
        </TestProvider>
      </MockedProvider>
    </ChurchContext.Provider>
  )

describe('ArrivalTimes page', () => {
  afterEach(cleanup)

  it('renders the heading and four time slot labels', () => {
    renderWithProviders()

    expect(
      screen.getByRole('heading', { name: /Arrival Times/i, level: 1 })
    ).toBeInTheDocument()
    expect(screen.getByText('Mobilisation Start')).toBeInTheDocument()
    expect(screen.getByText('Mobilisation End')).toBeInTheDocument()
    expect(screen.getByText('Arrival Start')).toBeInTheDocument()
    expect(screen.getByText('Arrival End')).toBeInTheDocument()
  })

  it('shows the "no stream in focus" alert when ChurchContext has no streamId', () => {
    renderWithProviders()

    expect(screen.getByText(/No stream in focus/i)).toBeInTheDocument()
  })
})
