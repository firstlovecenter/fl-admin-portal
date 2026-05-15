import React from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

import GlobeIcon from 'assets/icons/Globe'
import Silhouette from 'assets/icons/flcOutline'
import SynagoLogo from 'components/SynagoLogo'
import BarsIcon from 'assets/icons/Bars'
import AuthButton from './buttons/AuthButton'
import MobileView from './responsive-design/MobileView'
import TabletDesktopView from './responsive-design/TabletDesktopView'
import './Login.css'

const carouselSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  arrows: false,
  autoplaySpeed: 2100,
}

const CATCH_PHRASE = 'Be thou diligent to know the state of your flock...'

const LoginHeader = () => (
  <header className="w-full bg-background/95 backdrop-blur">
    <div className="mx-auto flex max-w-screen-xl items-center px-4 py-3">
      <SynagoLogo className="text-brand" title="Synago" />
    </div>
  </header>
)

const Login = () => {
  return (
    <>
      <TabletDesktopView>
        <>
          <LoginHeader />
          <div className="login-page desktop-card mx-auto mt-12 text-center">
            <Slider {...carouselSettings} className="mb-8 mt-8">
              <div>
                <Silhouette className="logo mx-auto block max-w-full" />
              </div>
              <div>
                <BarsIcon className="logo mx-auto block max-w-full" />
              </div>
              <div>
                <GlobeIcon className="logo mx-auto block max-w-full" />
              </div>
            </Slider>
            <h2 className="mb-3 mt-3 text-2xl font-bold tracking-tight text-foreground">
              Synago
            </h2>
            <p className="text-sm">
              <span className="mt-3 block text-foreground">{CATCH_PHRASE}</span>
              <span className="mb-5 mt-1 block text-muted-foreground">
                Click to log in to your servants portal
              </span>
            </p>

            <div className="mx-auto mt-6 w-full max-w-xs">
              <AuthButton mobileFullSize />
            </div>
          </div>
        </>
      </TabletDesktopView>

      <MobileView>
        <div className="bg-wrapper min-h-screen">
          <LoginHeader />
          <div className="bg-content login-page mx-auto mt-8 px-4 text-center">
            <Slider {...carouselSettings} className="mb-8">
              <div>
                <Silhouette className="logo mx-auto block max-w-full" />
              </div>
              <div>
                <BarsIcon className="logo mx-auto block max-w-full" />
              </div>
              <div>
                <GlobeIcon className="logo mx-auto block max-w-full" />
              </div>
            </Slider>
            <h3 className="mb-3 mt-3 text-xl font-bold tracking-tight text-foreground">
              Synago
            </h3>

            <p className="text-sm">
              <span className="mt-3 block text-foreground">{CATCH_PHRASE}</span>
              <span className="mb-5 mt-1 block text-muted-foreground">
                Click to log in to the admin portal
              </span>
            </p>

            <div className="mx-auto mt-8 w-full max-w-xs">
              <AuthButton mobileFullSize />
            </div>
          </div>
        </div>
      </MobileView>
    </>
  )
}

export default Login
