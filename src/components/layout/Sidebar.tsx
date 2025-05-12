import {
    Box,
    List,
    Typography,
    Divider,
    IconButton,
    styled,
    alpha,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { ReactNode } from 'react';

const SidebarRoot = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.palette.background.paper,
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2),
    justifyContent: 'space-between',
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
}));

const SidebarSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2, 1),
}));

interface SidebarSectionProps {
    title: string;
    children: ReactNode;
}

const Section = ({ title, children }: SidebarSectionProps) => (
    <SidebarSection>
        <Typography
            variant="overline"
            color="textSecondary"
            sx={{ px: 1, mb: 1, display: 'block' }}
        >
            {title}
        </Typography>
        <List dense disablePadding>
            {children}
        </List>
    </SidebarSection>
);

interface SidebarProps {
    position?: 'left' | 'right';
    onToggle?: () => void;
    isOpen?: boolean;
    title?: string;
    children?: ReactNode;
}

export const Sidebar = ({
    position = 'left',
    onToggle,
    isOpen = true,
    title = '',
    children
}: SidebarProps) => {
    return (
        <SidebarRoot>
            <SidebarHeader>
                <Typography variant="h6" color="textPrimary">
                    {title}
                </Typography>
                <IconButton onClick={onToggle} size="small">
                    {position === 'left' ? (
                        isOpen ? <ChevronLeft /> : <ChevronRight />
                    ) : (
                        isOpen ? <ChevronRight /> : <ChevronLeft />
                    )}
                </IconButton>
            </SidebarHeader>
            <Divider />
            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                {children}
            </Box>
        </SidebarRoot>
    );
};

// Export Section component for use in sidebars
Sidebar.Section = Section;