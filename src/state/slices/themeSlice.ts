import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PaletteMode } from '@mui/material';

interface ThemeState {
    mode: PaletteMode;
    fontSize: number;
    fontFamily: string;
    spacing: number;
    borderRadius: number;
}

const initialState: ThemeState = {
    mode: 'light',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    spacing: 8,
    borderRadius: 4,
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleThemeMode: (state) => {
            state.mode = state.mode === 'light' ? 'dark' : 'light';
        },
        setFontSize: (state, action: PayloadAction<number>) => {
            state.fontSize = action.payload;
        },
        setFontFamily: (state, action: PayloadAction<string>) => {
            state.fontFamily = action.payload;
        },
        setSpacing: (state, action: PayloadAction<number>) => {
            state.spacing = action.payload;
        },
        setBorderRadius: (state, action: PayloadAction<number>) => {
            state.borderRadius = action.payload;
        },
    },
});

export const {
    toggleThemeMode,
    setFontSize,
    setFontFamily,
    setSpacing,
    setBorderRadius,
} = themeSlice.actions;

export default themeSlice.reducer;