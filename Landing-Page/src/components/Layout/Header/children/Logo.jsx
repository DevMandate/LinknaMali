import React from "react";
import {LinknaMali} from '../../../../assets/images'

function Logo({size}){
    return(
        <img style={{width:`${size}px`}} src={LinknaMali} title="Link na Mali" alt="LinknaMali Logo"/>
    )
}

export default Logo;
