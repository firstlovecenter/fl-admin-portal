import { FieldAttributes } from 'formik'
import { DocumentNode } from 'graphql'

export interface FormikComponentProps extends FieldAttributes<any> {
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
  options: { key: string; value: string }[]
}

export interface FormikSelectWithApollo extends FormikWithApolloProps {
  defaultOption?: string
  onChange?: (value: string) => void
  options?: { key: string; value: string }[]
}

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
  creativeArts?: boolean
  initialValue?: string
  setFieldValue: (
    field: string,
    value: any,
    shouldValidate?: boolean
  ) => void
}

// Form Stuff
export interface FormikInitialValues {
  name: string
  leaderId: string
  adminId?: string
  leaderName: string
  leaderEmail: string
}
