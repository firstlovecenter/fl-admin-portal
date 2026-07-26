/**
 * ImageUpload is the photo field used by the (localized) member and service
 * forms. Its drop-zone copy, the "Change Photo" overlay, the format hint and
 * the preview `alt` were all English-only until this branch.
 *
 * The caller-supplied `placeholder` prop still wins over the default prompt —
 * pinned here so a future refactor doesn't start double-translating it.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Formik, Form } from 'formik'
import { MockedProvider } from '@apollo/client/testing'
import i18n from 'lib/i18n'
import ImageUpload from './ImageUpload'

vi.mock('contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}))

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

// ImageUpload renders Formik's <ErrorMessage> and calls useMutation on mount,
// so it needs both a Formik context and an Apollo client.
const renderUpload = (props: Record<string, unknown> = {}) =>
  render(
    <MockedProvider mocks={[]} addTypename={false}>
      <Formik initialValues={{ pictureUrl: '' }} onSubmit={vi.fn()}>
        <Form>
          <ImageUpload
            name="pictureUrl"
            label="Picture"
            setFieldValue={vi.fn()}
            {...props}
          />
        </Form>
      </Formik>
    </MockedProvider>
  )

describe('ImageUpload', () => {
  it('renders the empty drop zone in English by default', () => {
    renderUpload()

    expect(screen.getByText('Drag & drop or tap to upload')).toBeInTheDocument()
    expect(screen.getByText('JPG, PNG or WebP')).toBeInTheDocument()
  })

  it('translates the drop-zone prompt and format hint', async () => {
    await i18n.changeLanguage('fr')
    renderUpload()

    expect(
      screen.getByText('Glissez-déposez ou appuyez pour téléverser')
    ).toBeInTheDocument()
    expect(screen.getByText('JPG, PNG ou WebP')).toBeInTheDocument()
  })

  it('lets an explicit placeholder prop override the translated prompt', async () => {
    await i18n.changeLanguage('de')
    renderUpload({ placeholder: 'Bacenta banner' })

    expect(screen.getByText('Bacenta banner')).toBeInTheDocument()
    expect(
      screen.queryByText('Ziehen und ablegen oder zum Hochladen tippen')
    ).not.toBeInTheDocument()
  })

  it('translates the preview alt text and re-upload overlay', async () => {
    await i18n.changeLanguage('es')
    renderUpload({ initialValue: 'https://example.com/photo.jpg' })

    expect(
      screen.getByAltText('Vista previa de la subida')
    ).toBeInTheDocument()
    expect(screen.getByText('Cambiar foto')).toBeInTheDocument()
  })
})
