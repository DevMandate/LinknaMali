import React from 'react'
import {ThemeProvider} from './context/Theme'
import {LoginProvider} from './context/IsLoggedIn'
import Hero from './components/Specific/1_Hero/hero'
import Property from './components/Specific/2_Property/property'
import Rentals from './components/Specific/3_Rentals/property'
import Services from './components/Specific/4_Services/services'
import About from './components/Specific/5_About/about'
import Footer from './components/Layout/Footer/footer'
import './assets/styles/styles.css'
import './assets/styles/theme.css'

function App() {
  return (
    <LoginProvider>
    <ThemeProvider>
      <Hero />
      <Property/>
      <Rentals/>
      <Services/>
      <About/>
      <Footer/>
    </ThemeProvider>
    </LoginProvider>
  )
}
export default App
