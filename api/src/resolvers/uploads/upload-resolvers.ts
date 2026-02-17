import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Context } from '../utils/neo4j-types'
import { loadSecrets } from '../secrets'

const generateRandomString = (length: number): string => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = length; i > 0; i -= 1) {
    result += chars[Math.floor(Math.random() * 62)]
  }
  return result
}

const generateUniqueFileName = (
  originalName: string,
  userId: string,
  firstName: string,
  lastName: string
): string => {
  const date = new Date().toISOString().slice(0, 10)
  const username = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`

  // Clean the original filename first
  const cleanOriginalName = originalName
    ? originalName
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/~/g, '-') // Replace tildes with hyphens
        .replace(/[^a-zA-Z0-9.-]/g, '') // Remove special characters except dots and hyphens
        .toLowerCase()
    : generateRandomString(12)

  const filename = `uploads/${username}-${userId}/${date}_${cleanOriginalName}`

  return filename
}

const uploadMutations = {
  generatePresignedUrl: async (
    parent: any,
    args: {
      fileName: string
      fileType: string
      fileSize: number
    },
    context: Context
  ) => {
    try {
      // Get current user from JWT context
      const session = context.executionContext.session()

      const currentUserResult = await session.run(
        'MATCH (member:Active:Member {id: $userId}) RETURN member',
        { userId: context.jwt.userId }
      )

      if (currentUserResult.records.length === 0) {
        throw new Error('User not found')
      }

      const currentUser = currentUserResult.records[0].get('member').properties

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ]
      if (!allowedTypes.includes(args.fileType)) {
        throw new Error(
          `File type not allowed. Supported types: ${allowedTypes.join(', ')}`
        )
      }

      // Validate file size (20MB limit)
      const maxFileSize = 20 * 1024 * 1024
      if (args.fileSize > maxFileSize) {
        throw new Error(
          `File too large. Maximum size: ${maxFileSize / (1024 * 1024)}MB`
        )
      }

      // Generate unique filename
      const key = generateUniqueFileName(
        args.fileName,
        currentUser.id,
        currentUser.firstName,
        currentUser.lastName
      )

      // Log details for debugging
      console.log('Upload request details:', {
        originalFileName: args.fileName,
        cleanedKey: key,
        fileType: args.fileType,
        fileSize: args.fileSize,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
      })

      // Test filename cleaning to ensure it's working correctly
      const testCleanedName = args.fileName
        .replace(/\s+/g, '-')
        .replace(/~/g, '-')
        .replace(/[^a-zA-Z0-9.-]/g, '')
        .toLowerCase()

      console.log('Filename cleaning test:', {
        original: args.fileName,
        cleaned: testCleanedName,
        finalKey: key,
      })

      // Create presigned URL
      const SECRETS = await loadSecrets()
      const s3Client = new S3Client({
        region: SECRETS.AWS_REGION || 'eu-west-2',
        credentials: {
          accessKeyId: SECRETS.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: SECRETS.AWS_SECRET_ACCESS_KEY || '',
        },
      })

      console.log('AWS Configuration:', {
        region: SECRETS.AWS_REGION || 'eu-west-2',
        bucket: SECRETS.AWS_S3_BUCKET_NAME,
        hasAccessKey: !!SECRETS.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!SECRETS.AWS_SECRET_ACCESS_KEY,
      })

      const command = new PutObjectCommand({
        Bucket: SECRETS.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: args.fileType,
        ContentLength: args.fileSize,
      })

      console.log('S3 Command details:', {
        bucket: SECRETS.AWS_S3_BUCKET_NAME,
        key,
        contentType: args.fileType,
        contentLength: args.fileSize,
      })

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 900, // 15 minutes
      })

      console.log('Generated presigned URL:', {
        url: `${presignedUrl.substring(0, 100)}...`,
        fullLength: presignedUrl.length,
      })

      const publicUrl = `https://${SECRETS.AWS_S3_BUCKET_NAME}.s3.${
        SECRETS.AWS_REGION || 'eu-west-2'
      }.amazonaws.com/${key}`

      return {
        presignedUrl,
        publicUrl,
        key,
        expiresIn: 900,
      }
    } catch (error) {
      console.error('Error generating presigned URL:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate upload URL'
      )
    }
  },
}

export default uploadMutations
