import { useLazyQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { MemberContext } from 'contexts/MemberContext'
import { getWeekNumber, isAuthorised } from 'global-utils'
import React, { useContext, useEffect } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { CONSTITUENCY_FORM_DEFAULTERS_LIST } from './DefaultersQueries'
import DefaulterCard from './DefaulterCard'

const FormDefaulters = () => {
  const { currentUser } = useContext(MemberContext)
  const [formDefaulters, { data }] = useLazyQuery(
    CONSTITUENCY_FORM_DEFAULTERS_LIST
  )

  useEffect(() => {
    if (
      isAuthorised(
        ['adminTown', 'leaderTown', 'adminCampus', 'leaderCampus'],
        currentUser.roles
      )
    ) {
      formDefaulters({
        variables: {
          id: currentUser.constituency,
        },
      })
    }
  }, [currentUser.constituency])

  const constituency = data?.constituencies[0]

  return (
    <Container>
      <HeadingPrimary
        loading={!constituency}
      >{`${constituency?.name} ${constituency?.__typename}`}</HeadingPrimary>
      <HeadingSecondary>
        {`Fellowships That Have Not Filled The Form This Week (Week ${getWeekNumber()})`}
      </HeadingSecondary>

      <PlaceholderCustom
        as="h6"
        loading={!constituency?.formDefaultersThisWeek.length}
      >
        <h6>{`Number of Defaulters: ${constituency?.formDefaultersThisWeek.length}`}</h6>
      </PlaceholderCustom>

      <Row>
        {constituency?.formDefaultersThisWeek.map((defaulter, i) => (
          <Col key={i} xs={12} className="mb-3">
            <DefaulterCard defaulter={defaulter} />
          </Col>
        ))}
      </Row>
    </Container>
  )
}

export default FormDefaulters
