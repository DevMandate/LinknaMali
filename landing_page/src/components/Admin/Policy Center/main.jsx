import React from "react";
import { usePriorityDisplay } from "../../../context/PriorityDisplay";

function PolicyCenter() {
    const { priorityDisplay } = usePriorityDisplay();
    return(
        <div 
        className='div'
        style={{
            display: priorityDisplay === "policy-center" ? "block" : "none",
        }}
        >  
        </div>
    );
}

export default PolicyCenter;
