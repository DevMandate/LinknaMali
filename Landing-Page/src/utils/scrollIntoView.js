
export function scrollIntoView(link){
    console.log(link);
    setTimeout(() => {
        const element = document.getElementById(link);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100); 
};