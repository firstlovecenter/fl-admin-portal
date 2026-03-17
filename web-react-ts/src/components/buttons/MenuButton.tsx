import CloudinaryImage from 'components/CloudinaryImage'
import PlaceholderCustom from 'components/Placeholder'
import { capitalise } from 'global-utils'
import React from 'react'
import { Button } from 'components/ui/button'
import './MenuButton.css'

type MenuButtonProps = {
  className?: string
  onClick?: () => void
  icon?: string
  iconComponent?: JSX.Element
  iconCaption?: string
  iconBg?: boolean
  avatar?: string
  caption?: string
  noCaption?: boolean
  number?: number | string
  color: string
  title?: string
}

const MenuButton = (props: MenuButtonProps) => {
  const icon = props.icon || props.iconComponent || props.avatar || props.number

  return (
    <Button
      onClick={props.onClick}
      size="lg"
      variant="secondary"
      className={`${props.color} menu-buttons`}
    >
      <div className="flex items-center w-full">
        {icon && (
          <div className="flex-none my-auto mr-3">
            <PlaceholderCustom className="rounded-full menu" as="div">
              <div
                className={
                  props.iconBg ? ` menu gradient-bg ${props.color}` : ''
                }
              >
                {props.avatar && (
                  <CloudinaryImage src={props.avatar} className="avatar" />
                )}
                {props.icon && (
                  <img
                    src={props.icon}
                    className="square-img"
                    alt={props.icon}
                  />
                )}
                {props.iconComponent && (
                  <div className={`${props.color}`}>{props.iconComponent}</div>
                )}
                {props.number && <div className="font-bold">{props.number}</div>}
              </div>
              {props.iconCaption && (
                <small className="icon-caption">{props.iconCaption}</small>
              )}
            </PlaceholderCustom>
          </div>
        )}

        <div className="flex-1 text-left">
          <PlaceholderCustom loading={!props.title} as="div" xs={10}>
            <span>{capitalise(props?.title ?? '')}</span>
          </PlaceholderCustom>
          {!props.noCaption && (
            <PlaceholderCustom loading={!props.caption} as="div" xs={10}>
              <small className="text-muted-foreground dark menu-caption">
                {props.caption}
              </small>
            </PlaceholderCustom>
          )}
        </div>
      </div>
    </Button>
  )
}

export default MenuButton
