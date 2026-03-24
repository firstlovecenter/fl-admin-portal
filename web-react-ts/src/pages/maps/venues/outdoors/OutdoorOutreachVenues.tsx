import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@apollo/client'
import { GET_OUTDOOR_VENUES } from '../venuesQueries'
import { SORT_BY_SELECT_OPTIONS } from '../../map-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Formik, FormikHelpers, Form } from 'formik'
import Input from 'components/formik/Input'
import Select from 'components/formik/Select'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { AiOutlinePlusCircle } from 'react-icons/ai'
import { FiUsers } from 'react-icons/fi'
import '../Venues.css'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'

interface FormOptions {
  venueSearch: string
  sort: string
}
interface VenueOptions {
  name: ''
  capacity: ''
}

const OutdoorOutreachVenues = () => {
  const [offset, setOffset] = useState(0)
  const [sortBy, setSortBy] = useState({})
  const [selectedValue, setSelectedValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const limit = 20

  const initialValues: FormOptions = {
    venueSearch: '',
    sort: '',
  }

  const { loading, error, data } = useQuery(GET_OUTDOOR_VENUES, {
    variables: {
      options: {
        limit,
        offset: offset * limit,
        sort: sortBy ? [sortBy] : [],
      },
    },
  })

  const venues: VenueOptions[] = useMemo(
    () => data?.outdoorVenues,
    [data, offset]
  )

  const sortVenues = (sort: string) => {
    switch (sort) {
      case 'Name':
        setSortBy({ name: 'ASC' })
        break
      case 'Capacity':
        setSortBy({ capacity: 'ASC' })
        break
      default:
        setSortBy({})
        break
    }
  }

  useEffect(() => {
    selectedValue && sortVenues(selectedValue)
  }, [selectedValue])

  const handleSubmit = (
    values: FormOptions,
    { setSubmitting }: FormikHelpers<FormOptions>
  ) => setSubmitting(false)

  const filteredVenues = useMemo(() => {
    if (!searchQuery) return venues
    return venues.filter((venue: VenueOptions) =>
      venue.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [venues, searchQuery])

  return (
    <div>
      <HeadingPrimary className="d-flex justify-content-center mb-5">
        Outdoor Outreach Venues
      </HeadingPrimary>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ values }) => {
          return (
            <Form className="mb-2">
              <div>
                <div className="col">
                  <Input
                    name="venueSearch"
                    className="form-control"
                    placeholder="Search..."
                  />
                </div>
                <div className="col-4 d-grid align-items-center gap-2">
                  <Select
                    options={SORT_BY_SELECT_OPTIONS}
                    name="sort"
                    defaultOption="Sort by"
                    onChange={(e: any) => {
                      setSearchQuery(values?.venueSearch)
                      setSelectedValue(e.target.value)
                    }}
                  />
                </div>
              </div>
            </Form>
          )
        }}
      </Formik>
      <Button
        variant="default"
        className="p-2 d-flex justify-content-center align-items-center text-center gap-2 w-100"
        onClick={() => {
          navigate(`/maps/outdoor-outreach-venues/add`)
        }}
      >
        <AiOutlinePlusCircle />
        <span className="text-capitalize">add new venue</span>
      </Button>
      <hr />
      <ApolloWrapper loading={loading} error={error} data={data}>
        <div>
          {filteredVenues?.map((venue: VenueOptions, index: number) => (
            <Card className="mb-2" key={index}>
              <CardContent className="venue-font">
                <div className="mb-1">
                  <span>{venue?.name}</span>
                </div>
                <div className="mb-1">
                  <FiUsers color="grey" className="fs-6 me-2" />
                  <span>{venue?.capacity}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ApolloWrapper>

      <div className="d-flex justify-content-center px-5 mt-4">
        <Button
          variant="default"
          onClick={() => setOffset((prev) => prev - 1)}
          disabled={offset === 0}
        >
          Previous
        </Button>
        <Button
          className="px-4"
          variant="default"
          disabled={!(venues && venues.length >= limit)}
          onClick={() => setOffset((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default OutdoorOutreachVenues
