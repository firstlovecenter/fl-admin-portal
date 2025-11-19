import { FetchResult } from '@apollo/client'

export interface UploadToS3Props {
  file: File
  generatePresignedUrl: (options: {
    variables: {
      fileName: string
      fileType: string
      fileSize: number
    }
  }) => Promise<
    FetchResult<{
      generatePresignedUrl: {
        presignedUrl: string
        publicUrl: string
        key: string
        expiresIn: number
      }
    }>
  >
}

export const uploadToS3 = async ({
  file,
  generatePresignedUrl,
}: UploadToS3Props): Promise<string> => {
  try {
    // Validate file type (consistent with backend validation)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ]

    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error(
        `File type not allowed. Supported types: ${allowedMimeTypes.join(', ')}`
      )
    }

    // Validate file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxFileSize) {
      throw new Error(
        `File too large. Maximum size: ${maxFileSize / (1024 * 1024)}MB`
      )
    }

    // Sanitize file name by removing all spaces
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '')

    // Get presigned URL from GraphQL
    const response = await generatePresignedUrl({
      variables: {
        fileName: sanitizedFileName,
        fileType: file.type,
        fileSize: file.size,
      },
    })

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0]?.message || 'Failed to get upload URL')
    }

    if (!response.data?.generatePresignedUrl) {
      throw new Error('Failed to generate presigned URL')
    }

    const { presignedUrl, publicUrl } = response.data.generatePresignedUrl

    // Upload file directly to S3 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
    })

    if (!uploadResponse.ok) {
      // Get detailed error response from S3
      let errorDetails = uploadResponse.statusText
      try {
        const errorText = await uploadResponse.text()
        if (errorText) {
          // eslint-disable-next-line no-console
          console.error('S3 Error Response Body:', errorText)
          errorDetails = errorText
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Could not read error response body:', e)
      }

      throw new Error(
        `S3 Upload failed: ${uploadResponse.status} ${
          uploadResponse.statusText
        }${
          errorDetails !== uploadResponse.statusText ? ` - ${errorDetails}` : ''
        }`
      )
    }

    return publicUrl
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      // If it's a validation error we threw, re-throw it
      if (
        error.message.includes('File type not allowed') ||
        error.message.includes('File too large') ||
        error.message.includes('Failed to get upload URL') ||
        error.message.includes('Failed to generate presigned URL') ||
        error.message.includes('Upload failed')
      ) {
        throw error
      }
    }

    // Log error for debugging (disable eslint for this line)
    // eslint-disable-next-line no-console
    console.error('Error uploading to S3:', error)
    throw new Error('Failed to upload image to S3')
  }
}

// Generate a random string for unique filenames (kept for potential future use)
export const generateRandomString = (length: number): string => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * 62)]
  }
  return result
}
