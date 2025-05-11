import { Layout } from './Layout';
import { Sidebar } from './Sidebar';
import { MainContent, ContentSection, ContentItem } from './MainContent';
import { LayoutProvider, useLayout } from './LayoutContext';

// Re-export layout constants
export const LAYOUT_CONSTANTS = {
    LEFT_SIDEBAR_WIDTH: 280,
    RIGHT_SIDEBAR_WIDTH: 320,
    HEADER_HEIGHT: 64,
    FOOTER_HEIGHT: 48,
    CONTENT_MAX_WIDTH: 1920,
} as const;

// Re-export breakpoint helpers
export const BREAKPOINTS = {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
} as const;

export {
    Layout,
    Sidebar,
    MainContent,
    ContentSection,
    ContentItem,
    LayoutProvider,
    useLayout,
};

// Export layout-related types
export type { LayoutProps } from './Layout';
export type { SidebarProps } from './Sidebar';
export type { MainContentProps } from './MainContent';