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
  title: string
  description: string
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
    title: 'Add indoor outreach venue',
    description: 'Indoor venues you can host outreach services in.',
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
    title: 'Add outdoor outreach venue',
    description: 'Open-air spaces you can run outreach in.',
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
    title: 'Add hostel',
    description: 'University hostels for tertiary outreach.',
    mutation: CREATE_HOSTEL_INFORMATION_MUTATION,
    refetchQueryName: 'Hostels',
    hasSchool: true,
    buildVariables: ({
      venueName,
      capacity,
      latitude,
      longitude,
      school,
    }) => ({
      name: venueName,
      capacity: parseInt(capacity, 10),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      school,
    }),
  },
  school: {
    title: 'Add senior high school',
    description: 'Senior high schools for school outreach.',
    mutation: CREATE_SENIOR_HIGH_SCHOOL_MUTATION,
    refetchQueryName: 'HighSchools',
    hasSchool: true,
    buildVariables: ({
      venueName,
      capacity,
      latitude,
      longitude,
      school,
    }) => ({
      name: venueName,
      capacity: parseInt(capacity, 10),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      school,
    }),
  },
}

const buildSchema = (hasSchool: boolean) => {
  const base: Record<string, Yup.AnySchema> = {
    venueName: Yup.string().required('Venue name is required'),
    capacity: Yup.number()
      .required('Cannot submit without entering number of seats')
      .integer('Cannot enter decimals')
      .positive('Capacity must be positive')
      .typeError('Please enter a valid capacity'),
    latitude: Yup.number()
      .min(-90, 'Latitude must be ≥ -90')
      .max(90, 'Latitude must be ≤ 90')
      .required('Latitude is required')
      .typeError('Please enter a valid latitude'),
    longitude: Yup.number()
      .min(-180, 'Longitude must be ≥ -180')
      .max(180, 'Longitude must be ≤ 180')
      .required('Longitude is required')
      .typeError('Please enter a valid longitude'),
  }
  if (hasSchool) {
    base.school = Yup.string().required('School name is required')
  }
  return Yup.object(base)
}

type AddVenueSheetProps = {
  kind: VenueKind
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AddVenueSheet = ({ kind, open, onOpenChange }: AddVenueSheetProps) => {
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
      throwToSentry(`Maps: failed to create ${kind} venue`, err)
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
          <SheetTitle className="text-base">{config.title}</SheetTitle>
          <SheetDescription>{config.description}</SheetDescription>
        </SheetHeader>

        <Formik
          initialValues={initialValues}
          onSubmit={onSubmit}
          validationSchema={buildSchema(config.hasSchool)}
        >
          {(formik) => (
            <Form className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                <Input
                  name="venueName"
                  label="Venue name"
                  placeholder="Enter the name of the venue"
                />
                <Input
                  name="capacity"
                  type="number"
                  label="Capacity"
                  placeholder="Number of seats"
                />
                {config.hasSchool ? (
                  <Input
                    name="school"
                    label="School"
                    placeholder="Enter the school name"
                  />
                ) : null}

                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    Location
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Open Google Maps, long-press the spot, and copy the
                    coordinates.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      name="latitude"
                      label="Latitude"
                      placeholder="5.6559"
                    />
                    <Input
                      name="longitude"
                      label="Longitude"
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
                  Cancel
                </Button>
                <SubmitButton
                  formik={formik}
                  className="w-full sm:w-auto sm:min-w-32"
                >
                  Save
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
