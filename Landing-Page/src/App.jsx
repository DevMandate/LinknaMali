import React from 'react'
import {ThemeProvider} from './context/Theme'
import {LoginProvider} from './context/IsLoggedIn'
import {PriorityDisplayProvider} from './context/PriorityDisplay'
import Hero from './components/Specific/1_Hero/hero'
import Property from './components/Specific/2_Property/property'
import Rentals from './components/Specific/3_Rentals/property'
import Services from './components/Specific/4_Services/services'
import About from './components/Specific/5_About/about'
import PropertyDetails from './components/Specific/6_PropertyDetails/propertyDetails'
import Footer from './components/Layout/Footer/footer'
import './assets/styles/styles.css'
import './assets/styles/theme.css'

function App() {
  return (
    <PriorityDisplayProvider>
    <LoginProvider>
    <ThemeProvider>
      <Hero />
      <Property/>
      <Rentals/>
      <Services/>
      <About/>
      <PropertyDetails/>
      <Footer/>
    </ThemeProvider>
    </LoginProvider>
    </PriorityDisplayProvider>
  )
}
export default App
