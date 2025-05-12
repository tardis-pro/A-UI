import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigation } from './NavigationContext';

export const useRouterNavigation = () => {
    const location = useLocation();
    const routerNavigate = useNavigate();
    const { state, navigate: contextNavigate, addToFavorites, removeFromFavorites } = useNavigation();

    // Sync router location with navigation context
    useEffect(() => {
        if (state.currentPath !== location.pathname) {
            contextNavigate(location.pathname);
        }
    }, [location.pathname, state.currentPath, contextNavigate]);

    // Enhanced navigate function that updates both router and context
    const navigate = (path: string) => {
        routerNavigate(path);
        contextNavigate(path);
    };

    return {
        currentPath: location.pathname,
        navigate,
        // Re-export useful state and functions
        favorites: state.favorites,
        recentItems: state.recentItems,
        history: state.history,
        addToFavorites,
        removeFromFavorites
    };
};