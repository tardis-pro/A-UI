import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

interface LayoutState {
    leftSidebarOpen: boolean;
    rightSidebarOpen: boolean;
    layoutPreset: 'default' | 'compact' | 'expanded';
}

interface LayoutContextType extends LayoutState {
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setLayoutPreset: (preset: LayoutState['layoutPreset']) => void;
    isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
    children: ReactNode;
}

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [state, setState] = useState<LayoutState>({
        leftSidebarOpen: !isMobile,
        rightSidebarOpen: !isMobile,
        layoutPreset: 'default',
    });

    const toggleLeftSidebar = useCallback(() => {
        setState(prev => ({
            ...prev,
            leftSidebarOpen: !prev.leftSidebarOpen
        }));
    }, []);

    const toggleRightSidebar = useCallback(() => {
        setState(prev => ({
            ...prev,
            rightSidebarOpen: !prev.rightSidebarOpen
        }));
    }, []);

    const setLayoutPreset = useCallback((preset: LayoutState['layoutPreset']) => {
        setState(prev => ({
            ...prev,
            layoutPreset: preset
        }));
    }, []);

    return (
        <LayoutContext.Provider
            value={{
                ...state,
                toggleLeftSidebar,
                toggleRightSidebar,
                setLayoutPreset,
                isMobile
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = (): LayoutContextType => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};