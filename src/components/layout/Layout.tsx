import { Box, styled } from '@mui/material';
import { ReactNode } from 'react';
import { useLayout } from './LayoutContext';

const LayoutRoot = styled(Box)(({ theme }) => ({
    display: 'flex',
    minHeight: '100vh',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.default
}));

const LayoutContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'row',
    width: '100%',
    transition: theme.transitions.create('padding', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
}));

const MainContentWrapper = styled(Box)(({ theme }) => ({
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '100%',
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
}));

interface LayoutProps {
    leftSidebar?: ReactNode;
    rightSidebar?: ReactNode;
    children?: ReactNode;
}

export const Layout = ({ leftSidebar, rightSidebar, children }: LayoutProps) => {
    const { leftSidebarOpen, rightSidebarOpen, isMobile } = useLayout();

    const leftSidebarWidth = 280;
    const rightSidebarWidth = 320;

    return (
        <LayoutRoot>
            <LayoutContainer>
                {leftSidebar && (
                    <Box
                        component="nav"
                        sx={{
                            flexShrink: 0,
                            width: leftSidebarOpen ? leftSidebarWidth : 0,
                            transition: theme => theme.transitions.create('width', {
                                duration: theme.transitions.duration.enteringScreen,
                                easing: theme.transitions.easing.sharp,
                            }),
                            overflow: 'hidden',
                            borderRight: theme => `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        {leftSidebar}
                    </Box>
                )}

                <MainContentWrapper
                    sx={{
                        ml: isMobile ? 0 : (leftSidebarOpen ? `${leftSidebarWidth}px` : 0),
                        mr: isMobile ? 0 : (rightSidebarOpen ? `${rightSidebarWidth}px` : 0),
                    }}
                >
                    {children}
                </MainContentWrapper>

                {rightSidebar && (
                    <Box
                        component="aside"
                        sx={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: rightSidebarOpen ? rightSidebarWidth : 0,
                            transition: theme => theme.transitions.create('width', {
                                duration: theme.transitions.duration.enteringScreen,
                                easing: theme.transitions.easing.sharp,
                            }),
                            overflow: 'hidden',
                            borderLeft: theme => `1px solid ${theme.palette.divider}`,
                            bgcolor: 'background.paper',
                        }}
                    >
                        {rightSidebar}
                    </Box>
                )}
            </LayoutContainer>
        </LayoutRoot>
    );
};