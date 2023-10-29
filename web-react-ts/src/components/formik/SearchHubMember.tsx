import { useLazyQuery } from '@apollo/client'
import { ErrorMessage } from 'formik'
import { DEBOUNCE_TIMER, throwToSentry } from 'global-utils'
import { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formik-types'
import Autosuggest from 'react-autosuggest'
import './react-autosuggest.css'
import TextError from './TextError/TextError'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'
import { HUB_MEMBER_SEARCH } from './SearchMemberQueries'
import { ChurchContext } from 'contexts/ChurchContext'

const SearchHubMember = (props: RoleBasedSearch) => {
  const { hubId } = useContext(ChurchContext)
  const [suggestions, setSuggestions] = useState([])
  const [searchString, setSearchString] = useState(props.initialValue ?? '')
  const [memberSearch, { error: memberError }] = useLazyQuery(
    HUB_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.hubs[0].memberSearch)
        return
      },
    }
  )

  const error = memberError
  throwToSentry('', error)

  const whichSearch = (searchString: string) => {
    memberSearch({
      variables: {
        id: hubId,
        key: searchString?.trim(),
      },
    })
  }

  useEffect(() => {
    const timerId = setTimeout(() => {
      whichSearch(searchString)
    }, DEBOUNCE_TIMER)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchString])

  return (
    <div>
      {props.label ? <label className="label">{props.label}</label> : null}
      {/*// @ts-ignore*/}
      <Autosuggest
        inputProps={{
          placeholder: props.placeholder,
          id: name,
          autoComplete: 'off',
          value: searchString,
          name: name,
          className: 'form-control',
          onChange: (_event, { newValue }) => {
            setSearchString(newValue)
          },
        }}
        suggestions={suggestions}
        onSuggestionsFetchRequested={async ({ value }) => {
          if (!value) {
            setSuggestions([])
          }
        }}
        onSuggestionsClearRequested={() => {
          setSuggestions([])
        }}
        onSuggestionSelected={(event, { suggestion, method }) => {
          if (method === 'enter') {
            event.preventDefault()
          }
          setSearchString(suggestion.firstName + ' ' + suggestion.lastName)

          props.setFieldValue(`${props.name}`, suggestion.id)
          props.setFieldValue('leaderEmail', suggestion?.email)
        }}
        getSuggestionValue={(suggestion) =>
          suggestion.firstName + ' ' + suggestion.lastName
        }
        highlightFirstSuggestion={true}
        renderSuggestion={(suggestion: any) => (
          <div className="combobox-control">
            <MemberAvatarWithName
              member={suggestion}
              loading={!suggestion}
              size="small"
              onClick={() => null}
            />
          </div>
        )}
      />

      {props.error && <TextError>{props.error}</TextError>}
      {/*// @ts-ignore*/}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </div>
  )
}

export default SearchHubMember