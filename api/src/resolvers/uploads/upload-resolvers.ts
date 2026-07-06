import { randomBytes } from 'crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Context } from '../utils/neo4j-types'
import { loadSecrets } from '../secrets'

// SYN-180 — draw the object-key random segment from the CSPRNG (crypto) rather
// than Math.random(), which is not cryptographically secure. The residual
// modulo bias over 62 chars is immaterial here (the key is userId-namespaced
// with a 15-minute presign TTL) — the goal is simply an unpredictable source.
const generateRandomString = (length: number): string => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i += 1) {
    result += chars[bytes[i] % chars.length]
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

  const filename = `uploads/${username}-${userId}/${date}_${generateRandomString(
    8
  )}_${cleanOriginalName}`

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
        'MATCH (member:Active:Member {id: $id}) RETURN member',
        { id: context.jwt?.userId }
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

      // Create presigned URL
      const SECRETS = await loadSecrets()
      const s3Client = new S3Client({
        region: SECRETS.AWS_REGION || 'eu-west-2',
        credentials: {
          accessKeyId: SECRETS.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: SECRETS.AWS_SECRET_ACCESS_KEY || '',
        },
      })

      const command = new PutObjectCommand({
        Bucket: SECRETS.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: args.fileType,
        ContentLength: args.fileSize,
      })

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 900, // 15 minutes
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
