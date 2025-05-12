import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sound: boolean;
}

export interface DisplayPreferences {
    animationsEnabled: boolean;
    showTips: boolean;
    language: string;
    timezone: string;
}

export interface UserPreferencesState {
    notifications: NotificationPreferences;
    display: DisplayPreferences;
    accessibility: {
        reduceMotion: boolean;
        highContrast: boolean;
        screenReader: boolean;
    };
    developer: {
        showDebugInfo: boolean;
        experimentalFeatures: boolean;
        editorConfig: {
            tabSize: number;
            insertSpaces: boolean;
            wordWrap: 'on' | 'off' | 'wordWrapColumn';
            rulers: number[];
        };
    };
}

const initialState: UserPreferencesState = {
    notifications: {
        email: true,
        push: true,
        desktop: true,
        sound: true,
    },
    display: {
        animationsEnabled: true,
        showTips: true,
        language: 'en',
        timezone: 'UTC',
    },
    accessibility: {
        reduceMotion: false,
        highContrast: false,
        screenReader: false,
    },
    developer: {
        showDebugInfo: false,
        experimentalFeatures: false,
        editorConfig: {
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            rulers: [80, 120],
        },
    },
};

const userPreferencesSlice = createSlice({
    name: 'userPreferences',
    initialState,
    reducers: {
        setNotificationPreference: (
            state,
            action: PayloadAction<{ type: keyof NotificationPreferences; value: boolean }>
        ) => {
            state.notifications[action.payload.type] = action.payload.value;
        },
        setDisplayPreference: (
            state,
            action: PayloadAction<{ key: keyof DisplayPreferences; value: DisplayPreferences[keyof DisplayPreferences] }>
        ) => {
            const { key, value } = action.payload;
            (state.display[key] as typeof value) = value;
        },
        setAccessibilityPreference: (
            state,
            action: PayloadAction<{ key: keyof typeof initialState.accessibility; value: boolean }>
        ) => {
            state.accessibility[action.payload.key] = action.payload.value;
        },
        updateEditorConfig: (
            state,
            action: PayloadAction<Partial<typeof initialState.developer.editorConfig>>
        ) => {
            state.developer.editorConfig = {
                ...state.developer.editorConfig,
                ...action.payload,
            };
        },
        toggleExperimentalFeatures: (state) => {
            state.developer.experimentalFeatures = !state.developer.experimentalFeatures;
        },
        toggleDebugInfo: (state) => {
            state.developer.showDebugInfo = !state.developer.showDebugInfo;
        },
    },
});

export const {
    setNotificationPreference,
    setDisplayPreference,
    setAccessibilityPreference,
    updateEditorConfig,
    toggleExperimentalFeatures,
    toggleDebugInfo,
} = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer;