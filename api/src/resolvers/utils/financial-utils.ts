import SECRETS from '../getSecrets'

const dotenv = require('dotenv')

dotenv.config()

export type Network = 'MTN' | 'Vodafone' | 'AirtelTigo' | 'Airtel' | 'Tigo'
export type NetworkCode = 'mtn' | 'vod' | 'tgo'

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
type Stream = {
  bankAccount:
    | 'manual'
    | 'aes_account'
    | 'fle_account'
    | 'acc_floc'
    | 'bjosh_special'
    | 'oa_kumasi'
    | 'oa_ghnorth'
    | 'oa_ghsouth'
    | 'oa_gheast'
    | 'oa_ghwest'
    | 'oa_tarkwa'
    | 'oa_sunyani'
    | 'accra_greater_love_choir'
    | 'accra_dancing_stars'
    | 'accra_film_stars'
}

export const getCreditsFinancials = () => {
  const auth = SECRETS.PAYSTACK_PRIVATE_KEY_WEEKDAY
  const subaccount = SECRETS.PS_SB_DOWNLOAD_CREDITS

  return { auth, subaccount }
}

export const getStreamFinancials = (stream: Stream) => {
  const auth = SECRETS.PAYSTACK_PRIVATE_KEY_WEEKDAY
  let subaccount

  switch (stream.bankAccount) {
    case 'aes_account':
      throw new Error(
        'Payment Error' +
          'Anagkazo has a different financial system. Thank you!'
      )

    case 'fle_account':
      subaccount = SECRETS.PS_SB_FLE
      break
    case 'acc_floc':
      subaccount = SECRETS.PS_SB_FLOC
      break
    case 'bjosh_special':
      subaccount = SECRETS.PS_SB_BJOSH
      break
    case 'oa_kumasi':
      subaccount = SECRETS.PS_SB_KUMASI
      break
    case 'oa_gheast':
      subaccount = SECRETS.PS_SB_OA_GHEAST
      break
    case 'oa_ghnorth':
      subaccount = SECRETS.PS_SB_OA_GHNORTH
      break
    case 'oa_ghsouth':
      subaccount = SECRETS.PS_SB_OA_GHSOUTH
      break
    case 'oa_ghwest':
      subaccount = SECRETS.PS_SB_OA_GHWEST
      break
    case 'oa_tarkwa':
      subaccount = SECRETS.PS_SB_OA_TARKWA
      break
    case 'oa_sunyani':
      subaccount = SECRETS.PS_SB_OA_SUNYANI
      break

    // Creative Arts Accounts
    case 'accra_greater_love_choir':
      subaccount = SECRETS.PS_SB_CA_GREATER_LOVE_CHOIR
      break
    case 'accra_dancing_stars':
      subaccount = SECRETS.PS_SB_CA_DANCING_STARS
      break
    case 'accra_film_stars':
      subaccount = SECRETS.PS_SB_CA_FILM_STARS
      break

    default:
      subaccount = SECRETS.PS_SB_FLE
      break
  }

  return { auth, subaccount }
}
