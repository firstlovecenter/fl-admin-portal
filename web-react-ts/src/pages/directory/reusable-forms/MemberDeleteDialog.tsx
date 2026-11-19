import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useContext, useEffect, useRef, useState } from 'react'
import { useMutation } from '@apollo/client'
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { CircleAlert, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  alertSuccess,
  DELETE_MEMBER_CATEGORY_OPTIONS,
  throwToSentry,
} from 'global-utils'
import type { ServantType } from 'global-types'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { Alert, AlertDescription, AlertTitle } from 'components/ui/alert'
import { Button } from 'components/ui/button'
import { Label } from 'components/ui/label'
import { Textarea } from 'components/ui/textarea'
import { RadioGroup, RadioGroupItem } from 'components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { CALLER_HANDLES_ERRORS_CONTEXT } from 'lib/createApolloClient'
import { formatChurchLevel } from 'lib/scope-display'
import { displayError } from 'utils/errorHandler'
import { MAKE_MEMBER_INACTIVE } from '../update/UpdateMutations'

const USER_FACING_CODES = ['BAD_USER_INPUT', 'FORBIDDEN']

// SYN-227 — one church role that blocks MakeMemberInactive, as the API names
// it in the refusal's `extensions.activeRoles`. The API sends no church id:
// the list can name churches outside the caller's scope.
export type BlockingRole = {
  servantType: ServantType
  churchType: string | null
  churchName: string
}

const ROLE_LABEL_KEYS: Record<ServantType, string> = {
  Leader: 'leader',
  Admin: 'admin',
  ArrivalsAdmin: 'arrivalsAdmin',
  ArrivalsCounter: 'arrivalsCounter',
  Teller: 'teller',
}

// "Bacenta Leader", "Stream Teller", … — the same level + role wording the
// member profile's Leadership Roles card uses, translated.
export const describeBlockingRole = (
  role: BlockingRole,
  t: TFunction
): string => {
  const key = ROLE_LABEL_KEYS[role.servantType]
  const roleName = key ? t(`shared.roleLabel.${key}`) : role.servantType
  const level = formatChurchLevel(role.churchType ?? undefined, t)
  return level
    ? t('directory.memberDelete.activeRoleLabel', { level, role: roleName })
    : roleName
}

// The roles a refusal names, or null when it names none (a different refusal,
// or an API from before SYN-227) so the caller falls back to the toast. The
// API already lists each role once.
const blockingRolesOf = (extensions: unknown): BlockingRole[] | null => {
  const roles = (extensions as { activeRoles?: unknown } | undefined)
    ?.activeRoles
  if (!Array.isArray(roles)) return null
  const named = (roles as unknown[]).filter(
    (role): role is BlockingRole =>
      typeof role === 'object' &&
      role !== null &&
      typeof (role as BlockingRole).servantType === 'string' &&
      typeof (role as BlockingRole).churchName === 'string'
  )
  return named.length ? named : null
}

type DeleteMemberValues = {
  reason: string
  reasonCategory: string
}

type MemberDeleteDialogProps = {
  open: boolean
  onClose: () => void
  memberFirstName: string
  memberLastName: string
  bacentaId?: string
}

export const buildValidationSchema = (t: TFunction) =>
  Yup.object({
    reasonCategory: Yup.string().required(
      t('directory.memberDelete.reasonRequired')
    ),
    reason: Yup.string().required(
      t('directory.memberDelete.reasonTextRequired')
    ),
  })

