import { FC } from 'react';
import {
    Breadcrumbs as MUIBreadcrumbs,
    Link,
    Typography,
    Box
} from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { useNavigation } from './NavigationContext';

export const Breadcrumbs: FC = () => {
    const { state, navigate } = useNavigation();

    const pathSegments = state.currentPath
        .split('/')
        .filter(Boolean)
        .reduce<Array<{ label: string; path: string }>>((acc, segment, index, arr) => {
            const path = '/' + arr.slice(0, index + 1).join('/');
            const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            return [...acc, { path, label }];
        }, []);

    if (pathSegments.length === 0) {
        return null;
    }

    return (
        <Box sx={{ p: 2 }}>
            <MUIBreadcrumbs
                separator={<NavigateNext fontSize="small" />}
                aria-label="breadcrumb"
            >
                <Link
                    component="button"
                    variant="body1"
                    color="inherit"
                    onClick={() => navigate('/')}
                    sx={{ textDecoration: 'none', cursor: 'pointer' }}
                >
                    Home
                </Link>
                {pathSegments.map((segment, index) => {
                    const isLast = index === pathSegments.length - 1;
                    return isLast ? (
                        <Typography
                            key={segment.path}
                            color="text.primary"
                            variant="body1"
                        >
                            {segment.label}
                        </Typography>
                    ) : (
                        <Link
                            key={segment.path}
                            component="button"
                            variant="body1"
                            color="inherit"
                            onClick={() => navigate(segment.path)}
                            sx={{ textDecoration: 'none', cursor: 'pointer' }}
                        >
                            {segment.label}
                        </Link>
                    );
                })}
            </MUIBreadcrumbs>
        </Box>
    );
};