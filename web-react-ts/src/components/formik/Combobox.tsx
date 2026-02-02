'use client'

import React, { useState, useEffect } from 'react'
import Autosuggest from 'react-autosuggest'
import { DocumentNode, useLazyQuery } from '@apollo/client'
import { ErrorMessage } from 'formik'
import TextError from './TextError/TextError'
import { DEBOUNCE_TIMER } from 'global-utils'
import { FormikComponentProps } from './formik-types'
import './Formik.css'
import './react-autosuggest.css'

interface ComboBoxProps extends FormikComponentProps {
  suggestions: string[]
  dataset: string
  modifier?: string
  queryVariable: string
  suggestionText: string
  optionsQuery: DocumentNode
  suggestionId: string
  initialValue: string
  setFieldValue: (field: string, value: any) => void
}

const Combobox = (props: ComboBoxProps) => {
  const {
    label,
    name,
    dataset,
    modifier,
    queryVariable,
    suggestionText,
    suggestionId,
    placeholder,
    optionsQuery,
    setFieldValue,
  } = props

  const [searchString, setSearchString] = useState(props.initialValue ?? '')
  const [suggestions, setSuggestions] = useState([])

  const [query] = useLazyQuery(optionsQuery, {
    onCompleted: (data) => {
      setSuggestions(
        data[`${dataset}`].map((row: any) => ({
          name: row[`${suggestionText}`],
          id: row[`${suggestionId}`],
          bacenta: row.bacenta,
          governorship: row.governorship,
        }))
      )
    },
  })

  useEffect(() => {
    const timerId = setTimeout(() => {
      query({
        variables: {
          [`${queryVariable}`]: searchString?.trim(),
        },
      })
    }, DEBOUNCE_TIMER)

    return () => {
      clearTimeout(timerId)
    }
    // eslint-disable-next-line
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
          className: 'form-control',
          onChange: (_event: any, { newValue }: any) => {
            setSearchString(newValue)
          },
        }}
        suggestions={suggestions}
        onSuggestionsFetchRequested={async ({ value }: any) => {
          if (!value) {
            setSuggestions([])
          }
          try {
            query({
              variables: {
                [`${queryVariable}`]: searchString?.trim(),
              },
            })
          } catch {
            setSuggestions([])
          }
        }}
        onSuggestionsClearRequested={() => {
          setSuggestions([])
        }}
        onSuggestionSelected={(event, { suggestion, method }: any) => {
          if (method === 'enter') {
            event.preventDefault()
          }
          setSearchString(suggestion.name)
          if (modifier === 'id-only') {
            setFieldValue(`${name}`, suggestion.id)
          } else {
            setFieldValue(`${name}`, suggestion)
          }
        }}
        getSuggestionValue={(suggestion: { name: string }) => suggestion.name}
        highlightFirstSuggestion={true}
        renderSuggestion={(suggestion) => (
          <div className="combobox-control">{suggestion.name}</div>
        )}
      />
      {props.error && <TextError>{props.error}</TextError>}
      {!props.error ?? <ErrorMessage name={name} component={TextError} />}
    </div>
  )
}

export default Combobox
