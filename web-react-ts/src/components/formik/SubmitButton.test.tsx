/**
 * Characterization for SubmitButton after shared.form i18n wiring.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import i18n from 'lib/i18n'
import SubmitButton from './SubmitButton'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

describe('SubmitButton i18n', () => {
  it('renders the default English submit label', () => {
    render(
      <SubmitButton formik={{ isSubmitting: false, isValid: true }} />
    )
    expect(
      screen.getByRole('button', { name: 'Submit' })
    ).toBeInTheDocument()
  })

  it('renders the shared submitting label while submitting', () => {
    render(
      <SubmitButton formik={{ isSubmitting: true, isValid: true }} />
    )
    expect(
      screen.getByRole('button', { name: /Submitting/ })
    ).toBeInTheDocument()
  })

  it('re-renders the default submit label in French', async () => {
    render(
      <SubmitButton formik={{ isSubmitting: false, isValid: true }} />
    )
    await i18n.changeLanguage('fr')
    expect(
      await screen.findByRole('button', { name: 'Envoyer' })
    ).toBeInTheDocument()
  })
})
