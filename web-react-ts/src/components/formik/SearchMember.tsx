import { useLazyQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { ErrorMessage } from 'formik'
import { DEBOUNCE_TIMER, isAuthorised, throwErrorMsg } from 'global-utils'
import { permitMe } from 'permission-utils'
import React, { useContext, useEffect, useState } from 'react'
import { RoleBasedSearch } from './formiik-types'
import Autosuggest from 'react-autosuggest'
import {
  COUNCIL_MEMBER_SEARCH,
  GATHERINGSERVICE_MEMBER_SEARCH,
  STREAM_MEMBER_SEARCH,
  CONSTITUENCY_MEMBER_SEARCH,
  BACENTA_MEMBER_SEARCH,
  FELLOWSHIP_MEMBER_SEARCH,
  MEMBER_MEMBER_SEARCH,
} from './SearchMemberQueries'
import TextError from './TextError/TextError'

const SearchMember = (props: RoleBasedSearch) => {
  const { currentUser } = useContext(MemberContext)
  const [suggestions, setSuggestions] = useState([])
  const [searchString, setSearchString] = useState(props.initialValue ?? '')

  const [gatheringServiceSearch, { error: gatheringServiceError }] =
    useLazyQuery(GATHERINGSERVICE_MEMBER_SEARCH, {
      onCompleted: (data) => {
        setSuggestions(data.gatheringServices[0].memberSearch)
        return
      },
    })
  const [streamSearch, { error: streamError }] = useLazyQuery(
    STREAM_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.streams[0].memberSearch)
        return
      },
    }
  )
  const [councilSearch, { error: councilError }] = useLazyQuery(
    COUNCIL_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.councils[0].memberSearch)
        return
      },
    }
  )

  const [constituencySearch, { error: constituencyError }] = useLazyQuery(
    CONSTITUENCY_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.constituencies[0].memberSearch)
        return
      },
    }
  )
  const [bacentaSearch, { error: bacentaError }] = useLazyQuery(
    BACENTA_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.bacentas[0].memberSearch)
        return
      },
    }
  )
  const [fellowshipSearch, { error: fellowshipError }] = useLazyQuery(
    FELLOWSHIP_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.fellowships[0].memberSearch)
        return
      },
    }
  )

  const [memberSearch, { error: memberError }] = useLazyQuery(
    MEMBER_MEMBER_SEARCH,
    {
      onCompleted: (data) => {
        setSuggestions(data.members[0].memberSearch)
        return
      },
    }
  )

  const error =
    gatheringServiceError ||
    streamError ||
    councilError ||
    constituencyError ||
    bacentaError ||
    fellowshipError ||
    memberError
  throwErrorMsg('', error)

  const whichSearch = (searchString: string) => {
    memberSearch({
      variables: {
        id: currentUser.id,
        key: searchString?.trim(),
      },
    })
    if (props.roleBased) {
      if (isAuthorised(permitMe('GatheringService'), currentUser.roles)) {
        gatheringServiceSearch({
          variables: {
            id: currentUser.gatheringService,
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
      } else if (isAuthorised(permitMe('Constituency'), currentUser.roles)) {
        constituencySearch({
          variables: {
            id: currentUser.constituency,
            key: searchString?.trim(),
          },
        })
      } else if (isAuthorised(permitMe('Bacenta'), currentUser.roles)) {
        bacentaSearch({
          variables: {
            id: currentUser.bacenta,
            key: searchString?.trim(),
          },
        })
      } else if (isAuthorised(permitMe('Fellowship'), currentUser.roles)) {
        fellowshipSearch({
          variables: {
            id: currentUser.fellowship,
            key: searchString?.trim(),
          },
        })
      }
    }
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
        }}
        getSuggestionValue={(suggestion) =>
          suggestion.firstName + ' ' + suggestion.lastName
        }
        highlightFirstSuggestion={true}
        renderSuggestion={(suggestion: any) => (
          <div className="combobox-control">
            {suggestion.firstName + ' ' + suggestion.lastName}
          </div>
        )}
      />

      {props.error && <TextError>{props.error}</TextError>}
      {/*// @ts-ignore*/}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </div>
  )
}

export default SearchMember
