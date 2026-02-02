import React from 'react'
import { Container } from 'react-bootstrap'

const PageContainer = ({ children }: { children: React.ReactNode }) => {
  return <Container className="page-container">{children}</Container>
}

export default PageContainer
