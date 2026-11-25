import { useState } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SearchCombobox from './SearchCombobox'

const suggestions = [
  { id: 'one', name: 'Grace' },
  { id: 'two', name: 'Hope' },
]

afterEach(cleanup)

function SearchForm({ onSubmit = vi.fn() }) {
  const [value, setValue] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <SearchCombobox
        label="Search"
        name="search"
        value={value}
        onValueChange={setValue}
        suggestions={suggestions}
        getItemKey={(item) => item.id}
        getItemValue={(item) => item.name}
        onSelect={(item) => setValue(item.name)}
      />
    </form>
  )
}

describe('SearchCombobox selection', () => {
  it('lets the user change a selection without leaving the input', async () => {
    const user = userEvent.setup()
    render(<SearchForm />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'Gr')
    await user.keyboard('{Enter}')
    expect(input).toHaveValue('Grace')
    await user.clear(input)
    await user.type(input, 'Ho')
    expect(await screen.findByRole('option', { name: 'Hope' })).toBeVisible()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input).toHaveValue('Hope')
  })

  it('selects a suggestion with Enter without submitting the form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SearchForm onSubmit={onSubmit} />)
    const input = screen.getByRole('combobox')
    await user.type(input, 'Gr')
    await user.keyboard('{Enter}')
    expect(input).toHaveValue('Grace')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
