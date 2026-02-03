import { ApolloError } from '@apollo/client'
import React from 'react'
import ErrorScreen from './ErrorScreen'
import LoadingScreen from './LoadingScreen'

type ApolloWrapperPropsType = {
  placeholder?: boolean
  data: any
  loading: boolean
  error?: ApolloError | undefined
  children: JSX.Element
}

const ApolloWrapper = (props: ApolloWrapperPropsType) => {
  const { data, loading, error, placeholder } = props

  if (error) {
    return <ErrorScreen error={error} />
  }
  if (data || placeholder) {
    return <>{props.children}</>
  }
  if (loading) {
    return <LoadingScreen />
  }

  return <LoadingScreen />
}

export default ApolloWrapper
