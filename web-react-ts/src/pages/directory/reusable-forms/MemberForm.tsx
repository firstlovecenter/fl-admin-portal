import { useQuery } from '@apollo/client'
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BadgePlus,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Trash2,
  User,
} from 'lucide-react'
import {
  StickyPageHeader,
  StickyPageHeaderActions,
} from 'components/shell/StickyPageHeader'
import {
  GENDER_OPTIONS,
  isAuthorised,
  makeSelectOptions,
  MARITAL_STATUS_OPTIONS,
  PHONE_NUM_REGEX,
} from 'global-utils'
import { GET_CAMPUS_BASONTAS } from 'queries/ListQueries'
import { permitAdmin, permitLeaderAdmin } from 'permission-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import RoleView from 'auth/RoleView'
import SearchBacenta from 'components/formik/SearchBacenta'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select'
import { Skeleton } from 'components/ui/skeleton'
import { cn } from 'components/lib/utils'
import usePopup from 'hooks/usePopup'
import { CreateMemberFormOptions } from '../create/CreateMember'
import MemberAvatarUpload from './MemberAvatarUpload'
import MemberDeleteDialog from './MemberDeleteDialog'
import MemberTitleDialog from './MemberTitleDialog'

type MemberFormProps = {
  initialValues: CreateMemberFormOptions
  onSubmit: (
    values: CreateMemberFormOptions,
    onSubmitProps: FormikHelpers<CreateMemberFormOptions>
  ) => void
  loading: boolean
  update?: boolean
}

// ── Section card ─────────────────────────────────────────────────────────────

type SectionProps = {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

const Section = ({ title, icon, children }: SectionProps) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="px-4 lg:px-5 py-3 border-b border-border flex items-center gap-2">
      <span className="text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
    </div>
    <div className="p-4 lg:p-5 space-y-4">{children}</div>
  </div>
)

const FieldMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => (
      <p className="text-xs text-destructive" role="alert">
        {msg}
      </p>
    )}
  </ErrorMessage>
)

// ── Loading skeleton ─────────────────────────────────────────────────────────

const FormSkeleton = () => (
  <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
    <StickyPageHeader>
      <div className="flex items-center gap-3">
        <div className="min-w-0 space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-52" />
        </div>
      </div>
    </StickyPageHeader>
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5 lg:py-8">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
)

// ── MemberForm ───────────────────────────────────────────────────────────────

