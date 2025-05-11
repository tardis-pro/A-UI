import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import themeReducer from './slices/themeSlice';
import layoutReducer from './slices/layoutSlice';
import navigationReducer from './slices/navigationSlice';
import userPreferencesReducer from './slices/userPreferencesSlice';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['theme', 'layout', 'userPreferences'], // Navigation state is not persisted as it's managed by router
};

const rootReducer = combineReducers({
    theme: themeReducer,
    layout: layoutReducer,
    navigation: navigationReducer,
    userPreferences: userPreferencesReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;