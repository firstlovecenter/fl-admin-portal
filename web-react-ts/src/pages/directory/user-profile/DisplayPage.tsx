import React, { useContext } from 'react'
import { useQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { getMemberDob } from 'lib/date-utils'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from 'pages/directory/display/ReadQueries'
import PlaceholderCustom from 'components/Placeholder'
import AuthButton from 'components/buttons/AuthButton'
import CloudinaryImage from 'components/CloudinaryImage'
import { USER_PLACEHOLDER } from 'global-utils'
import { useNavigate } from 'react-router'
import { Button } from 'components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from 'components/ui/accordion'
import './UserProfile.css'

const DisplayPage = () => {
  const { currentUser } = useContext(MemberContext)
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

  const labelClass = 'text-muted-foreground placeholder-display'
  const valueClass = 'placeholder-display'

  return (
    <div className="scroll-bottom">
      <ApolloWrapper loading={loading} error={error} data={bioData} placeholder>
        <div className="py-5">
          <div className="pt-5 text-center">
            <div className="flex justify-center">
              <PlaceholderCustom
                loading={!member?.pictureUrl}
                className="img m-2 rounded-full bg-secondary"
              >
                <CloudinaryImage
                  src={member?.pictureUrl || USER_PLACEHOLDER}
                  className="img m-2 rounded-full bg-secondary"
                  size="large"
                />
              </PlaceholderCustom>
            </div>
          </div>

          <PlaceholderCustom
            loading={!member?.nameWithTitle}
            as="h1"
            className="text-center"
          >
            <h1 className="text-center text-2xl font-bold tracking-tight">
              {member?.nameWithTitle}
            </h1>
          </PlaceholderCustom>
          <div className="mb-2 px-5 text-center">
            <Button
              className="px-8"
              onClick={() => navigate('/user-profile/edit')}
            >
              Edit Your Profile
            </Button>
          </div>

          <PlaceholderCustom as="h6" className="text-center">
            <h6 className="text-center text-sm text-muted-foreground">
              {memberChurch?.bacenta?.name}
            </h6>
          </PlaceholderCustom>

          <div className="py-5">
            <div className="mx-auto w-full max-w-screen-md px-4">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="bio" className="px-4">
                  <AccordionTrigger>Bio</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>First Name</div>
                        <div className={valueClass}>{member?.firstName}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Middle Name</div>
                        <div className={valueClass}>{member?.middleName}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Last Name</div>
                        <div className={valueClass}>{member?.lastName}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Email Address</div>
                        <div className={valueClass}>{member?.email}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Date Of Birth</div>
                        <div className={valueClass}>
                          {memberBirthday && memberBirthday}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Gender</div>
                        <div className={valueClass}>
                          {member?.gender ? member?.gender.gender : null}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Marital Status</div>
                        <div className={valueClass}>
                          {member?.maritalStatus
                            ? member?.maritalStatus.status
                            : null}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Occupation</div>
                        <div className={valueClass}>
                          {member?.occupation
                            ? member?.occupation.occupation
                            : '-'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Phone Number</div>
                        <div className={valueClass}>{member?.phoneNumber}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>WhatsApp No.</div>
                        <div className={valueClass}>
                          <a
                            className="font-bold"
                            href={`https://wa.me/${member?.whatsappNumber}`}
                          >
                            {member?.whatsappNumber}
                          </a>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history" className="px-4">
                  <AccordionTrigger>History</AccordionTrigger>
                  <AccordionContent>
                    {memberChurch?.history?.length ? (
                      <Timeline record={memberChurch?.history} limit={3} />
                    ) : null}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="church-groups" className="px-4">
                  <AccordionTrigger>Church Groups</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Overseeing Pastor</div>
                        <div className={valueClass}>
                          {memberChurch?.bacenta.council.leader.fullName}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Bacenta</div>
                        <div className={valueClass}>
                          {memberChurch?.bacenta?.name}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={labelClass}>Ministry</div>
                        <div className={valueClass}>
                          {memberChurch?.ministry
                            ? `${memberChurch?.ministry.name}`
                            : null}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-3 text-center">
                <AuthButton mobileFullSize />
              </div>
            </div>
          </div>
        </div>
      </ApolloWrapper>
    </div>
  )
}

export default DisplayPage
