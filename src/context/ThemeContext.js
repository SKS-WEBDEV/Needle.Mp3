"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        // Check local storage or system preference
        const savedTheme = localStorage.getItem('zylaes-theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            setTheme('light');
        }

        // Load Karaoke Settings
        const savedColor = localStorage.getItem('karaoke-color');
        if (savedColor) {
            document.documentElement.style.setProperty('--karaoke-color', savedColor);
        }
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('zylaes-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
