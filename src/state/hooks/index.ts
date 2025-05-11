import { useAppDispatch, useAppSelector } from './core';
import { toggleThemeMode, setFontSize, setFontFamily, setSpacing, setBorderRadius } from '../slices/themeSlice';
import {
    toggleSidebar,
    setSidebarWidth,
    setContentWidth,
    setContentPadding,
    setLayoutDensity,
} from '../slices/layoutSlice';
import {
    setCurrentPath,
    setBreadcrumbs,
    goBack,
    goForward,
    setSidebarActiveItem,
} from '../slices/navigationSlice';
import {
    setNotificationPreference,
    setDisplayPreference,
    setAccessibilityPreference,
    updateEditorConfig,
} from '../slices/userPreferencesSlice';

// Theme hooks
export const useThemeActions = () => {
    const dispatch = useAppDispatch();
    return {
        toggleThemeMode: () => dispatch(toggleThemeMode()),
        setFontSize: (size: number) => dispatch(setFontSize(size)),
        setFontFamily: (family: string) => dispatch(setFontFamily(family)),
        setSpacing: (spacing: number) => dispatch(setSpacing(spacing)),
        setBorderRadius: (radius: number) => dispatch(setBorderRadius(radius)),
    };
};

// Layout hooks
export const useLayoutActions = () => {
    const dispatch = useAppDispatch();
    return {
        toggleSidebar: () => dispatch(toggleSidebar()),
        setSidebarWidth: (width: number) => dispatch(setSidebarWidth(width)),
        setContentWidth: (width: 'full' | 'contained') => dispatch(setContentWidth(width)),
        setContentPadding: (padding: number) => dispatch(setContentPadding(padding)),
        setLayoutDensity: (density: 'compact' | 'comfortable' | 'spacious') =>
            dispatch(setLayoutDensity(density)),
    };
};

// Navigation hooks
export const useNavigationActions = () => {
    const dispatch = useAppDispatch();
    return {
        setCurrentPath: (path: string) => dispatch(setCurrentPath(path)),
        setBreadcrumbs: (breadcrumbs: { path: string; label: string }[]) =>
            dispatch(setBreadcrumbs(breadcrumbs)),
        goBack: () => dispatch(goBack()),
        goForward: () => dispatch(goForward()),
        setSidebarActiveItem: (item: string) => dispatch(setSidebarActiveItem(item)),
    };
};

// User preferences hooks
import type { NotificationPreferences, DisplayPreferences } from '../slices/userPreferencesSlice';

export const useUserPreferencesActions = () => {
    const dispatch = useAppDispatch();
    return {
        setNotificationPreference: (
            type: keyof NotificationPreferences,
            value: boolean
        ) => dispatch(setNotificationPreference({ type, value })),
        setDisplayPreference: <K extends keyof DisplayPreferences>(
            key: K,
            value: DisplayPreferences[K]
        ) => dispatch(setDisplayPreference({ key, value })),
        setAccessibilityPreference: (
            key: 'reduceMotion' | 'highContrast' | 'screenReader',
            value: boolean
        ) => dispatch(setAccessibilityPreference({ key, value })),
        updateEditorConfig: (config: Partial<{
            tabSize: number;
            insertSpaces: boolean;
            wordWrap: 'on' | 'off' | 'wordWrapColumn';
            rulers: number[];
        }>) => dispatch(updateEditorConfig(config)),
    };
};

// Selector hooks (for state access)
export const useThemeState = () => useAppSelector((state) => state.theme);
export const useLayoutState = () => useAppSelector((state) => state.layout);
export const useNavigationState = () => useAppSelector((state) => state.navigation);
export const useUserPreferencesState = () => useAppSelector((state) => state.userPreferences);

// Combined hooks (state + actions)
export const useTheme = () => {
    const state = useThemeState();
    const actions = useThemeActions();
    return { ...state, ...actions };
};

export const useLayout = () => {
    const state = useLayoutState();
    const actions = useLayoutActions();
    return { ...state, ...actions };
};

export const useNavigation = () => {
    const state = useNavigationState();
    const actions = useNavigationActions();
    return { ...state, ...actions };
};

export const useUserPreferences = () => {
    const state = useUserPreferencesState();
    const actions = useUserPreferencesActions();
    return { ...state, ...actions };
};