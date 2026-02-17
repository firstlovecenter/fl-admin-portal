/* eslint-disable no-console */
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import axios from 'axios'
import { loadSecrets } from '../secrets'
import { throwToSentry } from './utils'

interface EmailPayload {
  from: string
  to: string | string[]
  subject: string
  text?: string
  html?: string
  replyTo?: string
}

interface NotificationEvent {
  resource: string
  path: string
  httpMethod: string
  headers: {
    'x-secret-key': string
    'content-type': string
  }
  body: string
  isBase64Encoded: boolean
}

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'eu-west-2',
})

/**
 * Get the secret key for notification service authentication
 * Loaded from AWS Secrets Manager for security
 */
const getNotificationSecretKey = async (): Promise<string> => {
  const SECRETS = await loadSecrets()
  const key = SECRETS.FLC_NOTIFY_KEY
  if (!key) {
    throw new Error('FLC_NOTIFY_KEY not found in secrets')
  }
  console.log('[Notification] Using FLC_NOTIFY_KEY for authentication')
  return key
}

/**
 * Determine which notification Lambda to use based on environment
 * Uses ENVIRONMENT from AWS Secrets Manager ("development" or "production")
 */
const getNotificationLambdaName = async (): Promise<string> => {
  const SECRETS = await loadSecrets()
  const environment = SECRETS.ENVIRONMENT || 'production'

  if (environment === 'development') {
    return 'dev-flc-notify-service'
  }

  return 'flc-notify-service'
}

/**
 * Send an email via the notification service Lambda
 * @param payload - Email details (from, to, subject, text/html)
 * @returns Promise<boolean> - True if email sent successfully
 */
const invokeNotificationLambda = async (
  payload: EmailPayload
): Promise<boolean> => {
  try {
    const lambdaName = await getNotificationLambdaName()
    const secretKey = await getNotificationSecretKey()

    console.log('[Notification] Lambda name:', lambdaName)
    console.log(
      '[Notification] Secret key (first 10 chars):',
      `${secretKey.substring(0, 10)}...`
    )

    // Construct the notification event
    const event: NotificationEvent = {
      resource: '/send-email',
      path: '/send-email',
      httpMethod: 'POST',
      headers: {
        'x-secret-key': secretKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      isBase64Encoded: false,
    }

    console.log('[Notification] Sending email via', lambdaName, {
      to: payload.to,
      subject: payload.subject,
    })

    // Invoke the notification service Lambda
    const command = new InvokeCommand({
      FunctionName: lambdaName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(event),
    })

    const response = await lambdaClient.send(command)

    console.log('[Notification] Lambda response status:', response.StatusCode)
    console.log('[Notification] Function error:', response.FunctionError)

    // Parse response
    if (response.Payload) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload))

      console.log(
        '[Notification] Response payload:',
        JSON.stringify(result, null, 2)
      )

      if (response.StatusCode === 200 && result.statusCode === 200) {
        console.log('[Notification] Email sent successfully')
        return true
      }
      console.error('[Notification] Email sending failed:', result)
      throwToSentry('Email sending failed', result)
      return false
    }

    console.warn('[Notification] No payload in response')
    return false
  } catch (error) {
    console.error('[Notification] Error sending email:', error)
    throwToSentry('Error sending email via Lambda', error)
    return false
  }
}

/**
 * Generate HTML email template for servant promotion
 */
