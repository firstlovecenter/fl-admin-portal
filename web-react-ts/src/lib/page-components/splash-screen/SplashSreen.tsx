import React from 'react'
import logo from '@/assets/splash-screen-flc-logo.png'
import './SplashScreen.css'

const SplashSreen = () => {
  return (
    <div className="cover">
      <div className="d-flex aligns-items-center justify-content-center ">
        <img src={logo.src} alt="FLC Logo" id="icon" className="animation" />
      </div>
    </div>
  )
}

export default SplashSreen
