import React from "react";
import BasicButton from '../../../../Common/MUI_Button_Custom/basic'
import { usePriorityDisplay } from '../../../../../context/PriorityDisplay';

const NoBookings = () => {
    const {setPriorityDisplay } = usePriorityDisplay();
    const handleClick = () => {
        setPriorityDisplay('properties');
    }
  return (
    <div>
      <h3>Looks like you haven't made any bookings.</h3>
      <BasicButton onClick={handleClick} sx={{mt:2}} text='Explore Listings'/>
    </div>
  );
};

export default NoBookings;
