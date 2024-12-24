export function gridSize(isSmallScreen,priorityDisplay,link, Array) {
    let retval;
    if (isSmallScreen) {
        // Small screen logic
        if (priorityDisplay === link) {
            retval = Array; 
        } else {
            retval = Array.slice(0, 3); 
        }
    } else {
        // Normal screen logic
        if (priorityDisplay === link) {
            retval = Array; 
        } else {
            retval = Array.slice(0, 6);
        }
    }
    return retval;
}