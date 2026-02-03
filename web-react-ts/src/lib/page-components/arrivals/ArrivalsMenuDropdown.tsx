import React from 'react'
import { Dropdown } from 'react-bootstrap'
import { GearFill } from 'react-bootstrap-icons'
import './Arrivals.css'

export type MenuItemsProps = {
  title?: string
  onClick?: () => void
}[]

export type ArrivalsMenuDropdownProps = {
  menuItems: MenuItemsProps
}

const ArrivalsMenuDropdown = ({ menuItems }: ArrivalsMenuDropdownProps) => {
  return (
    <Dropdown className="border-none text-end py-1 arrivals-menu-dropdown">
      <Dropdown.Toggle variant="danger">
        <GearFill /> Settings
      </Dropdown.Toggle>

      <Dropdown.Menu variant="dark">
        {menuItems.map((item, i) => (
          <Dropdown.Item
            key={i}
            onClick={item.onClick}
            className="py-2 px-5 rounded"
          >
            {item.title}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}

export default ArrivalsMenuDropdown
