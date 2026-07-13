/**
 * Tests for FileUpload.tsx — the two error-rendering branches that were fixed
 * in the dependency-bump sweep.
 *
 * The bug: the line was previously
 *   {!props.error ?? <ErrorMessage/>}
 * which never rendered the Formik field error (`x ?? y` only evaluates `y`
 * when `x` is null/undefined, and `!props.error` is always a boolean). It was
 * changed to
 *   {props.error && <TextError>{props.error}</TextError>}
 *   {!props.error && <ErrorMessage name={name} component={TextError} />}
 *
 * Observable contract now:
 *  - props.error truthy  -> the explicit <TextError>{props.error}</TextError>
 *    renders, and the Formik field-level <ErrorMessage> does NOT.
 *  - props.error falsy   -> the Formik field-level <ErrorMessage> renders the
 *    touched validation error instead.
 *
 * FileUpload is a Formik field wrapper. It calls useMutation on mount, so it
 * must be wrapped in a MockedProvider. It reads validation state from the
 * surrounding <Formik> context, so both error and touched state for the field
 * are seeded via initialErrors / initialTouched (Formik does not run
 * validation on mount unless validateOnMount is set, so these persist).
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Formik, Form } from 'formik'
import type { FormikErrors, FormikTouched } from 'formik'
import { MockedProvider } from '@apollo/client/testing'
import FileUpload from './FileUpload'

const FIELD = 'avatar'
const FIELD_LEVEL_ERROR = 'This field is required'
const EXPLICIT_PROP_ERROR = 'Explicit upload failure'

function renderFileUpload({
  error,
  seedFieldError = true,
}: {
  error?: string
  seedFieldError?: boolean
}) {
  type Values = { avatar: string }
  const initialErrors: FormikErrors<Values> = seedFieldError
    ? { avatar: FIELD_LEVEL_ERROR }
    : {}
  const initialTouched: FormikTouched<Values> = seedFieldError
    ? { avatar: true }
    : {}
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <Formik
        initialValues={{ avatar: '' } as Values}
        initialErrors={initialErrors}
        initialTouched={initialTouched}
        onSubmit={vi.fn()}
      >
        <Form>
          <FileUpload
            label="Avatar"
            name={FIELD}
            placeholder="Upload"
            setFieldValue={vi.fn()}
            error={error}
          />
        </Form>
      </Formik>
    </MockedProvider>
  )
}

describe('FileUpload error rendering branches', () => {
  afterEach(cleanup)

  it('renders the Formik field-level error when props.error is absent', () => {
    renderFileUpload({ error: undefined, seedFieldError: true })

    // The touched field-level validation error must surface.
    expect(screen.getByText(FIELD_LEVEL_ERROR)).toBeInTheDocument()
  })

  it('renders the explicit props.error and NOT the field-level error when props.error is provided', () => {
    // Seed a field-level error too, so we can prove the explicit branch wins
    // and the Formik <ErrorMessage> branch is suppressed.
    renderFileUpload({ error: EXPLICIT_PROP_ERROR, seedFieldError: true })

    // Explicit error is shown.
    expect(screen.getByText(EXPLICIT_PROP_ERROR)).toBeInTheDocument()
    // Field-level error is NOT shown (the !props.error branch is short-circuited).
    expect(screen.queryByText(FIELD_LEVEL_ERROR)).not.toBeInTheDocument()
  })

  it('renders no error text when props.error is absent and the field has no touched error', () => {
    renderFileUpload({ error: undefined, seedFieldError: false })

    expect(screen.queryByText(FIELD_LEVEL_ERROR)).not.toBeInTheDocument()
    expect(screen.queryByText(EXPLICIT_PROP_ERROR)).not.toBeInTheDocument()
    // No alert-role error node at all.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
