import React, { useState, useEffect, useContext } from 'react'
import Autosuggest from 'react-autosuggest'
import './react-autosuggest.css'
import { useLazyQuery } from '@apollo/client'
import { ErrorMessage } from 'formik'
import TextError from './TextError'
import { useNavigate } from 'react-router-dom'
import {
  STREAM_SEARCH,
  COUNCIL_SEARCH,
  CONSTITUENCY_SEARCH,
  FEDERAL_SEARCH,
} from '../../pages/directory/mobile/SearchQuery.js'
import { ChurchContext } from '../../contexts/ChurchContext'
import { capitalise, isAuthorised } from '../../global-utils'
import { MemberContext } from '../../contexts/MemberContext'

function FormikSearchbox(props) {
  const { label, name, placeholder, setFieldValue } = props

  const [searchString, setSearchString] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const getSuggestions = (data) => {
    setSuggestions(
      data.slice(0, 10).map((row) => ({
        name: row.name,
        __typename: row.__typename,
        firstName: row.firstName,
        lastName: row.lastName,
        fellowship: row.fellowship,
        bacenta: row.bacenta,

        constituency: row.constituency,
        leadsFellowship: row.leadsFellowship,
        leadsBacenta: row.leadsBacenta,
        leadsConstituency: row.leadsConstituency,
        leadsCouncil: row.leadsCouncil,
        id: row.id,
      }))
    )
  }
  const [federalSearch] = useLazyQuery(FEDERAL_SEARCH, {
    onCompleted: (data) => {
      const combinedData = [
        ...data.federalMemberSearch,
        ...data.federalConstituencySearch,
        ...data.federalBacentaSearch,
        ...data.federalFellowshipSearch,
      ]
      if (currentUser.roles.includes('adminGatheringService')) {
        getSuggestions(combinedData)
      }
    },
  })
  const [streamSearch] = useLazyQuery(STREAM_SEARCH, {
    onCompleted: (data) => {
      const combinedData = [
        ...data.streamMemberSearch,
        ...data.streamCouncilSearch,
        ...data.streamConstituencySearch,
        ...data.streamBacentaSearch,
        ...data.streamFellowshipSearch,
      ]
      if (currentUser.roles.includes('adminStream')) {
        getSuggestions(combinedData)
      }
    },
  })
  const [councilSearch] = useLazyQuery(COUNCIL_SEARCH, {
    onCompleted: (data) => {
      const combinedData = [
        ...data.councilMemberSearch,
        ...data.councilConstituencySearch,
        ...data.councilSontaSearch,
        ...data.councilBacentaSearch,
        ...data.councilFellowshipSearch,
      ]

      if (currentUser.roles.includes('adminCouncil')) {
        getSuggestions(combinedData)
      }
    },
  })
  const [constituencySearch] = useLazyQuery(CONSTITUENCY_SEARCH, {
    onCompleted: (data) => {
      const combinedData = [
        ...data.constituencyMemberSearch,
        ...data.constituencySontaSearch,
        ...data.constituencyBacentaSearch,
        ...data.constituencyFellowshipSearch,
      ]

      if (currentUser.roles.includes('adminConstituency')) {
        getSuggestions(combinedData)
      }
    },
  })

  const whichSearch = (searchString) => {
    if (isAuthorised(['adminGatheringService'], currentUser.roles)) {
      federalSearch({
        variables: { searchKey: capitalise(searchString.trim()) },
      })
    } else if (
      isAuthorised(['adminStream', 'leaderStream'], currentUser.roles)
    ) {
      streamSearch({
        variables: {
          streamId: currentUser.stream,
          searchKey: capitalise(searchString.trim()),
        },
      })
    } else if (
      isAuthorised(['adminCouncil', 'leaderCouncil'], currentUser.roles)
    ) {
      councilSearch({
        variables: {
          councilId: currentUser.council,
          searchKey: capitalise(searchString.trim()),
        },
      })
    } else if (
      isAuthorised(
        ['adminConstituency', 'leaderConstituency'],
        currentUser.roles
      )
    ) {
      constituencySearch({
        variables: {
          constituencyId: currentUser.constituency,
          searchKey: capitalise(searchString.trim()),
        },
      })
    }
  }
  useEffect(() => {
    const timerId = setTimeout(() => {
      whichSearch(searchString)
      return
    }, 200)

    return () => {
      clearTimeout(timerId)
    }
  }, [searchString])

  return (
    <div>
      {label ? (
        <label className="label" htmlFor={name}>
          {label}
        </label>
      ) : null}
      <Autosuggest
        inputProps={{
          placeholder: placeholder,
          id: name,
          autoComplete: 'off',
          value: searchString,
          name: name,
          className: 'nav-search-box',
          onChange: (_event, { newValue }) => {
            setSearchString(newValue)
          },
        }}
        suggestions={suggestions}
        onSuggestionsFetchRequested={async () => {
          setSuggestions([])
        }}
        onSuggestionsClearRequested={() => {
          setSuggestions([])
        }}
        onSuggestionSelected={(event, { suggestion, method }) => {
          if (method === 'enter') {
            event.preventDefault()
          }

          setFieldValue(`${name}`, suggestion.id)
          clickCard(suggestion)
          navigate(`/${suggestion.__typename.toLowerCase()}/displaydetails`)
        }}
        getSuggestionValue={(suggestion) =>
          `${
            suggestion.name
              ? suggestion.name
              : suggestion.firstName + ' ' + suggestion.lastName
          }`
        }
        highlightFirstSuggestion={true}
        renderSuggestion={(suggestion) => (
          <div className="combobox-control">
            <span>{`${
              suggestion.name
                ? suggestion.name
                : suggestion.firstName + ' ' + suggestion.lastName
            }`}</span>
            <br />
            {suggestion.__typename && (
              <small className="text-secondary">{`${suggestion?.__typename}`}</small>
            )}
          </div>
        )}
      />
      <ErrorMessage name={name} component={TextError} />
    </div>
  )
}

export default FormikSearchbox
