import React, { useContext, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MemberTable from './MemberTable'
import { memberFilter } from './member-filter-utils'
import { debounce } from '../../global-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import PlaceholderCustom from 'components/Placeholder'
import { ChevronDown } from 'lucide-react'
import './MembersGrid.css'
import Filters from './Filters'
import { Form, Formik } from 'formik'
import Input from 'components/formik/Input'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'

const MembersGrid = (props) => {
  const { data, error, loading, title } = props
  const { filters } = useContext(ChurchContext)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  })

  let numberOfRecords = Math.round(
    ((dimensions.height - 96 - 30) * (0.75 * dimensions.width - 46)) /
      (160 * 126)
  )
  const memberDataLoaded = data ? memberFilter(data, filters) : null
  const [memberData, setMemberData] = useState([])

  useEffect(() => {
    setMemberData(memberDataLoaded)
  }, [data, filters])

  //NavBar takes 70px of the height and side bar takes 25% of the width

  useEffect(() => {
    const debouncedHandleResize = debounce(function handleResize() {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      })
    }, 500)

    window.addEventListener('resize', debouncedHandleResize)

    return () => {
      window.removeEventListener('resize', debouncedHandleResize)
    }
  })

  const initialValues = {
    memberSearch: '',
  }

  const onSubmit = (values, onSubmitProps) => {
    onSubmitProps.setSubmitting(true)
    setMemberData(
      memberDataLoaded.filter((member) =>
        (member.firstName + member.lastName)
          .toLowerCase()
          .includes(values.memberSearch.toLowerCase())
      )
    )

    onSubmitProps.setSubmitting(false)
  }

  return (
    <>
      <div className="col col-md-9 p-0 text-center">
        <PlaceholderCustom loading={!data || loading} xs={10}>
          <div className="container mx-auto px-4">
            <h3 className="page-header">{title}</h3>
          </div>
        </PlaceholderCustom>
        <div className="justify-content-center flex-wrap flex-md-nowrap align-items-center">
          <PlaceholderCustom loading={!data || loading} element="h5">
            <h5 className="data-number">{`${
              memberData?.length || 0
            } Members`}</h5>
          </PlaceholderCustom>
        </div>
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          {() => (
            <Form>
              <div className="align-middle">
                <Input
                  className="form-control member-search"
                  name="memberSearch"
                  placeholder="Search Members"
                  aria-describedby="Member Search"
                />
              </div>
            </Form>
          )}
        </Formik>

        <div>
          <div className="flex justify-between py-2">
            <div className="my-auto">
              <RoleView
                roles={[
                  ...permitLeaderAdmin('Bacenta'),
                  ...permitLeaderAdmin('Hub'),
                ]}
              >
                <Link to="/member/addmember" className="just-text-btn">
                  ADD NEW
                </Link>
              </RoleView>
            </div>
            <div></div>
            <div className="my-auto">
              <span
                className="just-text-btn cursor-pointer flex items-center gap-1"
                onClick={() => setFiltersOpen((prev) => !prev)}
              >
                FILTERS <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </span>
            </div>
          </div>
          {filtersOpen && (
            <div className="py-2">
              <Filters ToggleAccordion={() => setFiltersOpen(false)} />
            </div>
          )}
        </div>
      </div>
      <MemberTable
        data={memberData}
        error={error}
        loading={!data || loading}
        numberOfRecords={numberOfRecords}
      />
    </>
  )
}

export default MembersGrid
