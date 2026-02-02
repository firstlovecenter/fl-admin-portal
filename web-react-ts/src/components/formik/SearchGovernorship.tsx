'use client'

import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { ErrorMessage } from 'formik'
import { DEBOUNCE_TIMER, isAuthorised, throwToSentry } from 'global-utils'
import { permitMe } from 'permission-utils'
import React, { useContext, useEffect, useState } from 'react'
import Autosuggest from 'react-autosuggest'
import './react-autosuggest.css'
import { RoleBasedSearch } from './formik-types'
import { initialise } from './search-utils'
import {
  CAMPUS_GOVERNORSHIP_SEARCH,
  STREAM_GOVERNORSHIP_SEARCH,
  MEMBER_GOVERNORSHIP_SEARCH,
  COUNCIL_GOVERNORSHIP_SEARCH,
} from './SearchGovernorshipQueries'
import TextError from './TextError/TextError'

const SearchGovernorship = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState([])
  const [searchString, setSearchString] = useState(props.initialValue ?? '')

  const [campusSearch, { error: campusError }] = useLazyQuery(
    CAMPUS_GOVERNORSHIP_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.campuses[0].governorshipSearch)
        return
      },
    }
  )
  const [streamSearch, { error: streamError }] = useLazyQuery(
    STREAM_GOVERNORSHIP_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.streams[0].governorshipSearch)
        return
      },
    }
  )
  const [councilSearch, { error: councilError }] = useLazyQuery(
    COUNCIL_GOVERNORSHIP_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.councils[0].governorshipSearch)
        return
      },
    }
  )

  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_GOVERNORSHIP_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.members[0].governorshipSearch)
        return
      },
    }
  )

  const error = memberError || campusError || streamError || councilError
  throwToSentry('', error)

  const whichSearch = (searchString: string) => {
    memberSearch({
      variables: {
        id: currentUser.id,
        key: searchString?.trim(),
      },
    })
    if (props.roleBased) {
      if (isAuthorised(permitMe('Campus'), currentUser.roles)) {
        campusSearch({
          variables: {
            id: currentUser.campus,
            key: searchString?.trim(),
          },
        })
      } else if (isAuthorised(permitMe('Stream'), currentUser.roles)) {
        streamSearch({
          variables: {
            id: currentUser.stream,
            key: searchString?.trim(),
          },
        })
      } else if (isAuthorised(permitMe('Council'), currentUser.roles)) {
        councilSearch({
          variables: {
            id: currentUser.council,
            key: searchString?.trim(),
          },
        })
      }
    }
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
          setSearchString(suggestion.name)
          props.setFieldValue(`${props.name}`, suggestion)
        }}
        getSuggestionValue={(suggestion) => suggestion.name}
        highlightFirstSuggestion={true}
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

export default SearchGovernorship
