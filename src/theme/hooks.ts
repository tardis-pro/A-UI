import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { PaletteMode } from '@mui/material';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
const THEME_MODE_KEY = 'theme-mode';

export const useThemeMode = () => {
    const prefersDarkMode = useMediaQuery(COLOR_SCHEME_QUERY);
    const [mode, setMode] = useState<PaletteMode>(() => {
        const savedMode = localStorage.getItem(THEME_MODE_KEY);
        return (savedMode as PaletteMode) || (prefersDarkMode ? 'dark' : 'light');
    });

    useEffect(() => {
        localStorage.setItem(THEME_MODE_KEY, mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    };

    return {
        mode,
        setMode,
        toggleTheme,
    };
};

export const useThemePreferences = () => {
    const [customColors, setCustomColors] = useState(() => {
        const saved = localStorage.getItem('theme-colors');
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (customColors) {
            localStorage.setItem('theme-colors', JSON.stringify(customColors));
        }
    }, [customColors]);

    const updateCustomColors = (colors: Record<string, string>) => {
        setCustomColors(colors);
    };

    const resetCustomColors = () => {
        localStorage.removeItem('theme-colors');
        setCustomColors(null);
    };

    return {
        customColors,
        updateCustomColors,
        resetCustomColors,
    };
};