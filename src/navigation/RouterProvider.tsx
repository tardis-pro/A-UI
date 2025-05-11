import { FC, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import routes, { RouteConfig } from './routes';
import { useNavigation } from './NavigationContext';
import { Layout } from '../components/layout';
import { NavigationMenu } from './NavigationMenu';
import { Breadcrumbs } from './Breadcrumbs';

const LoadingFallback: FC = () => (
    <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
    >
        <CircularProgress />
    </Box>
);

interface ProtectedRouteProps {
    component: RouteConfig['component'];
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ component: Component }) => {
    // TODO: Replace with actual auth check
    const isAuthenticated = true;

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <Suspense fallback={<LoadingFallback />}>
            <Component />
        </Suspense>
    );
};

const renderRoutes = (routeConfigs: RouteConfig[]) => {
    return routeConfigs.map(route => (
        <Route
            key={route.path}
            path={route.path}
            element={
                route.isProtected ? (
                    <ProtectedRoute component={route.component} />
                ) : (
                    <Suspense fallback={<LoadingFallback />}>
                        <route.component />
                    </Suspense>
                )
            }
        >
            {route.children && renderRoutes(route.children)}
        </Route>
    ));
};

export const RouterProvider: FC = () => {
    return (
        <BrowserRouter>
            <Layout
                leftSidebar={<NavigationMenu />}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Breadcrumbs />
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        <Routes>
                            {renderRoutes(routes)}
                            <Route
                                path="*"
                                element={<Navigate to="/" replace />}
                            />
                        </Routes>
                    </Box>
                </Box>
            </Layout>
        </BrowserRouter>
    );
};