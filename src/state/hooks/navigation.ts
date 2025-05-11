import React from 'react';
import { useAppDispatch } from './core';
import { setCurrentPath } from '../slices/navigationSlice';

export const useSyncURL = () => {
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        const handleLocationChange = () => {
            const path = window.location.pathname;
            dispatch(setCurrentPath(path));
        };

        window.addEventListener('popstate', handleLocationChange);
        handleLocationChange();

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
        };
    }, [dispatch]);
};