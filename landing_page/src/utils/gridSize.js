export function gridSize(isSmallScreen,priorityDisplay,link, Array, smallScreenSLice, normalScreenSlice) {
    let retval;
    if (isSmallScreen) {
        // Small screen logic
        if (priorityDisplay === link) {
            retval = Array; 
        } else {
            retval = Array.slice(0, smallScreenSLice); 
        }
    } else {
        // Normal screen logic
        if (priorityDisplay === link) {
            retval = Array; 
        } else {
            retval = Array.slice(0, normalScreenSlice);
        }
    }
    return retval;
} 