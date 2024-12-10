import React from 'react'
import {ThemeProvider} from './context/Theme'
import Hero from './components/Specific/Hero/hero'
import Property from './components/Specific/Property/property'
import './assets/styles/styles.css'
import './assets/styles/theme.css'

function App() {
  return (
    <ThemeProvider>
      <Hero />
      <Property/>
    </ThemeProvider>
  )
}
export default App
