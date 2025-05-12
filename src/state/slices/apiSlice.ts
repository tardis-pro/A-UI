import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ApiState {
    isConnected: boolean;
    wsConnected: boolean;
    loading: { [key: string]: boolean };
    errors: { [key: string]: string | null };
    lastSync: string | null;
    retryCount: { [key: string]: number };
    pendingRequests: string[];
    chatMessages?: any[];
}

const initialState: ApiState = {
    isConnected: true,
    wsConnected: false,
    loading: {},
    errors: {},
    lastSync: null,
    retryCount: {},
    pendingRequests: [],
};

const apiSlice = createSlice({
    name: 'api',
    initialState,
    reducers: {
        setApiConnection: (state, action: PayloadAction<boolean>) => {
            state.isConnected = action.payload;
        },
        setWsConnection: (state, action: PayloadAction<boolean>) => {
            state.wsConnected = action.payload;
        },
        setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
            const { key, isLoading } = action.payload;
            state.loading[key] = isLoading;
            if (!isLoading) {
                delete state.retryCount[key];
                state.pendingRequests = state.pendingRequests.filter(r => r !== key);
            } else {
                if (!state.pendingRequests.includes(key)) {
                    state.pendingRequests.push(key);
                }
            }
        },
        setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
            const { key, error } = action.payload;
            state.errors[key] = error;
        },
        incrementRetry: (state, action: PayloadAction<string>) => {
            const key = action.payload;
            state.retryCount[key] = (state.retryCount[key] || 0) + 1;
        },
        updateLastSync: (state) => {
            state.lastSync = new Date().toISOString();
        },
        clearErrors: (state) => {
            state.errors = {};
        },
        addChatMessage: (state, action: PayloadAction<any>) => {
            if (!state.chatMessages) {
                state.chatMessages = [];
            }
            state.chatMessages.push(action.payload);
        }
    },
});

export const {
    setApiConnection,
    setWsConnection,
    setLoading,
    addChatMessage,
    setError,
    incrementRetry,
    updateLastSync,
    clearErrors,
} = apiSlice.actions;

export default apiSlice.reducer;