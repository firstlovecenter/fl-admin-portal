import RoleView from 'auth/RoleView'
import UserProfileIcon from 'components/UserProfileIcon/UserProfileIcon'
import { menuItems } from './dashboard-utils'
import SearchBox from 'components/SearchBox'
import { RefreshCw, ChevronLeft, Moon, Sun } from 'lucide-react'
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
  const [show, setShow] = useState(false)

  const handleShow = () => setShow(!show)

  const toggleColorMode = () => {
    setIsDarkMode(!isDarkMode)
    htmlElement?.setAttribute('data-bs-theme', isDarkMode ? 'light' : 'dark')
  }

  return (
    <nav>
      <div fluid>
        <nav>
        {isRunningStandalone() && (
          <nav>
            <Button variant="transparent-outline">
              <ChevronLeft size={24} onClick={() => navigate(-1)} />
            </Button>
            <Button variant="transparent-outline">
              <RefreshCw
                size={24}
                onClick={() => window.location.reload()}
              />
            </Button>
          </Navbar.Brand>
        )}

        <nav>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel"></Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav variant="pills" className="justify-content-start flex-grow-1">
              {menuItems.map((menuItem, index) => (
                <RoleView key={index} roles={menuItem.roles}>
                  <Button
                    variant={`outline-${isDarkMode ? 'light' : 'dark'}`}
                    className="my-1 nav-btn"
                    onClick={() => {
                      navigate(menuItem.to)
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
            <div className="footer p-3">
              <div>
                <div>
                  <div
                    onClick={() => {
                      handleShow()
                      navigate('/user-profile')
                    }}
                  >
                    <UserProfileIcon />
                  </div>
                </div>
                <div className="col-auto">
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <Button variant="gray">
                      {!isDarkMode ? (
                        <Moon size={22} onClick={toggleColorMode} />
                      ) : (
                        <Sun size={22} onClick={toggleColorMode} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Navbar.Offcanvas>
      </div>
    </nav>
  )
}

export default Navigator
