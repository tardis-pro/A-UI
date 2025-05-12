import { FC, useState } from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Divider
} from '@mui/material';
import {
    ExpandLess,
    ExpandMore,
    Dashboard,
    Code,
    Assessment,
    History,
    Star
} from '@mui/icons-material';
import { useNavigation } from './NavigationContext';

interface NavItem {
    path: string;
    label: string;
    icon: JSX.Element;
    children?: NavItem[];
}

const navigationItems: NavItem[] = [
    {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <Dashboard />,
    },
    {
        path: '/code',
        label: 'Code',
        icon: <Code />,
        children: [
            { path: '/code/search', label: 'Search', icon: <Code /> },
            { path: '/code/assistant', label: 'Assistant', icon: <Code /> },
        ],
    },
    {
        path: '/metrics',
        label: 'Metrics',
        icon: <Assessment />,
    },
];

interface NavigationMenuItemProps {
    item: NavItem;
    level?: number;
}

const NavigationMenuItem: FC<NavigationMenuItemProps> = ({ item, level = 0 }) => {
    const [open, setOpen] = useState(false);
    const { state, navigate } = useNavigation();
    const hasChildren = item.children && item.children.length > 0;
    const isActive = state.currentPath === item.path;

    const handleClick = () => {
        if (hasChildren) {
            setOpen(!open);
        } else {
            navigate(item.path);
        }
    };

    return (
        <>
            <ListItem
                disablePadding
                sx={{ pl: level * 2 }}
            >
                <ListItemButton
                    selected={isActive}
                    onClick={handleClick}
                >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                    {hasChildren && (open ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
            </ListItem>
            {hasChildren && item.children && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {item.children.map((child) => (
                            <NavigationMenuItem
                                key={child.path}
                                item={child}
                                level={level + 1}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

export const NavigationMenu: FC = () => {
    const { state, navigate } = useNavigation();

    return (
        <List component="nav">
            {navigationItems.map((item) => (
                <NavigationMenuItem key={item.path} item={item} />
            ))}

            {state.favorites.length > 0 && (
                <>
                    <Divider />
                    <ListItem>
                        <ListItemText primary="Favorites" />
                    </ListItem>
                    {state.favorites.map((path) => (
                        <ListItem key={path} disablePadding>
                            <ListItemButton onClick={() => navigate(path)}>
                                <ListItemIcon>
                                    <Star />
                                </ListItemIcon>
                                <ListItemText primary={path.split('/').pop()} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </>
            )}

            {state.recentItems.length > 0 && (
                <>
                    <Divider />
                    <ListItem>
                        <ListItemText primary="Recent" />
                    </ListItem>
                    {state.recentItems.map((path) => (
                        <ListItem key={path} disablePadding>
                            <ListItemButton onClick={() => navigate(path)}>
                                <ListItemIcon>
                                    <History />
                                </ListItemIcon>
                                <ListItemText primary={path.split('/').pop()} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </>
            )}
        </List>
    );
};