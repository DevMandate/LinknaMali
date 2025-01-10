import React from 'react'
import {ThemeProvider} from './context/Theme'
import {LoginProvider} from './context/IsLoggedIn'
import {PriorityDisplayProvider} from './context/PriorityDisplay'
import Hero from './components/Specific/1_Hero/hero'
import LandingPageRoutes from './Routes/landingPageRoutes'
import Footer from './components/Layout/Footer/footer'
import './assets/styles/styles.css'
import './assets/styles/theme.css'
import './assets/styles/animation.css'
function App() {
  return (
    <PriorityDisplayProvider>
    <LoginProvider>
    <ThemeProvider>
      <Hero />
      <LandingPageRoutes />
      <Footer/>
    </ThemeProvider>
    </LoginProvider>
    </PriorityDisplayProvider>
  )
}
export default App
