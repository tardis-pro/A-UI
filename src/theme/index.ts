import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode, PaletteOptions } from '@mui/material';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { components } from './components';

type CustomPaletteKey = keyof PaletteOptions;

export function createAppTheme(mode: PaletteMode, customColors?: Record<string, string>): Theme {
    const basePalette = mode === 'light' ? lightPalette : darkPalette;
    let palette = { ...basePalette };

    // Merge custom colors if provided
    if (customColors) {
        Object.entries(customColors).forEach(([key, value]) => {
            const paletteKey = key as CustomPaletteKey;
            if (paletteKey in palette && typeof palette[paletteKey] === 'object') {
                palette = {
                    ...palette,
                    [paletteKey]: {
                        ...(palette[paletteKey] as Record<string, unknown>),
                        main: value
                    }
                };
            }
        });
    }

    const themeOptions: ThemeOptions = {
        palette,
        typography,
        shape: {
            borderRadius: 8,
        },
        spacing: 8,
        shadows: [
            'none',
            '0px 2px 4px rgba(0,0,0,0.1)',
            '0px 4px 8px rgba(0,0,0,0.12)',
            '0px 8px 16px rgba(0,0,0,0.14)',
            '0px 10px 20px rgba(0,0,0,0.16)',
            ...Array(20).fill('none').map(() => '0px 0px 0px rgba(0,0,0,0)'),
        ] as Theme['shadows'],
    };

    const theme = createTheme(themeOptions);

    // Add component overrides with theme reference
    theme.components = components(theme);

    return theme;
}

export { useThemeMode, useThemePreferences } from './hooks';
export { lightPalette, darkPalette } from './palette';