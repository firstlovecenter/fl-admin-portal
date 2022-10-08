import { throwToSentry } from './utils'
import { StreamOptions } from './types'

const dotenv = require('dotenv')

dotenv.config()

export type Network = 'MTN' | 'Vodafone' | 'AirtelTigo' | 'Airtel' | 'Tigo'
export type NetworkCode = 'mtn' | 'vod' | 'tgo'
type PaymentErrorCode =
  | '100'
  | '101'
  | '102'
  | '103'
  | '104'
  | '105'
  | '107'
  | '111'
  | '114'
  | '200'
  | '600'
  | '909'
  | '979'
  | '999'

export const getMobileCode = (network: Network): NetworkCode => {
  switch (network) {
    case 'MTN':
      return 'mtn'
    case 'Vodafone':
      return 'vod'
    case 'AirtelTigo':
      return 'tgo'
    case 'Airtel':
      return 'tgo'
    case 'Tigo':
      return 'tgo'
    default:
      break
  }

  return 'mtn'
}

export const padNumbers = (number: number): string => {
  if (!number) {
    return ''
  }
  return number.toString().padStart(12, '0')
}
export const handlePaymentError = (paymentResponse: {
  data: { code: PaymentErrorCode }
}) => {
  const { code } = paymentResponse.data

  switch (code) {
    case '105':
    case '101':
      throwToSentry('Payment Error', '101 Payment Unsuccessful!')
      break
    case '100':
      throwToSentry('Payment Error', '100 Transaction Failed or Declined')
      break
    case '102':
      throwToSentry(
        'Payment Error',
        '102 Number not registered for mobile money'
      )
      break
    case '103':
      throwToSentry('Payment Error', '103 Wrong PIN or transaction timed out')
      break
    case '104':
      throwToSentry('Payment Error', '104 Transaction declined or terminated')
      break
    case '111':
      break
    case '107':
      throwToSentry('Payment Error', 'USSD is busy, please try againn later')
      break
    case '114':
      throwToSentry('Payment Error', 'Invalid Voucher Code')
      break
    case '200':
      throwToSentry('Payment Error', 'VBV Required')
      break
    case '600':
      throwToSentry('Payment Error', 'Access Denied')
      break
    case '979':
      throwToSentry('Payment Error', 'Access Denied. Invalid Credential')
      break
    case '909':
      throwToSentry(
        'Payment Error',
        'Duplicate Transaction ID. Transaction ID must be unique'
      )
      break
    case '999':
      throwToSentry('Payment Error', 'Access Denied. Merchant ID is not set')
      break
    default:
      break
  }
}

export const getStreamFinancials = (stream: StreamOptions) => {
  let merchantId = process.env.PAYSWITCH_MERCHANT_ID
  let auth = process.env.PAYSWITCH_AUTH
  let passcode = process.env.PAYSWITCH_PASSCODE

  switch (stream.toLowerCase()) {
    case 'anagkazo encounter':
      throwToSentry(
        'Payment Error',
        'Anagkazo has a different financial system. Thank you!'
      )
      break
    case 'gospel encounter':
    case 'first love expeience':
      merchantId = process.env.PAYSWITCH_MERCHANT_ID
      auth = process.env.PAYSWITCH_AUTH
      passcode = process.env.PAYSWITCH_PASSCODE
      break

    default:
      break
  }

  return { merchantId, auth, passcode }
}
