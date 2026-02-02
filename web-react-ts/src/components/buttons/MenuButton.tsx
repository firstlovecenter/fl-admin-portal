'use client'

import CloudinaryImage from 'components/CloudinaryImage'
import PlaceholderCustom from 'components/Placeholder'
import { capitalise } from 'global-utils'
import React from 'react'
import { Button, Col, Row } from 'react-bootstrap'
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
      <Row>
        {icon && (
          <Col xs="auto" className="btn-left-col my-auto">
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
                {props.number && <div className="fw-bold">{props.number}</div>}
              </div>
              {props.iconCaption && (
                <small className={`icon-caption`}>{props.iconCaption}</small>
              )}
            </PlaceholderCustom>
          </Col>
        )}

        <Col className="btn-right-col">
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
        </Col>
      </Row>
    </Button>
  )
}

export default MenuButton
