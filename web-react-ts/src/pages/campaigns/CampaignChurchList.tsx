import People2Icon from 'assets/icons/People2'
import MenuButton from 'components/buttons/MenuButton'
import Input from 'components/formik/Input'
import { ChurchContext } from 'contexts/ChurchContext'
import { Form, Formik, FormikHelpers } from 'formik'
import { Church } from 'global-types'
import useSetUserChurch from 'hooks/useSetUserChurch'
import React, { useContext, useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { useNavigate } from 'react-router'

type FormOptions = {
  churchSearch: string
}

type SwollenSundayChurchProps = {
  data: any
  page: string
}

const CampaignChurchList = ({ data, page }: SwollenSundayChurchProps) => {
  const churchDataLoaded = data
  const [churchData, setChurchData] = useState([])
  const { clickCard } = useContext(ChurchContext)
  const { setUserChurch } = useSetUserChurch()
  const navigate = useNavigate()

  useEffect(() => {
    setChurchData(churchDataLoaded)
  }, [churchDataLoaded])

  const initialValues = {
    churchSearch: '',
  }

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    setChurchData(
      churchDataLoaded.filter((church: Church) =>
        church.name.toLowerCase().includes(values.churchSearch.toLowerCase())
      )
    )

    onSubmitProps.setSubmitting(false)
  }

  return (
    <div>
      <Container className="mt-3">
        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          {() => (
            <Form>
              <div>
                <Input
                  className="form-control church-search search-center"
                  name="churchSearch"
                  placeholder="Search Churches"
                  aria-describedby="Church Search"
                />
              </div>
            </Form>
          )}
        </Formik>

        <div className="d-grid gap-2 text-left mt-3">
          {churchData?.map((church: Church) => {
            return (
              <MenuButton
                key={church.id}
                title={church.name}
                iconComponent={<People2Icon />}
                iconBg={true}
                noCaption
                iconCaption={church.__typename}
                color={'campaigns'}
                onClick={() => {
                  clickCard(church)
                  setUserChurch(church)
                  if (page === 'swollen-sunday') {
                    navigate(
                      `/campaigns/${church?.__typename?.toLowerCase()}/swollen-sunday/trends`
                    )
                  } else if (page === 'swollen-sunday-dashboard') {
                    navigate(`/campaigns/stream/swollen-sunday`)
                  } else if (page === 'sheep-seeking') {
                    navigate(`/campaigns/stream/sheep-seeking`)
                  } else {
                    navigate('#')
                  }
                }}
              />
            )
          })}
        </div>
      </Container>
    </div>
  )
}

export default CampaignChurchList
