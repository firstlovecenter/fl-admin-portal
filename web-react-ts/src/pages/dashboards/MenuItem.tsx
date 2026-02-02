import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import Link from 'next/link'
import './MenuItem.css'

type MenuItemProps = {
  name: string
  onClick: () => void
  to: string
}

const MenuItem = (props: MenuItemProps) => {
  const { name, onClick, to } = props
  const { theme } = useContext(MemberContext)

  return (
    <li onClick={onClick}>
      <Link className={`menu-item ${theme}`} href={to}>
        {name}
      </Link>
    </li>
  )
}

export default MenuItem
