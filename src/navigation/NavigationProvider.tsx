import { ReactNode, useCallback, useReducer } from 'react';
import { NavigationContext, NavigationState } from './NavigationContext';

type NavigationAction =
    | { type: 'NAVIGATE'; path: string }
    | { type: 'ADD_FAVORITE'; path: string }
    | { type: 'REMOVE_FAVORITE'; path: string };

const MAX_HISTORY_ITEMS = 10;
const MAX_RECENT_ITEMS = 5;

const navigationReducer = (state: NavigationState, action: NavigationAction): NavigationState => {
    switch (action.type) {
        case 'NAVIGATE':
            return {
                ...state,
                currentPath: action.path,
                history: [action.path, ...state.history.slice(0, MAX_HISTORY_ITEMS - 1)],
                recentItems: state.recentItems.includes(action.path)
                    ? state.recentItems
                    : [action.path, ...state.recentItems.slice(0, MAX_RECENT_ITEMS - 1)]
            };
        case 'ADD_FAVORITE':
            return {
                ...state,
                favorites: state.favorites.includes(action.path)
                    ? state.favorites
                    : [...state.favorites, action.path]
            };
        case 'REMOVE_FAVORITE':
            return {
                ...state,
                favorites: state.favorites.filter(path => path !== action.path)
            };
        default:
            return state;
    }
};

const initialState: NavigationState = {
    currentPath: '/',
    history: [],
    favorites: [],
    recentItems: []
};

interface NavigationProviderProps {
    children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
    const [state, dispatch] = useReducer(navigationReducer, initialState);

    const navigate = useCallback((path: string) => {
        dispatch({ type: 'NAVIGATE', path });
    }, []);

    const addToFavorites = useCallback((path: string) => {
        dispatch({ type: 'ADD_FAVORITE', path });
    }, []);

    const removeFromFavorites = useCallback((path: string) => {
        dispatch({ type: 'REMOVE_FAVORITE', path });
    }, []);

    return (
        <NavigationContext.Provider
            value={{
                state,
                navigate,
                addToFavorites,
                removeFromFavorites
            }}
        >
            {children}
        </NavigationContext.Provider>
    );
};