const generatePromotionEmailHtml = (
  firstName: string,
  lastName: string,
  servantType: string,
  churchName: string,
  helpDeskLink: string
): string => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(255,255,255);max-width:600px;margin-left:auto;margin-right:auto;border-radius:8px;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 0 #0000">
      <tbody>
        <tr style="width:100%">
          <td>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(220,38,38);color:rgb(255,255,255);text-align:center;padding-top:40px;padding-bottom:40px;border-top-left-radius:8px;border-top-right-radius:8px">
              <tbody>
                <tr>
                  <td>
                    <h1 style="font-size:28px;font-weight:700;margin:0px;margin-bottom:8px">First Love Center</h1>
                    <p style="font-size:16px;margin:0px;opacity:0.9;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">Servanthood Status Update</p>
                  </td>
                </tr>
              </tbody>
            </table>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding-left:40px;padding-right:40px;padding-top:48px;padding-bottom:48px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:18px;color:rgb(31,41,55);margin-bottom:0px;margin:0px;line-height:24px;margin-top:0px;margin-left:0px;margin-right:0px">Hi ${firstName} ${lastName},</p>
                    <p style="font-size:16px;color:rgb(55,65,81);line-height:28px;margin-bottom:0px;margin:0px;margin-top:0px;margin-left:0px;margin-right:0px">🎉 <strong>Congratulations!</strong> We are delighted to inform you that you have been appointed to serve as the <strong style="color:rgb(220,38,38)">${servantType}</strong> for <strong>${churchName}</strong>.</p>
                    <p style="font-size:16px;color:rgb(55,65,81);line-height:28px;margin-bottom:0px;margin:0px;margin-top:0px;margin-left:0px;margin-right:0px">This is an important ministry position, and we trust that God will use you mightily in this role to advance His kingdom.</p>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(254,242,242);border-left-width:4px;border-color:rgb(220,38,38);padding:24px;margin-bottom:40px;border-top-right-radius:4px;border-bottom-right-radius:4px">
                      <tbody>
                        <tr>
                          <td>
                            <p style="font-size:16px;color:rgb(55,65,81);line-height:28px;margin:0px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px"><strong>Next Steps:</strong> Please visit <a href="${helpDeskLink}" style="color:rgb(220,38,38);font-weight:700;text-decoration-line:none" target="_blank">our help center</a> to find comprehensive guidelines, instructions, and answers to frequently asked questions about your role.</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="font-size:16px;color:rgb(55,65,81);line-height:28px;margin:0px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">May the Lord bless you abundantly as you continue to serve in His vineyard.</p>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr style="border-color:rgb(229,231,235);margin-left:40px;margin-right:40px;margin-top:40px;margin-bottom:40px;width:100%;border:none;border-top:1px solid #eaeaea" />
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding-left:40px;padding-right:40px;padding-bottom:48px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:14px;color:rgb(75,85,99);line-height:24px;margin-bottom:0px;margin:0px;margin-top:0px;margin-left:0px;margin-right:0px">If you do not understand this message or believe it has been sent in error, kindly contact your council admin for clarification.</p>
                    <p style="font-size:14px;color:rgb(75,85,99);line-height:24px;margin-bottom:0px;margin:0px;margin-top:0px;margin-left:0px;margin-right:0px">Please do not respond to this email address as it is unmonitored and will not receive a reply.</p>
                    <p style="font-size:14px;color:rgb(55,65,81);line-height:24px;margin:0px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">On behalf of the Lead Pastor,<br /><strong>Regards</strong><br />The Administrator<br />First Love Center HQ<br />Accra</p>
                  </td>
                </tr>
              </tbody>
            </table>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(220,38,38);height:4px;border-bottom-right-radius:8px;border-bottom-left-radius:8px">
              <tbody>
                <tr>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`
}

/**
 * Generate HTML email template for servant removal
 */
const generateRemovalEmailHtml = (
  firstName: string,
  lastName: string,
  servantType: string,
  churchName: string
): string => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(255,255,255);max-width:600px;margin-left:auto;margin-right:auto;border-radius:8px;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 0 #0000">
      <tbody>
        <tr style="width:100%">
          <td>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(220,38,38);color:rgb(255,255,255);text-align:center;padding-top:40px;padding-bottom:40px;border-top-left-radius:8px;border-top-right-radius:8px">
              <tbody>
                <tr>
                  <td>
                    <h1 style="font-size:28px;font-weight:700;margin:0px;margin-bottom:8px">First Love Center</h1>
                    <p style="font-size:16px;margin:0px;opacity:0.9;line-height:24px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">Servanthood Status Change</p>
                  </td>
                </tr>
              </tbody>
            </table>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding-left:40px;padding-right:40px;padding-top:48px;padding-bottom:48px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:18px;color:rgb(31,41,55);margin-bottom:0px;margin:0px;line-height:24px;margin-top:0px;margin-left:0px;margin-right:0px">Hi ${firstName} ${lastName},</p>
                    <p style="font-size:16px;color:rgb(55,65,81);line-height:28px;margin-bottom:0px;margin:0px;margin-top:0px;margin-left:0px;margin-right:0px">We regret to inform you that you have been removed from your position as <strong style="color:rgb(220,38,38)">${servantType}</strong> for <strong>${churchName}</strong>.</p>
                    <p style="font-size:16px;color:rgb(55,65,81);line-height:28px;margin-bottom:0px;margin:0px;margin-top:0px;margin-left:0px;margin-right:0px">We encourage you to continue serving the Lord faithfully in whatever capacity He opens. Do not be discouraged by this change, as it presents an opportunity to grow and serve in new ways.</p>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(254,242,242);border-left-width:4px;border-color:rgb(220,38,38);padding:24px;margin-bottom:40px;border-top-right-radius:4px;border-bottom-right-radius:4px">
                      <tbody>
                        <tr>
                          <td>
                            <p style="font-size:16px;color:rgb(55,65,81);line-height:28px;margin:0px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px"><strong>Remember:</strong> Your value and calling in Christ are not defined by any single position. We remain grateful for your faithful service and trust God will direct you to the role He has prepared for you.</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="font-size:16px;color:rgb(55,65,81);line-height:28px;margin:0px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">May God's peace and guidance accompany you always.</p>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr style="border-color:rgb(229,231,235);margin-left:40px;margin-right:40px;margin-top:40px;margin-bottom:40px;width:100%;border:none;border-top:1px solid #eaeaea" />
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding-left:40px;padding-right:40px;padding-bottom:48px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:14px;color:rgb(75,85,99);line-height:24px;margin-bottom:0px;margin:0px;margin-top:0px;margin-left:0px;margin-right:0px">If you do not understand this message or believe it has been sent in error, kindly contact your council admin for clarification.</p>
                    <p style="font-size:14px;color:rgb(75,85,99);line-height:24px;margin-bottom:0px;margin:0px;margin-top:0px;margin-left:0px;margin-right:0px">Please do not respond to this email address as it is unmonitored and will not receive a reply.</p>
                    <p style="font-size:14px;color:rgb(55,65,81);line-height:24px;margin:0px;margin-top:0px;margin-bottom:0px;margin-left:0px;margin-right:0px">On behalf of the Lead Pastor,<br /><strong>Regards</strong><br />The Administrator<br />First Love Center HQ<br />Accra</p>
                  </td>
                </tr>
              </tbody>
            </table>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(220,38,38);height:4px;border-bottom-right-radius:8px;border-bottom-left-radius:8px">
              <tbody>
                <tr>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`
}

