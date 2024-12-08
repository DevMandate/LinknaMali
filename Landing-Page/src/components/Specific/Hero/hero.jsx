import React, {useContext} from "react";
import Header from '../../Layout/header';
import { ThemeMuiSwitch } from "../../Common/Switch";
import {useTheme} from '../../../context/Theme'
function Hero() {

    const { theme, toggleTheme } = useTheme();
    return(
        <>
            <Header />
            <ThemeMuiSwitch toggleTheme={toggleTheme} checked={theme === 'dark'} />
        </>
    );
}

export default Hero;
