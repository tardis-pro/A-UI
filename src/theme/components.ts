import { Components, Theme } from '@mui/material';

export const components = (theme: Theme): Components => ({
    MuiCssBaseline: {
        styleOverrides: {
            body: {
                scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.paper}`,
                '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
                    width: 8,
                    height: 8,
                    backgroundColor: theme.palette.background.paper,
                },
                '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
                    borderRadius: 8,
                    backgroundColor: theme.palette.primary.main,
                },
            },
        },
    },
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 500,
            },
            contained: {
                boxShadow: 'none',
                '&:hover': {
                    boxShadow: 'none',
                },
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: 12,
                boxShadow: theme.shadows[2],
            },
        },
    },
    MuiPaper: {
        styleOverrides: {
            rounded: {
                borderRadius: 12,
            },
        },
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                },
            },
        },
    },
    MuiAppBar: {
        styleOverrides: {
            root: {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                boxShadow: theme.shadows[2],
            },
        },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                backgroundColor: theme.palette.background.default,
            },
        },
    },
    MuiChip: {
        styleOverrides: {
            root: {
                borderRadius: 16,
            },
        },
    },
    MuiListItem: {
        styleOverrides: {
            root: {
                borderRadius: 8,
                '&.Mui-selected': {
                    backgroundColor: `${theme.palette.primary.main}14`,
                },
            },
        },
    },
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                backgroundColor: theme.palette.grey[800],
                fontSize: '0.75rem',
            },
        },
    },
});