/**
 * Send email to servant when promoted to new position
 * @breaking Use sendServantPromotionEmail instead of sendSingleEmail
 */
export const sendServantPromotionEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  churchType: string,
  servantType: string,
  churchName: string,
  helpDeskLink: string
): Promise<boolean> => {
  const html = generatePromotionEmailHtml(
    firstName,
    lastName,
    servantType,
    churchName,
    helpDeskLink
  )

  const payload: EmailPayload = {
    from: 'FL Accra Admin <no-reply@updates.firstlovecenter.com>',
    to: email,
    subject: 'FL Servanthood Status Update - Congratulations!',
    html,
    text: `Hi ${firstName} ${lastName}, Congratulations! You have been appointed to serve as the ${servantType} for ${churchName}. Please visit the help center for guidelines and instructions. May the Lord bless you abundantly.`,
  }

  return invokeNotificationLambda(payload)
}

/**
 * Send email to servant when removed from position
 * @breaking Use sendServantRemovalEmail instead of sendSingleEmail
 */
export const sendServantRemovalEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  churchType: string,
  servantType: string,
  churchName: string
): Promise<boolean> => {
  const html = generateRemovalEmailHtml(
    firstName,
    lastName,
    servantType,
    churchName
  )

  const payload: EmailPayload = {
    from: 'FL Accra Admin <no-reply@updates.firstlovecenter.com>',
    to: email,
    subject: 'FL Servanthood Status Change',
    html,
    text: `Hi ${firstName} ${lastName}, We regret to inform you that you have been removed as the ${servantType} for ${churchName}. We encourage you to continue serving the Lord faithfully. May God's peace and guidance accompany you always.`,
  }

  return invokeNotificationLambda(payload)
}

/**
 * Generic email sending function
 * @breaking New interface - use specific functions like sendServantPromotionEmail
 */
export const sendEmail = async (payload: EmailPayload): Promise<boolean> => {
  return invokeNotificationLambda(payload)
}

/**
 * @deprecated Use sendServantPromotionEmail or sendServantRemovalEmail instead
 * This function is preserved for reference only - DO NOT USE
 */
export const sendSingleEmail = async (): Promise<void> => {
  throw new Error(
    'sendSingleEmail is deprecated. Use sendServantPromotionEmail or sendServantRemovalEmail instead.'
  )
}

/**
 * @deprecated Use sendEmail with specific email payloads instead
 * This function is preserved for reference only - DO NOT USE
 */
export const sendBulkEmail = async (): Promise<void> => {
  throw new Error(
    'sendBulkEmail is deprecated. Use sendEmail with an array of recipients in the "to" field instead.'
  )
}

export const sendBulkSMS = async (recipient: string[], message: string) => {
  const SECRETS = await loadSecrets() // Await secrets here
  const sendMessage = {
    method: 'post',
    url: `https://api.mnotify.com/api/sms/quick?key=${SECRETS.MNOTIFY_KEY}`,
    headers: {
      'content-type': 'application/json',
    },
    data: {
      recipient: SECRETS.TEST_PHONE_NUMBER
        ? [SECRETS.TEST_PHONE_NUMBER, '0594760324d']
        : recipient,
      sender: 'FLC Admin',
      message,
      is_schedule: 'false',
      schedule_date: '',
    },
  }

  try {
    console.log('Sending SMS using mNotify')
    const res = await axios(sendMessage)

    if (res.data.code === '2000') {
      console.log(res.data.message)
      return 'Message sent successfully'
    }

    throw new Error(
      `There was a problem sending your SMS ${JSON.stringify(res.data)}`
    )
  } catch (error: any) {
    throwToSentry('There was a problem sending your SMS', error)
  }

  return 'Message sent successfully'
}

export const joinMessageStrings = (strings: string[]) => {
  return strings.join('')
}
