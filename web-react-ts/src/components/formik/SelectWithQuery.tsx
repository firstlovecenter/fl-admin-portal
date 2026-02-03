import { Field, ErrorMessage } from 'formik'
import { makeSelectOptions } from '../../global-utils'
import TextError from './TextError/TextError'
import { useQuery } from '@apollo/client'
import { useAuth } from '@/contexts/AuthContext'
import PlaceholderCustom from 'components/Placeholder'
import { FormikSelectWithApollo } from './formik-types'

function SelectWithQuery(props: FormikSelectWithApollo) {
  const {
    label,
    name,
    modifier,
    queryVariable,
    optionsQuery,
    varValue,
    dataset,
    defaultOption,
    ...rest
  } = props

  const { data } = useQuery(optionsQuery, {
    variables: {
      [`${queryVariable}`]: varValue,
    },
  })
  const { isAuthenticated } = useAuth()

  let options
  if (data?.governorships?.length) {
    options = makeSelectOptions(data.governorships[0].bacentas)
  } else {
    options = data ? makeSelectOptions(data[dataset ? `${dataset}` : '']) : []
  }

  return (
    <div>
      {label ? (
        <PlaceholderCustom loading={!isAuthenticated}>
          <label className="label" htmlFor={name}>
            {label}
          </label>
        </PlaceholderCustom>
      ) : null}
      <Field
        as="select"
        id={name}
        name={name}
        className="form-control"
        {...rest}
      >
        <option value="" disabled defaultValue="true">
          {defaultOption}
        </option>
        {options?.map((option) => {
          return (
            <option
              key={option.value}
              value={modifier === 'filter' ? option.key : option.value}
            >
              {option.key}
            </option>
          )
        })}
      </Field>
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default SelectWithQuery
