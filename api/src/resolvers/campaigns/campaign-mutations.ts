import { equipmentCampaignMutations } from './equipment/equipment-campaign-resolvers'
import multiplicationCampaignMutations from './multiplication/multiplication-campaign-resolvers'
import sheepSeekingMutations from './sheep-seeking/sheep-seeking-resolvers'
import swollenSundayMutations from './swollen-sunday/swollen-sunday-campaign-resolvers'

const campaignMutations = {
  ...equipmentCampaignMutations,
  ...swollenSundayMutations,
  ...sheepSeekingMutations,
  ...multiplicationCampaignMutations,
}

export default campaignMutations
