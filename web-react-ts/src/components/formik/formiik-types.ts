import { DocumentNode } from 'graphql'

export interface FormikComponentProps {
  label?: string
  name: string
  className?: string
  placeholder?: string
  options?: { key: string; value: string }[]
  error?: any
}

export interface FormikSelectProps extends FormikComponentProps {
  defaultOption?: string
  onChange?: (value: string) => void
}

export interface FormikSelectWithApollo
  extends FormikWithApolloProps,
    FormikSelectProps {}

export interface FormikWithApolloProps extends FormikComponentProps {
  initialValue: string
  query?: DocumentNode
  optionsQuery: DocumentNode
  queryVariable: string
  varValue: string
  dataset: string
  modifier?: string
}

export interface RoleBasedSearch extends FormikComponentProps {
  roleBased?: boolean
  initialValue?: string
  setFieldValue: (field: string, value: any) => void
}

// Form Stuff
export interface FormikInitialValues {
  name: string
  leaderId: string
  leaderName: string
}
