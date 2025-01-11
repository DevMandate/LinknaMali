import React from 'react'
import Property from '../components/Specific/2_Property/property'
import Rentals from '../components/Specific/3_Rentals/property'
import Services from '../components/Specific/4_Services/services'
import About from '../components/Specific/5_About/about'

function Main() {
  return (
    <>
      <Property/>
      <Rentals/>
      <Services/>
      <About/>
    </>
  )
}
export default Main
