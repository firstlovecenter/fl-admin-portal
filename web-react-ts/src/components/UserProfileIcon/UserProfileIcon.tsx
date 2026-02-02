'use client'

import React, { useContext } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import './UserProfileIcon.css'
import { MemberContext } from '../../contexts/MemberContext.js'
import { Spinner } from 'react-bootstrap'
import CloudinaryImage from 'components/CloudinaryImage'
import { USER_PLACEHOLDER } from 'global-utils'
import useClickCard from 'hooks/useClickCard'

function UserProfileIcon() {
  const { setChurch } = useClickCard()
  const { currentUser } = useContext(MemberContext)
  const { isAuthenticated } = useAuth0()

  return (
    <>
      {isAuthenticated && currentUser.email && (
        <div onClick={() => setChurch(currentUser.church)}>
          <div className="d-flex">
            <div className="flex-shrink-0">
              <CloudinaryImage
                className="user-navbar-img"
                src={currentUser?.picture || USER_PLACEHOLDER}
                alt={currentUser?.firstName || null}
              />
            </div>
            <div className="flex-grow-1 ms-3">
              <div>{currentUser.fullName}</div>
              <div className="text-secondary small">{currentUser.email}</div>
            </div>
          </div>
        </div>
      )}
      {isAuthenticated && !currentUser.email && (
        <div className="text-secondary text-center">
          <Spinner animation="grow" />
        </div>
      )}
    </>
  )
}

export default UserProfileIcon
