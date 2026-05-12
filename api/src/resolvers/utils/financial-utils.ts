import { loadSecrets } from '../secrets'

const dotenv = require('dotenv')

dotenv.config()

export type Network = 'MTN' | 'Vodafone' | 'AirtelTigo' | 'Airtel' | 'Tigo'
export type NetworkCode = 'mtn' | 'vod' | 'tgo'

// Mirrors web-react-ts/src/global-utils.ts:13. Ghanaian mobile-money numbers
// arrive either as 0XXXXXXXXX (10 digits, leading 0) or XXXXXXXXXX (10 digits,
// no leading 0). Anything else is rejected before we hand it to Paystack.
export const MOMO_NUM_REGEX = /^(0[1-9]\d{8}|[1-9]\d{9})$/

// Paranoia ceiling on a single offering bank. Well above any realistic
// single-service total at any church level; catches fat-fingered typos
// (e.g. 5000 → 5000000) before they reach Paystack.
export const MAX_OFFERING_CASH = 50_000

export const NETWORKS: readonly Network[] = [
  'MTN',
  'Vodafone',
  'AirtelTigo',
  'Airtel',
  'Tigo',
]

export const isValidNetwork = (value: unknown): value is Network =>
  typeof value === 'string' && (NETWORKS as readonly string[]).includes(value)

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

export const getStreamFinancials = async (stream: Stream) => {
  const SECRETS = await loadSecrets()
  const auth = SECRETS.PAYSTACK_PRIVATE_KEY_WEEKDAY
  let subaccount

  switch (stream.bankAccount) {
    case 'manual':
      throw new Error(
        'Payment Error ' +
          'You may not use the self-banking platform. Please contact your admin'
      )
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
      subaccount = SECRETS.PS_SB_OA_GHSOUTH
      break
    case 'oa_gheast':
      subaccount = SECRETS.PS_SB_OA_GHSOUTH
      break
    case 'oa_ghnorth':
      subaccount = SECRETS.PS_SB_OA_GHSOUTH
      break
    case 'oa_ghsouth':
      subaccount = SECRETS.PS_SB_OA_GHSOUTH
      break
    case 'oa_ghwest':
      subaccount = SECRETS.PS_SB_OA_GHSOUTH
      break
    case 'oa_tarkwa':
      subaccount = SECRETS.PS_SB_OA_GHSOUTH
      break
    case 'oa_sunyani':
      subaccount = SECRETS.PS_SB_OA_GHSOUTH
      break

    // Ministry Accounts
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
