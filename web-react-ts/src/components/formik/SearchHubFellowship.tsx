'use client'

import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { ErrorMessage } from 'formik'
import { DEBOUNCE_TIMER, throwToSentry } from 'global-utils'
import { useContext, useEffect, useState } from 'react'
import Autosuggest from 'react-autosuggest'
import './react-autosuggest.css'
import { RoleBasedSearch } from './formik-types'
import { initialise } from './search-utils'
import { MEMBER_HUBFELLOWSHIP_SEARCH } from './SearchHubFellowshipQueries'
import TextError from './TextError/TextError'

const SearchHubFellowship = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState([])
  const [searchString, setSearchString] = useState(props.initialValue ?? '')
  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_HUBFELLOWSHIP_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.members[0].hubFellowshipSearch)
      },
    }
  )

  const error = memberError
  throwToSentry('', error)

  const whichSearch = (searchString: string) => {
    memberSearch({
      variables: {
        id: currentUser.id,
        key: searchString?.trim(),
      },
    })
  }

  useEffect(() => {
    setSearchString(initialise(searchString, props.initialValue))
  }, [props.initialValue])

  useEffect(() => {
    const timerId = setTimeout(() => {
      whichSearch(searchString)
    }, DEBOUNCE_TIMER)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchString, props.initialValue])

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
          name,
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
          setSearchString(suggestion.name)
          props.setFieldValue(`${props.name}`, suggestion)
        }}
        getSuggestionValue={(suggestion: any) => suggestion.name}
        highlightFirstSuggestion
        renderSuggestion={(suggestion: any) => (
          <div className="combobox-control">{suggestion.name}</div>
        )}
      />
      {props.error && <TextError>{props.error}</TextError>}
      {/*// @ts-ignore*/}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </div>
  )
}

export default SearchHubFellowship
