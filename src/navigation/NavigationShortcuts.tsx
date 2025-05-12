import { FC, useEffect } from 'react';
import { useRouterNavigation } from './useRouterNavigation';
import routes, { getAllPaths } from './routes';

interface ShortcutMapping {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    path: string;
    description: string;
}

const shortcuts: ShortcutMapping[] = [
    { key: 'h', ctrlKey: true, path: '/', description: 'Go to Home' },
    { key: 'd', ctrlKey: true, path: '/dashboard', description: 'Go to Dashboard' },
    { key: 'c', ctrlKey: true, path: '/code', description: 'Go to Code' },
    { key: 'k', ctrlKey: true, path: '/knowledge', description: 'Go to Knowledge Base' },
    // Add more shortcuts as needed
];

export const NavigationShortcuts: FC = () => {
    const { navigate } = useRouterNavigation();

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Ignore key events in input fields
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const shortcut = shortcuts.find(
                s =>
                    s.key.toLowerCase() === event.key.toLowerCase() &&
                    !!s.ctrlKey === event.ctrlKey &&
                    !!s.altKey === event.altKey
            );

            if (shortcut) {
                event.preventDefault();
                navigate(shortcut.path);
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [navigate]);

    // This component doesn't render anything
    return null;
};

// Helper function to get all available shortcuts
export const getAvailableShortcuts = (): { keys: string; description: string }[] => {
    return shortcuts.map(shortcut => {
        const keys = [
            shortcut.ctrlKey && 'Ctrl',
            shortcut.altKey && 'Alt',
            shortcut.key.toUpperCase(),
        ]
            .filter(Boolean)
            .join('+');

        return {
            keys,
            description: shortcut.description
        };
    });
};