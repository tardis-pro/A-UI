import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LayoutState {
    sidebarOpen: boolean;
    sidebarWidth: number;
    contentWidth: 'full' | 'contained';
    contentPadding: number;
    showBreadcrumbs: boolean;
    showFooter: boolean;
    layoutDensity: 'compact' | 'comfortable' | 'spacious';
}

const initialState: LayoutState = {
    sidebarOpen: true,
    sidebarWidth: 240,
    contentWidth: 'contained',
    contentPadding: 24,
    showBreadcrumbs: true,
    showFooter: true,
    layoutDensity: 'comfortable',
};

const layoutSlice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarWidth: (state, action: PayloadAction<number>) => {
            state.sidebarWidth = action.payload;
        },
        setContentWidth: (state, action: PayloadAction<'full' | 'contained'>) => {
            state.contentWidth = action.payload;
        },
        setContentPadding: (state, action: PayloadAction<number>) => {
            state.contentPadding = action.payload;
        },
        toggleBreadcrumbs: (state) => {
            state.showBreadcrumbs = !state.showBreadcrumbs;
        },
        toggleFooter: (state) => {
            state.showFooter = !state.showFooter;
        },
        setLayoutDensity: (state, action: PayloadAction<'compact' | 'comfortable' | 'spacious'>) => {
            state.layoutDensity = action.payload;
        },
    },
});

export const {
    toggleSidebar,
    setSidebarWidth,
    setContentWidth,
    setContentPadding,
    toggleBreadcrumbs,
    toggleFooter,
    setLayoutDensity,
} = layoutSlice.actions;

export default layoutSlice.reducer;