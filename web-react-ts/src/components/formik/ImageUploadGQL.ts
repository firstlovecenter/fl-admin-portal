import { gql } from '@apollo/client'

export const GENERATE_PRESIGNED_URL = gql`
  mutation GeneratePresignedUrl(
    $fileName: String!
    $fileType: String!
    $fileSize: Int!
  ) {
    generatePresignedUrl(
      fileName: $fileName
      fileType: $fileType
      fileSize: $fileSize
    ) {
      presignedUrl
      publicUrl
      key
      expiresIn
    }
  }
`