const MemberDeleteDialog = ({
  open,
  onClose,
  memberFirstName,
  memberLastName,
  bacentaId,
}: MemberDeleteDialogProps) => {
  const { t } = useTranslation()
  const { memberId } = useContext(MemberContext)
  const { clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()
  const [blockingRoles, setBlockingRoles] = useState<BlockingRole[] | null>(
    null
  )
  // While the delete is in flight the dialog cannot be dismissed (as in
  // MemberTitleDialog): a refusal landing after an Escape or outside tap would
  // set its role list on a closed dialog and greet the next opening with it.
  const [deleting, setDeleting] = useState(false)
  const blockingRolesRef = useRef<HTMLDivElement>(null)
  const [MakeMemberInactive] = useMutation(MAKE_MEMBER_INACTIVE, {
    // SYN-208 — onDelete surfaces every GraphQL error from this mutation
    // itself, so the global "Something went wrong" toast would be a duplicate.
    context: CALLER_HANDLES_ERRORS_CONTEXT,
  })

  // The list renders above the buttons; on a phone the dialog scrolls, so
  // bring it into view rather than leave it below the fold.
  useEffect(() => {
    if (blockingRoles) {
      blockingRolesRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [blockingRoles])

  // The dialog stays mounted between openings, so a list from an earlier
  // attempt must not greet the next one.
  const handleClose = () => {
    setBlockingRoles(null)
    onClose()
  }

  const onDelete = async (
    values: DeleteMemberValues,
    helpers: FormikHelpers<DeleteMemberValues>
  ) => {
    helpers.setSubmitting(true)
    setDeleting(true)
    setBlockingRoles(null)
    try {
      const result = await MakeMemberInactive({
        variables: {
          memberId,
          reason: `${memberFirstName} ${memberLastName} was deleted: ${values.reasonCategory} - ${values.reason}`,
        },
      })

      // SYN-227 — errorPolicy: 'all' (SYN-178) resolves a rejected mutation
      // with `.errors` instead of throwing, so the server's refusal (e.g. the
      // member still holds church roles) used to fall through to the success
      // toast and navigate away with the member untouched. Keep the dialog
      // open and show the server's reason instead.
      if (result.errors?.length) {
        const [error] = result.errors
        // When the refusal names the roles in the way, list them in the
        // dialog: a toast is gone in seconds and cannot hold a list.
        const roles = blockingRolesOf(error.extensions)
        if (roles) {
          setBlockingRoles(roles)
          return
        }
        // Only user-facing codes carry copy meant for the user; anything else
        // stays generic with the errorRef, as the global toast would (SYN-178).
        if (USER_FACING_CODES.includes(String(error.extensions?.code))) {
          displayError('Cannot delete member', error)
        } else {
          const errorRef = error.extensions?.errorRef
          displayError(
            'Cannot delete member',
            new Error(
              errorRef
                ? `Something went wrong. Please try again, or contact support and quote reference ${errorRef}.`
                : 'Something went wrong. Please try again.'
            )
          )
        }
        return
      }

      handleClose()
      alertSuccess('Member has been deleted successfully')
      if (bacentaId) {
        clickCard({ __typename: 'Bacenta', id: bacentaId })
        navigate('/bacenta/displaydetails')
      } else {
        navigate('/directory/members')
      }
    } catch (e) {
      throwToSentry('Cannot delete member', e)
    } finally {
      helpers.setSubmitting(false)
      setDeleting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !deleting) handleClose()
      }}
    >
      <DialogContent
        className="max-h-[90svh] overflow-y-auto"
        showCloseButton={!deleting}
      >
        <DialogHeader>
          <DialogTitle>{t('directory.memberDelete.title')}</DialogTitle>
          <DialogDescription>
            This will mark the member as inactive. Please tell us why
            you&apos;re deleting them — this is recorded in their history.
          </DialogDescription>
        </DialogHeader>
        <Formik
          initialValues={{ reason: '', reasonCategory: '' }}
          validationSchema={buildValidationSchema(t)}
          onSubmit={onDelete}
        >
          {(formik) => (
            <Form className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Reason category <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={formik.values.reasonCategory}
                  onValueChange={(v) =>
                    formik.setFieldValue('reasonCategory', v)
                  }
                  className="gap-2"
                >
                  {DELETE_MEMBER_CATEGORY_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      htmlFor={`reason-${o.value}`}
                      className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer min-h-[44px]"
                    >
                      <RadioGroupItem
                        value={o.value}
                        id={`reason-${o.value}`}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-foreground leading-snug">
                        {o.key}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
                <ErrorMessage name="reasonCategory">
                  {(msg) => (
                    <p className="text-xs text-destructive" role="alert">
                      {msg}
                    </p>
                  )}
                </ErrorMessage>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason">
                  Additional details <span className="text-destructive">*</span>
                </Label>
                <Field
                  as={Textarea}
                  id="reason"
                  name="reason"
                  rows={3}
                  placeholder={t('directory.memberDelete.notePlaceholder')}
                />
                <ErrorMessage name="reason">
                  {(msg) => (
                    <p className="text-xs text-destructive" role="alert">
                      {msg}
                    </p>
                  )}
                </ErrorMessage>
              </div>

              {blockingRoles && (
                <div ref={blockingRolesRef}>
                  <Alert variant="destructive">
                    <CircleAlert aria-hidden="true" />
                    <AlertTitle className="line-clamp-none">
                      {t('directory.memberDelete.activeRolesTitle', {
                        name: `${memberFirstName} ${memberLastName}`.trim(),
                      })}
                    </AlertTitle>
                    <AlertDescription>
                      <p>{t('directory.memberDelete.activeRolesDescription')}</p>
                      <ul className="mt-1 w-full space-y-2">
                        {blockingRoles.map((role, index) => (
                          <li
                            // Each refusal replaces the list whole and never
                            // reorders it, and two churches can share a name.
                            key={index}
                            className="flex items-start gap-2.5"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive"
                            />
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold uppercase leading-tight tracking-wider text-destructive">
                                {describeBlockingRole(role, t)}
                              </span>
                              {role.churchName && (
                                <span className="block break-words text-sm font-medium text-foreground">
                                  {role.churchName}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={formik.isSubmitting}
                  className="min-h-[44px]"
                >
                  {t('shared.actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={formik.isSubmitting}
                  className="min-h-[44px] gap-2"
                >
                  {formik.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    'Delete Member'
                  )}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  )
}

export default MemberDeleteDialog
