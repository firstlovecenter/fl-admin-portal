import RoleView from 'auth/RoleView'
import UserProfileIcon from 'components/UserProfileIcon/UserProfileIcon'
import {
  Container,
  Nav,
  Navbar,
  Offcanvas,
  Row,
  Col,
  Button,
  Card,
} from 'react-bootstrap'
import { menuItems } from './dashboard-utils'
import SearchBox from 'components/SearchBox'
import { ArrowClockwise, ChevronLeft, Moon, Sun } from 'react-bootstrap-icons'
import './Navigation.css'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const Navigator = () => {
  const router = useRouter()

  const isRunningStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches
  }

  const htmlElement = document.querySelector('html')
  const currentTheme = htmlElement?.getAttribute('data-bs-theme')

  const [isDarkMode, setIsDarkMode] = useState(currentTheme === 'dark')
  const [show, setShow] = useState(false)

  const handleShow = () => setShow(!show)

  const toggleColorMode = () => {
    setIsDarkMode(!isDarkMode)
    htmlElement?.setAttribute('data-bs-theme', isDarkMode ? 'light' : 'dark')
  }

  return (
    <Navbar
      collapseOnSelect
      expand={false}
      sticky="top"
      bg={currentTheme ?? 'dark'}
      className="nav-opacity"
    >
      <Container fluid>
        <Navbar.Toggle aria-controls="offcanvasNavbar" onClick={handleShow} />
        {isRunningStandalone() && (
          <Navbar.Brand>
            <Button variant="transparent-outline">
              <ChevronLeft size={24} onClick={() => router.back()} />
            </Button>
            <Button variant="transparent-outline">
              <ArrowClockwise
                size={24}
                onClick={() => window.location.reload()}
              />
            </Button>
          </Navbar.Brand>
        )}

        <Navbar.Offcanvas
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
          placement="start"
          show={show}
          onHide={handleShow}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel" />
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav variant="pills" className="justify-content-start flex-grow-1">
              {menuItems.map((menuItem, index) => (
                <RoleView key={index} roles={menuItem.roles}>
                  <Button
                    variant={`outline-${isDarkMode ? 'light' : 'dark'}`}
                    className="my-1 nav-btn"
                    onClick={() => {
                      router.push(menuItem.to)
                      handleShow()
                    }}
                  >
                    {menuItem.name}
                  </Button>
                </RoleView>
              ))}
            </Nav>
            <SearchBox handleShow={handleShow} />
          </Offcanvas.Body>
          <Card>
            <Container className="footer p-3">
              <Row>
                <Col>
                  <div
                    onClick={() => {
                      handleShow()
                      router.push('/user-profile')
                    }}
                  >
                    <UserProfileIcon />
                  </div>
                </Col>
                <Col className="col-auto">
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <Button variant="gray">
                      {!isDarkMode ? (
                        <Moon size={22} onClick={toggleColorMode} />
                      ) : (
                        <Sun size={22} onClick={toggleColorMode} />
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Container>
          </Card>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  )
}

export default Navigator
