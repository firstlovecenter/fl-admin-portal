/**
 * Tests for the i18n conversion of MemberCollisionDialog.tsx.
 *
 * Every hardcoded string moved to `t('directory.memberCollisionDialog.*')`
 * / `t('directory.common.cancel')` / `t('directory.common.close')` /
 * `t('shared.churchLevel.Bacenta')`. No markup or logic changed — this is
 * a pure presentational component (props in, dialog out), so no context
 * providers or MockedProvider are needed.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import i18n from 'lib/i18n'
import MemberCollisionDialog, { MemberCollision } from './MemberCollisionDialog'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})

const inactiveCollision: MemberCollision = {
  field: 'email',
  status: 'inactive',
  memberId: 'member-1',
  firstName: 'Kwame',
  lastName: 'Owusu',
  bacentaName: null,
}

const activeCollisionWithBacenta: MemberCollision = {
  field: 'whatsappNumber',
  status: 'active',
  memberId: 'member-2',
  firstName: 'Ama',
  lastName: 'Boateng',
  bacentaName: 'Grace',
}

const activeCollisionWithoutBacenta: MemberCollision = {
  field: 'whatsappNumber',
  status: 'active',
  memberId: 'member-3',
  firstName: 'Kojo',
  lastName: 'Mensah',
  bacentaName: null,
}

describe('MemberCollisionDialog i18n', () => {
  it('renders the deactivated-member title, field label, and Cancel button in English', () => {
    render(
      <MemberCollisionDialog
        collision={inactiveCollision}
        reactivating={false}
        onReactivate={() => {}}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Deactivated member found')).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'This email belongs to Kwame Owusu, whose profile is deactivated. Reactivate them and move them to this bacenta so you can review both records and decide what to do.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reactivate member' })
    ).toBeInTheDocument()
  })

  it('renders the registered-member title with bacenta name and Close button in English', () => {
    render(
      <MemberCollisionDialog
        collision={activeCollisionWithBacenta}
        reactivating={false}
        onReactivate={() => {}}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Member already registered')).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'This WhatsApp number already belongs to Ama Boateng, a registered member at Grace Bacenta. To bring them into this bacenta, a transfer must be requested.'
      )
    ).toBeInTheDocument()
    // Radix's built-in X-icon close button also has an sr-only "Close"
    // label, so scope to the footer to disambiguate from the Cancel/Close
    // action button this component renders.
    const footer = document.querySelector(
      '[data-slot="dialog-footer"]'
    ) as HTMLElement
    expect(within(footer).getByText('Close')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reactivate member' })
    ).not.toBeInTheDocument()
  })

  it('renders the "no bacenta" registered-member variant in English', () => {
    render(
      <MemberCollisionDialog
        collision={activeCollisionWithoutBacenta}
        reactivating={false}
        onReactivate={() => {}}
        onClose={() => {}}
      />
    )

    expect(
      screen.getByText(
        (_, node) =>
          node?.textContent ===
          'This WhatsApp number already belongs to Kojo Mensah, a registered member. To bring them into this bacenta, a transfer must be requested.'
      )
    ).toBeInTheDocument()
  })

  it('shows the "Reactivating…" label while reactivating', () => {
    render(
      <MemberCollisionDialog
        collision={inactiveCollision}
        reactivating
        onReactivate={() => {}}
        onClose={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: 'Reactivating…' })).toBeDisabled()
  })

  it('renders nothing when collision is null', () => {
    const { container } = render(
      <MemberCollisionDialog
        collision={null}
        reactivating={false}
        onReactivate={() => {}}
        onClose={() => {}}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('re-renders the deactivated-member dialog in French', async () => {
    await i18n.changeLanguage('fr')

    render(
      <MemberCollisionDialog
        collision={inactiveCollision}
        reactivating={false}
        onReactivate={() => {}}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Membre désactivé trouvé')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Annuler' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Réactiver le membre' })
    ).toBeInTheDocument()
  })
})
