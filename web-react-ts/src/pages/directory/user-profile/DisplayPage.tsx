import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { getMemberDob } from 'jd-date-utils'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from 'pages/directory/display/ReadQueries'
import PlaceholderCustom from 'components/Placeholder'
import './UserProfile.css'
import AuthButton from 'components/buttons/AuthButton'
import CloudinaryImage from 'components/CloudinaryImage'
import { USER_PLACEHOLDER } from 'global-utils'
import { useNavigate } from 'react-router'
import { Button } from 'components/ui/button'

const DisplayPage = () => {
  const { currentUser, theme } = useContext(MemberContext)
  const navigate = useNavigate()

  const {
    data: bioData,
    loading,
    error,
  } = useQuery(DISPLAY_MEMBER_BIO, {
    variables: { id: currentUser?.id },
  })
  const { data: churchData } = useQuery(DISPLAY_MEMBER_CHURCH, {
    variables: { id: currentUser?.id },
  })

  const member = bioData?.members[0]
  const memberChurch = churchData?.members[0]
  const memberBirthday = getMemberDob(member)

  return (
    <div className="scroll-bottom">
      <ApolloWrapper loading={loading} error={error} data={bioData} placeholder>
        <div className="py-5">
          <div className="pt-5 text-center">
            <div className="d-flex justify-content-center">
              <div
                className="d-flex justify-content-center"
                xs={6}
                md={6}
                lg={2}
              >
                <PlaceholderCustom
                  loading={!member?.pictureUrl}
                  className="img bg-secondary m-2 rounded-circle"
                >
                  <CloudinaryImage
                    src={member?.pictureUrl || USER_PLACEHOLDER}
                    className="img bg-secondary m-2 rounded-circle"
                    size="large"
                  />
                </PlaceholderCustom>
              </div>
            </div>
          </div>

          <>
            <PlaceholderCustom
              loading={!member?.nameWithTitle}
              as="h1"
              className="text-center"
            >
              <h1 className="text-center">{`${member?.nameWithTitle}`}</h1>
            </PlaceholderCustom>
            <div className="px-5 mb-2 text-center">
              <Button
                variant="default"
                className="px-5"
                onClick={() => navigate('/user-profile/edit')}
              >
                Edit Your Profile
              </Button>
            </div>

            <PlaceholderCustom as="h6" className="text-center">
              <h6 className="text-center text-secondary">
                {memberChurch?.bacenta?.name}
              </h6>
            </PlaceholderCustom>
          </>
          <div className="py-5">
            <div className="d-flex justify-content-center">
              <div lg={8}>
                <div className="accordion">
                  <div gap={4}>
                    <div className="px-4">
                      <div className="accordion-item border-b">
                        <div className="accordion-header py-2 font-medium cursor-pointer">Bio</div>
                        <div className="accordion-body">
                          <div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                First Name
                              </div>
                              <div className="placeholder-display">
                                {member?.firstName}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Middle Name
                              </div>
                              <div className="placeholder-display">
                                {member?.middleName}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Last Name
                              </div>
                              <div className="placeholder-display">
                                {member?.lastName}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Email Address
                              </div>
                              <div className="placeholder-display">
                                {member?.email}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Date Of Birth
                              </div>
                              <div className="placeholder-display">
                                {memberBirthday && memberBirthday}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Gender
                              </div>
                              <div className="placeholder-display">
                                {member?.gender ? member?.gender.gender : null}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Marital Status
                              </div>
                              <div className="placeholder-display">
                                {member?.maritalStatus
                                  ? member?.maritalStatus.status
                                  : null}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Occupation
                              </div>
                              <div className="placeholder-display">
                                {member?.occupation
                                  ? member?.occupation.occupation
                                  : '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Phone Number
                              </div>
                              <div className="placeholder-display">
                                {member?.phoneNumber}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                WhatsApp No.
                              </div>
                              <div className="placeholder-display">
                                <a
                                  className="font-weight-bold"
                                  href={`https://wa.me/${member?.whatsappNumber}`}
                                >
                                  {member?.whatsappNumber}
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4">
                      <div className="accordion-item border-b">
                        <div className="accordion-header py-2 font-medium cursor-pointer">History</div>
                        <div className="accordion-body">
                          <div>
                            {memberChurch?.history?.length ? (
                              <Timeline
                                record={memberChurch?.history}
                                limit={3}
                              />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4">
                      <div className="accordion-item border-b">
                        <div className="accordion-header py-2 font-medium cursor-pointer">Church Groups</div>
                        <div className="accordion-body">
                          <div className="col-mt-2">
                            <div>
                              <div className="text-secondary placeholder-display">
                                Overseeing Pastor
                              </div>
                              <div className="placeholder-display">
                                {memberChurch?.bacenta.council.leader.fullName}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Bacenta
                              </div>
                              <div className="placeholder-display">
                                {memberChurch?.bacenta?.name}
                              </div>
                            </div>
                            <div>
                              <div className="text-secondary placeholder-display">
                                Ministry
                              </div>
                              <div className="placeholder-display">
                                {memberChurch?.ministry
                                  ? `${memberChurch?.ministry.name}`
                                  : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <AuthButton mobileFullSize />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ApolloWrapper>
    </div>
  )
}

export default DisplayPage
