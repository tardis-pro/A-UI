import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BreadcrumbItem {
    path: string;
    label: string;
}

interface NavigationState {
    currentPath: string;
    previousPath: string;
    breadcrumbs: BreadcrumbItem[];
    navigationHistory: string[];
    historyIndex: number;
    sidebarActiveItem: string;
    shortcuts: Record<string, string>;
}

const initialState: NavigationState = {
    currentPath: '/',
    previousPath: '/',
    breadcrumbs: [],
    navigationHistory: ['/'],
    historyIndex: 0,
    sidebarActiveItem: '',
    shortcuts: {},
};

const navigationSlice = createSlice({
    name: 'navigation',
    initialState,
    reducers: {
        setCurrentPath: (state, action: PayloadAction<string>) => {
            state.previousPath = state.currentPath;
            state.currentPath = action.payload;
            state.navigationHistory = [
                ...state.navigationHistory.slice(0, state.historyIndex + 1),
                action.payload,
            ];
            state.historyIndex = state.navigationHistory.length - 1;
        },
        setBreadcrumbs: (state, action: PayloadAction<BreadcrumbItem[]>) => {
            state.breadcrumbs = action.payload;
        },
        goBack: (state) => {
            if (state.historyIndex > 0) {
                state.historyIndex--;
                state.currentPath = state.navigationHistory[state.historyIndex];
            }
        },
        goForward: (state) => {
            if (state.historyIndex < state.navigationHistory.length - 1) {
                state.historyIndex++;
                state.currentPath = state.navigationHistory[state.historyIndex];
            }
        },
        setSidebarActiveItem: (state, action: PayloadAction<string>) => {
            state.sidebarActiveItem = action.payload;
        },
        addShortcut: (state, action: PayloadAction<{ key: string; path: string }>) => {
            state.shortcuts[action.payload.key] = action.payload.path;
        },
        removeShortcut: (state, action: PayloadAction<string>) => {
            delete state.shortcuts[action.payload];
        },
    },
});

export const {
    setCurrentPath,
    setBreadcrumbs,
    goBack,
    goForward,
    setSidebarActiveItem,
    addShortcut,
    removeShortcut,
} = navigationSlice.actions;

export default navigationSlice.reducer;