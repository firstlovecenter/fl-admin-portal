import React from 'react'
import AuthButton from './buttons/AuthButton'
import MobileView from './responsive-design/MobileView'
import TabletDesktopView from './responsive-design/TabletDesktopView'
import { Container, Navbar } from 'react-bootstrap'
import './Login.css'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

import GlobeIcon from 'assets/icons/Globe'
import Silhouette from 'assets/icons/flcOutline'
import Logo from '../assets/flc-logo-small.webp'
import BarsIcon from 'assets/icons/Bars'

const Login = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    arrows: false,
    autoplaySpeed: 2100,
  }
  const catchPhrase = 'Be thou diligent to know the state of your flock...'

  return (
    <>
      <TabletDesktopView>
        <>
          <Navbar bg="dark">
            <Container>
              <img
                src={Logo}
                height="30"
                className="d-inline-block align-top"
                alt="FirstLove Logo"
              />
            </Container>
          </Navbar>
          <div className="container text-center mt-5 desktop-card login-page">
            <div className="row align-self-center">
              <Slider {...settings} className="mb-5 mt-5">
                <div>
                  <Silhouette className="img-fluid mx-auto d-block logo" />
                </div>
                <div>
                  <BarsIcon className="img-fluid mx-auto d-block logo" />
                </div>
                <div>
                  <GlobeIcon className="img-fluid mx-auto d-block logo" />
                </div>
              </Slider>
              <h2 className="mb-3 mt-3 text-white font-weight-bold">
                FLC State of the Flock
              </h2>
              <p>
                <span className="mt-3 text-white">{catchPhrase}</span>
                <br />

                <span className="text-secondary mb-5">
                  Click to log in to your servants portal
                </span>
              </p>

              <div className="col-8 mx-auto mt-4">
                <AuthButton mobileFullSize />
              </div>
            </div>
          </div>
        </>
      </TabletDesktopView>

      {/* <!--Mobile--> */}
      <MobileView>
        <div className="bg-wrapper">
          <Navbar bg="dark">
            <Container>
              <img
                src={Logo}
                height="30"
                className="d-inline-block align-top"
                alt="FirstLove Logo"
              />
            </Container>
          </Navbar>
          <Container className="text-center mt-5 bg-content login-page">
            <Slider {...settings} className="mb-5">
              <div>
                <Silhouette className="img-fluid mx-auto d-block logo" />
              </div>
              <div>
                <BarsIcon className="img-fluid mx-auto d-block logo" />
              </div>
              <div>
                <GlobeIcon className="img-fluid mx-auto d-block logo" />
              </div>
            </Slider>
            <h3 className="mb-3 mt-3 text-white font-weight-bold">
              FLC State of the Flock
            </h3>

            <p>
              <span className="mt-3 text-white">{catchPhrase}</span>
              <br />

              <span className="text-secondary mb-5">
                Click to log in to your servants portal
              </span>
            </p>

            <div className="mx-auto mt-5 ">
              <AuthButton mobileFullSize />
            </div>
          </Container>
        </div>
      </MobileView>
    </>
  )
}

export default Login
