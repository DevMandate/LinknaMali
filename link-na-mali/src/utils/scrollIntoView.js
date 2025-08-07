
export function scrollIntoView(link){
    setTimeout(() => {
        const element = document.getElementById(link);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100); 
};