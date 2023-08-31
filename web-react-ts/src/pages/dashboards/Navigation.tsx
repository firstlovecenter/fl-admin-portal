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
import { Link } from 'react-router-dom'
import { menuItems } from './dashboard-utils'
import SearchBox from 'components/SearchBox'
import { ArrowClockwise, ChevronLeft, Moon, Sun } from 'react-bootstrap-icons'
import './Navigation.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const Navigator = () => {
  const navigate = useNavigate()

  const isRunningStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches
  }

  const htmlElement = document.querySelector('html')
  const currentTheme = htmlElement?.getAttribute('data-bs-theme')

  const [isDarkMode, setIsDarkMode] = useState(currentTheme === 'dark')

  const toggleColorMode = () => {
    setIsDarkMode(!isDarkMode)
    htmlElement?.setAttribute('data-bs-theme', isDarkMode ? 'light' : 'dark')
  }

  return (
    <Navbar collapseOnSelect bg="dark" expand={false} sticky="top">
      <Container fluid>
        <Navbar.Toggle aria-controls="offcanvasNavbar" />
        {isRunningStandalone() && (
          <Navbar.Brand>
            <button className="btn btn-transparent-outline">
              <ChevronLeft size={24} onClick={() => navigate(-1)} />
            </button>
            <button className="btn btn-transparent-outline">
              <ArrowClockwise
                size={24}
                onClick={() => window.location.reload()}
              />
            </button>
          </Navbar.Brand>
        )}

        <Navbar.Offcanvas
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
          placement="start"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel"></Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav variant="pills" className="justify-content-start flex-grow-1">
              {menuItems.map((menuItem, index) => (
                <RoleView key={index} roles={menuItem.roles}>
                  <Button variant="outline-secondary" className="my-1 p-0">
                    <Nav.Link
                      as={Link}
                      eventKey={index}
                      to={menuItem.to}
                      className="nav-btn"
                    >
                      {menuItem.name}
                    </Nav.Link>
                  </Button>
                </RoleView>
              ))}
              <SearchBox />
            </Nav>
          </Offcanvas.Body>
          <Card>
            <Container className="footer p-3">
              <Row>
                <Col>
                  <Nav.Link
                    as={Link}
                    eventKey={menuItems.length}
                    to="/user-profile"
                  >
                    <UserProfileIcon />
                  </Nav.Link>
                </Col>
                <Col>
                  <div className="d-flex justify-content-center align-items-center h-100">
                    {!isDarkMode ? (
                      <Moon size={22} onClick={toggleColorMode} />
                    ) : (
                      <Sun size={22} onClick={toggleColorMode} />
                    )}
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
