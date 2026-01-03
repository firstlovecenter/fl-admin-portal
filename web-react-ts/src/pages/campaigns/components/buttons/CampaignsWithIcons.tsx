import { ChurchLevel } from 'global-types'
import React from 'react'
import { useNavigate } from 'react-router'
import MenuButton from 'components/buttons/MenuButton'
import { FaPray, FaTools } from 'react-icons/fa'
import { BiSelectMultiple } from 'react-icons/bi'
import { GiHumanPyramid, GiSheep } from 'react-icons/gi'
import { IoStatsChartOutline } from 'react-icons/io5'

type CampaignsWithIconsProps = {
  campaign: string
  churchLevel: ChurchLevel
}

const CampaignsWithIcons = ({
  campaign,
  churchLevel,
}: CampaignsWithIconsProps) => {
  const navigate = useNavigate()

  const assignCampaignIcons = () => {
    switch (campaign) {
      case 'Equipment':
        return (
          <MenuButton
            title={campaign}
            iconComponent={<FaTools />}
            noCaption
            color="equipment"
            onClick={() =>
              navigate(
                `/campaigns/${churchLevel.toLowerCase()}/${campaign.toLowerCase()}`.replace(
                  ' ',
                  '-'
                )
              )
            }
          />
        )
      case 'Anti-Brutish':
        return (
          <MenuButton
            title={campaign}
            iconComponent={<FaPray />}
            noCaption
            color="antibrutish"
            onClick={() =>
              navigate(
                `/campaigns/${churchLevel.toLowerCase()}/${campaign.toLowerCase()}`.replace(
                  ' ',
                  '-'
                )
              )
            }
          />
        )
      case 'Multiplication':
        return (
          <MenuButton
            title={campaign}
            iconComponent={<BiSelectMultiple />}
            noCaption
            color="multiplication"
            onClick={() =>
              navigate(
                `/campaigns/${churchLevel.toLowerCase()}/${campaign.toLowerCase()}`.replace(
                  ' ',
                  '-'
                )
              )
            }
          />
        )
      case 'Swollen Sunday':
        return (
          <MenuButton
            title={campaign}
            iconComponent={<GiHumanPyramid />}
            noCaption
            color="swollensunday"
            onClick={() =>
              navigate(
                `/campaigns/${churchLevel.toLowerCase()}/${campaign.toLowerCase()}`.replace(
                  ' ',
                  '-'
                )
              )
            }
          />
        )
      case 'Shepherding Control':
        return (
          <MenuButton
            title={campaign}
            noCaption
            color="shepherdingcontrol"
            iconComponent={<IoStatsChartOutline />}
            onClick={() =>
              navigate(
                `/campaigns/${churchLevel.toLowerCase()}/${campaign.toLowerCase()}`.replace(
                  ' ',
                  '-'
                )
              )
            }
          />
        )
      case 'Sheep Seeking':
        return (
          <MenuButton
            title={campaign}
            noCaption
            color="sheepseeking"
            iconComponent={<GiSheep />}
            onClick={() =>
              navigate(
                `/campaigns/${churchLevel.toLowerCase()}/${campaign.toLowerCase()}`.replace(
                  ' ',
                  '-'
                )
              )
            }
          />
        )
    }
  }

  return <>{assignCampaignIcons()}</>
}

export default CampaignsWithIcons
