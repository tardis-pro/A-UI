import { Box, Container, Grid, useTheme, styled } from '@mui/material';
import { ReactNode } from 'react';
import { useLayout } from './LayoutContext';

const MainContentRoot = styled(Box)(({ theme }) => ({
    flex: '1 1 auto',
    width: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    [theme.breakpoints.up('lg')]: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
}));

const ScrollWrapper = styled(Box)(({ theme }) => ({
    height: '100%',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    '&::-webkit-scrollbar': {
        width: 8,
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.divider,
        borderRadius: 4,
    },
    '&::-webkit-scrollbar-track': {
        backgroundColor: theme.palette.background.paper,
    },
}));

interface ContentSectionProps {
    children: ReactNode;
    fullWidth?: boolean;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
    spacing?: number;
}

const ContentSection = ({
    children,
    fullWidth = false,
    maxWidth = 'lg',
    spacing = 3,
}: ContentSectionProps) => {
    const content = (
        <Grid container spacing={spacing}>
            {children}
        </Grid>
    );

    if (fullWidth) {
        return <Box sx={{ px: 3 }}>{content}</Box>;
    }

    return <Container maxWidth={maxWidth}>{content}</Container>;
};

interface MainContentProps {
    children?: ReactNode;
}

export const MainContent = ({ children }: MainContentProps) => {
    const theme = useTheme();
    const { isMobile } = useLayout();

    return (
        <MainContentRoot>
            <ScrollWrapper
                sx={{
                    px: isMobile ? 1 : 2,
                    [theme.breakpoints.up('lg')]: {
                        px: 3,
                    },
                }}
            >
                {children}
            </ScrollWrapper>
        </MainContentRoot>
    );
};

// Export ContentSection as a named export and as a property of MainContent
export { ContentSection };
MainContent.Section = ContentSection;

// Grid item components for different sizes
const GridItem = styled(Grid)({
    display: 'flex',
    flexDirection: 'column',
});

export const ContentItem = {
    Full: ({ children, ...props }: { children: ReactNode;[key: string]: any }) => (
        <GridItem item xs={12} {...props}>
            {children}
        </GridItem>
    ),
    Half: ({ children, ...props }: { children: ReactNode;[key: string]: any }) => (
        <GridItem item xs={12} md={6} {...props}>
            {children}
        </GridItem>
    ),
    Third: ({ children, ...props }: { children: ReactNode;[key: string]: any }) => (
        <GridItem item xs={12} md={4} {...props}>
            {children}
        </GridItem>
    ),
    Quarter: ({ children, ...props }: { children: ReactNode;[key: string]: any }) => (
        <GridItem item xs={12} sm={6} md={3} {...props}>
            {children}
        </GridItem>
    ),
    Custom: GridItem,
};