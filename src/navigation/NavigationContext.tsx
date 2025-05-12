import { createContext, useContext } from 'react';

export interface NavigationState {
    currentPath: string;
    history: string[];
    favorites: string[];
    recentItems: string[];
}

export interface NavigationContextType {
    state: NavigationState;
    navigate: (path: string) => void;
    addToFavorites: (path: string) => void;
    removeFromFavorites: (path: string) => void;
}

const defaultState: NavigationState = {
    currentPath: '/',
    history: [],
    favorites: [],
    recentItems: []
};

export const NavigationContext = createContext<NavigationContextType>({
    state: defaultState,
    navigate: () => { },
    addToFavorites: () => { },
    removeFromFavorites: () => { }
});

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};