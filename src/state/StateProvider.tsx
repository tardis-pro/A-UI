import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { useAppDispatch } from './hooks/core';
import { setCurrentPath } from './slices/navigationSlice';

interface StateProviderProps {
    children: React.ReactNode;
}

export function StateProvider({ children }: StateProviderProps) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
}


import { useSyncURL } from './hooks/navigation';

// URL synchronization component
const URLSync: React.FC = () => {
    useSyncURL();
    return null;
};

export const StateProviderWithSync: React.FC<StateProviderProps> = ({ children }) => {
    return (
        <StateProvider>
            <URLSync />
            {children}
        </StateProvider>
    );
};