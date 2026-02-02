import { MemberContext } from 'contexts/MemberContext'
import { JSXChildren } from 'global-types'
import React from 'react'

const TestProvider = (props: JSXChildren) => {
  return (
    <MemberContext.Provider value={{ id: 'user-id' }}>
      {props.children}
    </MemberContext.Provider>
  )
}

export default TestProvider
