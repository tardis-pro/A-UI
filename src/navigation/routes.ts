import { ReactNode, lazy } from 'react';

export interface RouteConfig {
    path: string;
    component: React.LazyExoticComponent<React.ComponentType<any>>;
    label: string;
    icon?: ReactNode;
    children?: RouteConfig[];
    isProtected?: boolean;
}

const routes: RouteConfig[] = [
    {
        path: '/',
        component: lazy(() => import('../LandingPage')),
        label: 'Home'
    },
    {
        path: '/dashboard',
        component: lazy(() => import('../components/MainContent')),
        label: 'Dashboard',
        isProtected: true
    },
    {
        path: '/code',
        component: lazy(() => import('../components/CodeAssistant')),
        label: 'Code',
        isProtected: true,
        children: [
            {
                path: '/code/assistant',
                component: lazy(() => import('../components/CodeAssistant')),
                label: 'Assistant'
            }
        ]
    },
    {
        path: '/knowledge',
        component: lazy(() => import('../components/KnowledgeBase')),
        label: 'Knowledge Base',
        isProtected: true
    }
];

export const getRouteByPath = (path: string): RouteConfig | undefined => {
    const findRoute = (routes: RouteConfig[], targetPath: string): RouteConfig | undefined => {
        for (const route of routes) {
            if (route.path === targetPath) return route;
            if (route.children) {
                const childRoute = findRoute(route.children, targetPath);
                if (childRoute) return childRoute;
            }
        }
        return undefined;
    };

    return findRoute(routes, path);
};

export const getAllPaths = (): string[] => {
    const paths: string[] = [];

    const collectPaths = (routes: RouteConfig[]) => {
        for (const route of routes) {
            paths.push(route.path);
            if (route.children) {
                collectPaths(route.children);
            }
        }
    };

    collectPaths(routes);
    return paths;
};

export default routes;