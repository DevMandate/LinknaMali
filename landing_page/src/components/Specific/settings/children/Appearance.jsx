import React from 'react';
import {useTheme} from '../../../../context/Theme';
import {ThemeMuiSwitch} from '../../../Common/Switch';
import ProfilePicture from './profilePicture';

const Appearance = ({isactive}) => {

  const { theme, toggleTheme } = useTheme();
  return (
    <div 
    id='appearance'
    style={{display: isactive === 'appearance' || isactive === null ? 'block' : 'none',}}
    className="quick-actions">
      <h2>Appearance</h2>
      <ProfilePicture />
      <div>
          <label htmlFor="theme-toggle">Toggle Theme</label>
          <ThemeMuiSwitch toggleTheme={toggleTheme} checked={theme === 'dark'} />
      </div>
    </div>
  ); 
}; 

export default Appearance;
