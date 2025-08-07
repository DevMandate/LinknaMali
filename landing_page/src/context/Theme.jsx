import React, {useCallback, createContext, useContext, useEffect, useState } from 'react';


const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [message,setMessage] = useState('');
    const [alertClose, setAlertClose] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const handleClose = (event) => {
        event.stopPropagation();
        setAlertOpen(false);
        setAlertClose(true);
    };
    const handleExit = (event) => {
        event.stopPropagation();
        setAlertOpen(false);
    };

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    }, []);
    

    return (
        <ThemeContext.Provider 
        value={{ 
            theme, 
            toggleTheme,
            message,
            setMessage,
            alertOpen,
            setAlertOpen,
            alertClose,
            setAlertClose,
            handleClose,
            handleExit,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

