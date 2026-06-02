import CloudinaryImage from 'components/CloudinaryImage'
import PlaceholderCustom from 'components/Placeholder'
import { capitalise } from 'global-utils'
import React from 'react'
import { cn } from 'components/lib/utils'
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
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        'menu-buttons w-full rounded-md border bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        props.color,
        props.className
      )}
    >
      <div className="flex w-full items-center">
        {icon && (
          <div className="btn-left-col my-auto shrink-0">
            <PlaceholderCustom className="rounded-circle menu" as="div">
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
                {props.number && (
                  <div className="font-bold">{props.number}</div>
                )}
              </div>
              {props.iconCaption && (
                <small className="icon-caption">{props.iconCaption}</small>
              )}
            </PlaceholderCustom>
          </div>
        )}

        <div className="btn-right-col min-w-0 flex-1">
          <PlaceholderCustom loading={!props.title} as="div" xs={10}>
            <span>{capitalise(props?.title ?? '')}</span>
          </PlaceholderCustom>
          {!props.noCaption && (
            <PlaceholderCustom loading={!props.caption} as="div" xs={10}>
              <small className="text-secondary dark menu-caption">
                {props.caption}
              </small>
            </PlaceholderCustom>
          )}
        </div>
      </div>
    </button>
  )
}

export default MenuButton
