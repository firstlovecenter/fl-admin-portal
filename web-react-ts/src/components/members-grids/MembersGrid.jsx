import React, { useContext, useState, useEffect } from 'react'
import Link from 'next/link'
import MemberTable from './MemberTable'
import { memberFilter } from './member-filter-utils'
import { debounce } from '../../global-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import PlaceholderCustom from 'components/Placeholder'
import {
  Accordion,
  Col,
  Container,
  Row,
  useAccordionButton,
} from 'react-bootstrap'
import { CaretDownFill } from 'react-bootstrap-icons'
import './MembersGrid.css'
import Filters from './Filters'
import { Form, Formik } from 'formik'
import Input from 'components/formik/Input'
import RoleView from 'auth/RoleView'
import { permitLeaderAdmin } from 'permission-utils'

const MembersGrid = (props) => {
  const { data, error, loading, title } = props
  const { filters } = useContext(ChurchContext)
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

  function CustomToggle({ children, eventKey, ...rest }) {
    const decoratedOnClick = useAccordionButton(eventKey)

    return (
      <span {...rest} onClick={decoratedOnClick}>
        {children}
      </span>
    )
  }

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
          <Container>
            <h3 className="page-header">{title}</h3>
          </Container>
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

        <Accordion>
          <Row className="justify-content-between py-2">
            <Col className="my-auto">
              <RoleView
                roles={[
                  'sheepseekerStream',
                  ...permitLeaderAdmin('Bacenta'),
                  ...permitLeaderAdmin('Hub'),
                ]}
              >
                <Link href="/member/addmember" className="just-text-btn">
                  ADD NEW
                </Link>
              </RoleView>
            </Col>
            <Col></Col>
            <Col className="my-auto">
              <CustomToggle className="just-text-btn" eventKey="0">
                FILTERS <CaretDownFill />
              </CustomToggle>
            </Col>
          </Row>
          <Accordion.Item eventKey="0">
            <Accordion.Body>
              <Filters ToggleAccordion={CustomToggle} />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
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