const MemberForm = ({
  initialValues,
  onSubmit,
  loading,
  update,
}: MemberFormProps) => {
  const { t } = useTranslation()
  const { currentUser } = useContext(MemberContext)
  const { campusId } = useContext(ChurchContext)
  const { isOpen, togglePopup } = usePopup()
  const [titleDialogOpen, setTitleDialogOpen] = useState(false)

  const { data: basontasData, loading: basontasLoading } = useQuery(
    GET_CAMPUS_BASONTAS,
    { variables: { id: campusId } }
  )

  const canChangeUniques = () => {
    if (!update) return true
    return isAuthorised(permitAdmin('Governorship'), currentUser.roles)
  }

  const validationSchema = Yup.object({
    pictureUrl: Yup.string().required(
      t('directory.memberForm.validation.pictureRequired')
    ),
    firstName: Yup.string().required(
      t('directory.memberForm.validation.firstNameRequired')
    ),
    lastName: Yup.string().required(
      t('directory.memberForm.validation.lastNameRequired')
    ),
    gender: Yup.string().required(
      t('directory.memberForm.validation.genderRequired')
    ),
    email: Yup.string()
      .email(t('directory.memberForm.validation.invalidEmail'))
      .trim(),
    maritalStatus: Yup.string().required(
      t('directory.memberForm.validation.maritalStatusRequired')
    ),
    dob: Yup.date()
      .max(new Date(), t('directory.memberForm.validation.dobFuture'))
      .required(t('directory.memberForm.validation.dobRequired')),
    phoneNumber: Yup.string()
      .matches(
        PHONE_NUM_REGEX,
        t('directory.memberForm.validation.phoneFormat')
      )
      .required(t('directory.memberForm.validation.phoneRequired')),
    whatsappNumber: Yup.string()
      .required(t('directory.memberForm.validation.whatsappRequired'))
      .matches(
        PHONE_NUM_REGEX,
        t('directory.memberForm.validation.phoneFormat')
      ),
    visitationArea: Yup.string().required(
      t('directory.memberForm.validation.locationRequired')
    ),
    bacenta: Yup.object().required(
      t('directory.memberForm.validation.bacentaRequired')
    ),
  })

  if (basontasLoading || loading) {
    return <FormSkeleton />
  }

  const basontaArray =
    makeSelectOptions(basontasData?.campuses?.[0]?.basontas) || []
  const basontaOptions = [{ key: 'None', value: 'None' }, ...basontaArray]
  const initials = `${(initialValues.firstName?.[0] ?? '').toUpperCase()}${(
    initialValues.lastName?.[0] ?? ''
  ).toUpperCase()}`

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnMount
    >
      {(formik) => (
        <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
          {/* Sticky top action bar */}
          <StickyPageHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('directory.memberForm.directoryLabel')}
                  </p>
                  <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
                    {update ? (
                      <>
                        {t('directory.memberForm.editTitle')}{' '}
                        <span className="text-members">
                          {t('directory.memberForm.memberLabel')}
                        </span>
                      </>
                    ) : (
                      <>
                        {t('directory.memberForm.registerTitle')}{' '}
                        <span className="text-members">
                          {t('directory.memberForm.memberLabel')}
                        </span>
                      </>
                    )}
                  </h1>
                </div>
              </div>

              {update && (
                <StickyPageHeaderActions>
                  <RoleView roles={permitAdmin('Denomination')}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTitleDialogOpen(true)}
                      className="min-h-[44px] gap-1.5"
                    >
                      <BadgePlus className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">
                        {t('directory.memberForm.addTitle')}
                      </span>
                    </Button>
                  </RoleView>
                  <RoleView roles={permitLeaderAdmin('Governorship')}>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={togglePopup}
                      className="min-h-[44px] gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">
                        {t('directory.memberForm.delete')}
                      </span>
                    </Button>
                  </RoleView>
                </StickyPageHeaderActions>
              )}
            </div>
          </StickyPageHeader>

          {/* Body */}
          <Form>
            <div className="max-w-6xl mx-auto px-4 lg:px-6 py-5 lg:py-8">
              <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr] lg:items-start">
                <MemberAvatarUpload
                  name="pictureUrl"
                  value={formik.values.pictureUrl}
                  initials={initials}
                  error={
                    formik.touched.pictureUrl
                      ? (formik.errors.pictureUrl as string | undefined)
                      : undefined
                  }
                  setFieldValue={formik.setFieldValue}
                />

                <div className="space-y-4">
                  {canChangeUniques() && (
                    <Section
                      title={t('directory.memberForm.basicInformation')}
                      icon={<User className="h-4 w-4" />}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="firstName">
                            {t('directory.memberForm.firstNameLabel')}{' '}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Field
                            as={Input}
                            id="firstName"
                            name="firstName"
                            placeholder={t(
                              'directory.memberForm.firstNamePlaceholder'
                            )}
                            autoComplete="given-name"
                            aria-invalid={
                              !!(
                                formik.touched.firstName &&
                                formik.errors.firstName
                              )
                            }
                          />
                          <FieldMessage name="firstName" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName">
                            {t('directory.memberForm.lastNameLabel')}{' '}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Field
                            as={Input}
                            id="lastName"
                            name="lastName"
                            placeholder={t(
                              'directory.memberForm.lastNamePlaceholder'
                            )}
                            autoComplete="family-name"
                            aria-invalid={
                              !!(
                                formik.touched.lastName &&
                                formik.errors.lastName
                              )
                            }
                          />
                          <FieldMessage name="lastName" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="middleName">
                          {t('directory.memberForm.middleNameLabel')}
                        </Label>
                        <Field
                          as={Input}
                          id="middleName"
                          name="middleName"
                          placeholder={t(
                            'directory.memberForm.middleNamePlaceholder'
                          )}
                          autoComplete="additional-name"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="gender">
                            {t('directory.memberForm.genderLabel')}{' '}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={formik.values.gender}
                            onValueChange={(v) =>
                              formik.setFieldValue('gender', v)
                            }
                          >
                            <SelectTrigger
                              id="gender"
                              className="w-full"
                              aria-invalid={
                                !!(
                                  formik.touched.gender && formik.errors.gender
                                )
                              }
                            >
                              <SelectValue
                                placeholder={t(
                                  'directory.memberForm.selectGender'
                                )}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {GENDER_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldMessage name="gender" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="dob">
                            {t('directory.memberForm.dobLabel')}{' '}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Field
                            as={Input}
                            id="dob"
                            name="dob"
                            type="date"
                            aria-invalid={
                              !!(formik.touched.dob && formik.errors.dob)
                            }
                          />
                          <FieldMessage name="dob" />
                        </div>
                      </div>
                    </Section>
                  )}

                  {canChangeUniques() && (
                    <Section
                      title={t('directory.memberForm.contact')}
                      icon={<Phone className="h-4 w-4" />}
                    >
                      <div className="space-y-1.5">
                        <Label htmlFor="phoneNumber">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-arrivals" />
                            {t('directory.memberForm.phoneNumberLabel')}
                            <span className="text-destructive">*</span>
                          </span>
                        </Label>
                        <Field
                          as={Input}
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+233 24 123 4567"
                          className="font-mono"
                          aria-invalid={
                            !!(
                              formik.touched.phoneNumber &&
                              formik.errors.phoneNumber
                            )
                          }
                        />
                        <FieldMessage name="phoneNumber" />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="whatsappNumber">
                          <span className="inline-flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5 text-banking" />
                            {t('directory.memberForm.whatsappNumberLabel')}
                            <span className="text-destructive">*</span>
                          </span>
                        </Label>
                        <Field
                          as={Input}
                          id="whatsappNumber"
                          name="whatsappNumber"
                          type="tel"
                          inputMode="tel"
                          placeholder="+233 24 123 4567"
                          className="font-mono"
                          aria-invalid={
                            !!(
                              formik.touched.whatsappNumber &&
                              formik.errors.whatsappNumber
                            )
                          }
                        />
                        <FieldMessage name="whatsappNumber" />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {t('directory.memberForm.emailAddressLabel')}
                            <span className="text-muted-foreground text-xs font-normal">
                              {update
                                ? '*'
                                : t('directory.memberForm.optional')}
                            </span>
                          </span>
                        </Label>
                        <Field
                          as={Input}
                          id="email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="name@example.com"
                          aria-invalid={
                            !!(formik.touched.email && formik.errors.email)
                          }
                        />
                        <FieldMessage name="email" />
                      </div>
                    </Section>
                  )}

                  <Section
                    title={t('directory.memberForm.personal')}
                    icon={<User className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="maritalStatus">
                          {t('directory.memberForm.maritalStatusLabel')}{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formik.values.maritalStatus}
                          onValueChange={(v) =>
                            formik.setFieldValue('maritalStatus', v)
                          }
                        >
                          <SelectTrigger
                            id="maritalStatus"
                            className="w-full"
                            aria-invalid={
                              !!(
                                formik.touched.maritalStatus &&
                                formik.errors.maritalStatus
                              )
                            }
                          >
                            <SelectValue
                              placeholder={t(
                                'directory.memberForm.selectStatus'
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {MARITAL_STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.key}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldMessage name="maritalStatus" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="occupation">
                          {t('directory.memberForm.occupationLabel')}
                        </Label>
                        <Field
                          as={Input}
                          id="occupation"
                          name="occupation"
                          placeholder={t(
                            'directory.memberForm.occupationPlaceholder'
                          )}
                        />
                      </div>
                    </div>
                  </Section>

                  <Section
                    title={t('directory.memberForm.churchMembership')}
                    icon={<MapPin className="h-4 w-4" />}
                  >
                    {!update && (
                      <div className="space-y-1.5">
                        <Label htmlFor="visitationArea">
                          {t('directory.memberForm.homeLocationLabel')}{' '}
                          <span className="text-destructive">*</span>
                          <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                            {t('directory.memberForm.idlVisitationHint')}
                          </span>
                        </Label>
                        <Field
                          as={Input}
                          id="visitationArea"
                          name="visitationArea"
                          placeholder={t(
                            'directory.memberForm.idlVisitationPlaceholder'
                          )}
                          aria-invalid={
                            !!(
                              formik.touched.visitationArea &&
                              formik.errors.visitationArea
                            )
                          }
                        />
                        <FieldMessage name="visitationArea" />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <SearchBacenta
                        name="bacenta"
                        label={`${t('shared.churchLevel.Bacenta')} *`}
                        placeholder={t(
                          'directory.memberForm.searchBacentaPlaceholder'
                        )}
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Bacenta Name"
                        initialValue={initialValues?.bacenta?.name || null}
                        error={
                          formik.errors.bacenta &&
                          (formik.errors.bacenta as string)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="basonta">Basonta</Label>
                      <Select
                        value={formik.values.basonta || ''}
                        onValueChange={(v) =>
                          formik.setFieldValue('basonta', v)
                        }
                      >
                        <SelectTrigger id="basonta" className="w-full">
                          <SelectValue
                            placeholder={t(
                              'directory.memberForm.selectBasonta'
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {basontaOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Section>

                  {/* Submit */}
                  <div className="rounded-xl border border-border bg-card p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {t('directory.memberForm.requiredFieldsPrefix')}{' '}
                      <span className="text-destructive font-medium">*</span>{' '}
                      {t('directory.memberForm.requiredFieldsSuffix')}
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={formik.isSubmitting}
                      className={cn(
                        'min-h-[48px] w-full sm:w-auto px-8 gap-2',
                        !formik.isValid && 'opacity-60'
                      )}
                    >
                      {formik.isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('directory.memberForm.submitting')}
                        </>
                      ) : update ? (
                        t('directory.memberForm.saveChanges')
                      ) : (
                        t('directory.memberForm.registerMember')
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Form>

          <MemberDeleteDialog
            open={isOpen}
            onClose={togglePopup}
            memberFirstName={initialValues.firstName}
            memberLastName={initialValues.lastName}
            bacentaId={initialValues.bacenta?.id}
          />

          <MemberTitleDialog
            open={titleDialogOpen}
            onClose={() => setTitleDialogOpen(false)}
          />
        </div>
      )}
    </Formik>
  )
}

export default MemberForm
