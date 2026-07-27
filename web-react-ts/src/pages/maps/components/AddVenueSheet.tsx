import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client'
import type { DocumentNode } from '@apollo/client'
import { Form, Formik, type FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { Button } from 'components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from 'components/ui/sheet'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { throwToSentry } from 'global-utils'
import {
  CREATE_HOSTEL_INFORMATION_MUTATION,
  CREATE_INDOOR_OUTREACH_VENUE_MUTATION,
  CREATE_OUTDOOR_OUTREACH_VENUE_MUTATION,
  CREATE_SENIOR_HIGH_SCHOOL_MUTATION,
} from '../venues/venuesMutations'
import type { VenueKind } from '../types'

type FormValues = {
  venueName: string
  capacity: string
  latitude: string
  longitude: string
  school: string
}

type VenueConfig = {
  titleKey: string
  descriptionKey: string
  mutation: DocumentNode
  /** Operation-name string passed to Apollo's `refetchQueries`. Refetching by
   * name catches every active observer regardless of `variables` — the live
   * `VenuePanel` query uses a user-driven `sort` so an exact-variables refetch
   * would miss most cache keys. */
  refetchQueryName: string
  hasSchool: boolean
  buildVariables: (values: FormValues) => Record<string, unknown>
}

const VENUE_CONFIG: Record<VenueKind, VenueConfig> = {
  indoor: {
    titleKey: 'maps.category.indoorAdd',
    descriptionKey: 'maps.category.indoorAddHint',
    mutation: CREATE_INDOOR_OUTREACH_VENUE_MUTATION,
    refetchQueryName: 'IndoorVenues',
    hasSchool: false,
    buildVariables: ({ venueName, capacity, latitude, longitude }) => ({
      name: venueName,
      capacity: parseInt(capacity, 10),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    }),
  },
  outdoor: {
    titleKey: 'maps.category.outdoorAdd',
    descriptionKey: 'maps.category.outdoorAddHint',
    mutation: CREATE_OUTDOOR_OUTREACH_VENUE_MUTATION,
    refetchQueryName: 'OutdoorVenues',
    hasSchool: false,
    buildVariables: ({ venueName, capacity, latitude, longitude }) => ({
      name: venueName,
      capacity: parseInt(capacity, 10),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    }),
  },
  hostel: {
    titleKey: 'maps.category.hostelAdd',
    descriptionKey: 'maps.category.hostelAddHint',
    mutation: CREATE_HOSTEL_INFORMATION_MUTATION,
    refetchQueryName: 'Hostels',
    hasSchool: true,
    buildVariables: ({ venueName, capacity, latitude, longitude, school }) => ({
      name: venueName,
      capacity: parseInt(capacity, 10),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      school,
    }),
  },
  school: {
    titleKey: 'maps.category.schoolAdd',
    descriptionKey: 'maps.category.schoolAddHint',
    mutation: CREATE_SENIOR_HIGH_SCHOOL_MUTATION,
    refetchQueryName: 'HighSchools',
    hasSchool: true,
    buildVariables: ({ venueName, capacity, latitude, longitude, school }) => ({
      name: venueName,
      capacity: parseInt(capacity, 10),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      school,
    }),
  },
}

const buildSchema = (hasSchool: boolean, t: TFunction) => {
  const base: Record<string, Yup.AnySchema> = {
    venueName: Yup.string().required(t('maps.venue.nameRequired')),
    capacity: Yup.number()
      .required(t('maps.venue.capacityRequired'))
      .integer(t('maps.venue.noDecimals'))
      .positive(t('maps.venue.capacityPositive'))
      .typeError(t('maps.venue.capacityInvalid')),
    latitude: Yup.number()
      .min(-90, t('maps.venue.latMin'))
      .max(90, t('maps.venue.latMax'))
      .required(t('maps.venue.latitudeRequired'))
      .typeError(t('maps.venue.latitudeInvalid')),
    longitude: Yup.number()
      .min(-180, t('maps.venue.lngMin'))
      .max(180, t('maps.venue.lngMax'))
      .required(t('maps.venue.longitudeRequired'))
      .typeError(t('maps.venue.longitudeInvalid')),
  }
  if (hasSchool) {
    base.school = Yup.string().required(t('maps.venue.schoolRequired'))
  }
  return Yup.object(base)
}

type AddVenueSheetProps = {
  kind: VenueKind
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AddVenueSheet = ({ kind, open, onOpenChange }: AddVenueSheetProps) => {
  const { t } = useTranslation()
  const config = VENUE_CONFIG[kind]
  const [createVenue] = useMutation(config.mutation, {
    refetchQueries: [config.refetchQueryName],
    awaitRefetchQueries: true,
  })

  const initialValues: FormValues = {
    venueName: '',
    capacity: '',
    latitude: '',
    longitude: '',
    school: '',
  }

  const onSubmit = async (
    values: FormValues,
    helpers: FormikHelpers<FormValues>
  ) => {
    helpers.setSubmitting(true)
    try {
      await createVenue({ variables: config.buildVariables(values) })
      helpers.resetForm()
      onOpenChange(false)
    } catch (err) {
      throwToSentry(t('maps.venue.createError', { kind }), err)
    } finally {
      helpers.setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-base">{t(config.titleKey)}</SheetTitle>
          <SheetDescription>{t(config.descriptionKey)}</SheetDescription>
        </SheetHeader>

        <Formik
          initialValues={initialValues}
          onSubmit={onSubmit}
          validationSchema={buildSchema(config.hasSchool, t)}
        >
          {(formik) => (
            <Form className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <Input
                  name="venueName"
                  label={t('maps.venue.nameLabel')}
                  placeholder={t('maps.venue.namePlaceholder')}
                />
                <Input
                  name="capacity"
                  type="number"
                  label={t('maps.venue.capacityLabel')}
                  placeholder={t('maps.venue.capacityPlaceholder')}
                />
                {config.hasSchool ? (
                  <Input
                    name="school"
                    label={t('maps.venue.schoolLabel')}
                    placeholder={t('maps.venue.schoolPlaceholder')}
                  />
                ) : null}

                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    {t('maps.venue.location')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('maps.venue.locationHint')}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      name="latitude"
                      label={t('maps.venue.latitude')}
                      placeholder="5.6559"
                    />
                    <Input
                      name="longitude"
                      label={t('maps.venue.longitude')}
                      placeholder="-0.1670"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border bg-muted/20 p-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto sm:min-w-32"
                  onClick={() => onOpenChange(false)}
                >
                  {t('maps.venue.cancel')}
                </Button>
                <SubmitButton
                  formik={formik}
                  className="w-full sm:w-auto sm:min-w-32"
                >
                  {t('maps.venue.save')}
                </SubmitButton>
              </div>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  )
}

export default AddVenueSheet
