/* eslint-disable no-console */
import axios from 'axios'
import { Member } from './types'
import { throwToSentry } from './utils'
import { loadSecrets } from '../secrets'

const formData = require('form-data')
const Mailgun = require('mailgun.js')

export const sendSingleEmail = async (
  member: Member,
  subject: string,
  body?: string,
  html?: string
) => {
  const SECRETS = await loadSecrets() // Await secrets here
  const mailgun = new Mailgun(formData)
  const mg = mailgun.client({
    username: 'api',
    key: SECRETS.MAILGUN_API_KEY,
  })

  mg.messages
    .create(SECRETS.MAILGUN_DOMAIN, {
      from: 'FL Accra Admin <no-reply@firstlovecenter.org>',
      to: SECRETS.TEST_EMAIL_ADDRESS || member.email,
      subject,
      text: body,
      template: '',
      html: html || undefined, // HTML Version of the Message for Better Styling
    })
    .then((msg: any) => console.log('Mailgun API response', msg)) // logs response data
    .catch((err: any) => console.log('Mailgun API error', err)) // logs any error
}

export const sendBulkEmail = async (
  recipient: string[],
  subject: string,
  body?: string,
  html?: string
) => {
  const SECRETS = await loadSecrets() // Await secrets here
  const mailgun = new Mailgun(formData)
  const mg = mailgun.client({
    username: 'api',
    key: SECRETS.MAILGUN_API_KEY,
  })

  mg.messages
    .create(SECRETS.MAILGUN_DOMAIN, {
      from: 'FL Accra Admin <no-reply@firstlovecenter.org>',
      to: SECRETS.TEST_EMAIL_ADDRESS || recipient,
      subject,
      text: body,
      template: '',
      html: html || undefined, // HTML Version of the Message for Better Styling
    })
    .then((msg: any) => console.log('Mailgun API response', msg)) // logs response data
    .catch((err: any) => console.log('Mailgun API error', err)) // logs any error
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
        ? [SECRETS.TEST_PHONE_NUMBER, '0594760324']
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
