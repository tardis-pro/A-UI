# Layout System

## Overview
The A-UI Layout System provides a flexible and responsive layout structure with collapsible sidebars, a main content area, and customizable layouts.

## Components

### Layout
The root component that orchestrates the overall layout structure.

```tsx
import { Layout } from './components/layout';

<Layout
  leftSidebar={<LeftSidebarContent />}
  rightSidebar={<RightSidebarContent />}
>
  <MainContent />
</Layout>
```

### Sidebar
A flexible sidebar component that can be used for both left and right sidebars.

```tsx
import { Sidebar } from './components/layout';

<Sidebar
  position="left" // or "right"
  title="Navigation"
  onToggle={() => {}}
  isOpen={true}
>
  <Sidebar.Section title="Main">
    {/* Sidebar content */}
  </Sidebar.Section>
</Sidebar>
```

### MainContent
The main content area with a flexible grid system and scroll management.

```tsx
import { MainContent, ContentSection, ContentItem } from './components/layout';

<MainContent>
  <ContentSection>
    <ContentItem.Full>
      {/* Full width content */}
    </ContentItem.Full>
    <ContentItem.Half>
      {/* Half width content */}
    </ContentItem.Half>
  </ContentSection>
</MainContent>
```

## Layout Context

The layout system uses React Context to manage layout state:

```tsx
import { LayoutProvider, useLayout } from './components/layout';

// Access layout state and controls
const { 
  leftSidebarOpen,
  rightSidebarOpen,
  toggleLeftSidebar,
  toggleRightSidebar,
  isMobile
} = useLayout();
```

## Grid System

The layout includes a flexible grid system with predefined components:

- `ContentItem.Full` - Full width (12 columns)
- `ContentItem.Half` - Half width (6 columns)
- `ContentItem.Third` - One third width (4 columns)
- `ContentItem.Quarter` - One quarter width (3 columns)
- `ContentItem.Custom` - Custom grid configuration

## Responsive Behavior

The layout system automatically adapts to different screen sizes:

- Mobile (<960px):
  - Sidebars are collapsible and overlay content
  - Single column layout
  - Compact spacing

- Tablet (960px - 1280px):
  - Sidebars can be toggled
  - Two column layout support
  - Medium spacing

- Desktop (>1280px):
  - Sidebars visible by default
  - Multi-column layout
  - Comfortable spacing

## Layout Constants

```tsx
import { LAYOUT_CONSTANTS } from './components/layout';

const {
  LEFT_SIDEBAR_WIDTH,    // 280px
  RIGHT_SIDEBAR_WIDTH,   // 320px
  HEADER_HEIGHT,         // 64px
  FOOTER_HEIGHT,         // 48px
  CONTENT_MAX_WIDTH,     // 1920px
} = LAYOUT_CONSTANTS;
```

## Theme Integration

The layout system integrates with the A-UI theme system for consistent styling:

- Uses theme colors for backgrounds and borders
- Respects theme spacing
- Supports light/dark mode
- Uses theme transitions
- Follows theme typography

## Layout Persistence

Layout preferences (sidebar states, custom layouts) can be managed through the Layout Context and persisted if needed:

```tsx
const { setLayoutPreset } = useLayout();

// Set a layout preset
setLayoutPreset('compact');