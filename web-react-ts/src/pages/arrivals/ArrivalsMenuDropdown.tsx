import React from 'react'
import { Settings } from 'lucide-react'
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
    <div className="dropdown relative">
      <button className="dropdown-toggle">
        <Settings /> Settings
      </button>

      <div className="dropdown-menu">
        {menuItems.map((item, i) => (
          <div
            key={i}
            onClick={item.onClick}
            className="py-2 px-5 rounded"
          >
            {item.title}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ArrivalsMenuDropdown
