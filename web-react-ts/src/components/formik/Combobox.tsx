import React, { useState, useEffect } from 'react'
import Autosuggest from 'react-autosuggest'
import { DocumentNode, useLazyQuery } from '@apollo/client'
import { ErrorMessage, useField } from 'formik'
import { Search } from 'lucide-react'
import { Label } from 'components/ui/label'
import { DEBOUNCE_TIMER } from 'global-utils'
import TextError from './TextError/TextError'
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
    error,
  } = props

  const [searchString, setSearchString] = useState(props.initialValue ?? '')
  const [suggestions, setSuggestions] = useState([])
  const [, meta] = useField(name)

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

  const hasError = Boolean(error) || Boolean(meta.touched && meta.error)

  return (
    <div className="space-y-1.5">
      {label ? <Label htmlFor={name}>{label}</Label> : null}
      <div className="relative combobox-with-icon">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Autosuggest
          inputProps={{
            placeholder,
            id: name,
            autoComplete: 'off',
            value: searchString,
            name,
            'aria-invalid': hasError || undefined,
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
          highlightFirstSuggestion
          renderSuggestion={(suggestion) => (
            <div className="combobox-control">{suggestion.name}</div>
          )}
        />
      </div>
      {error ? (
        <TextError>{error}</TextError>
      ) : (
        <ErrorMessage name={name} component={TextError} />
      )}
    </div>
  )
}

export default Combobox
