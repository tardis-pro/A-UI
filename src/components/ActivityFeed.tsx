import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../services/websocket';
import ActivityFeedItem from './ActivityFeedItem';

interface ActivityFeedProps {
    initialActivities: any[]; // Replace 'any' with the actual type of activity
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ initialActivities }) => {
    const [activities, setActivities] = useState(initialActivities);
    const { registerHandler, unregisterHandler } = useWebSocket();

    useEffect(() => {
        const handleActivity = (activity: any) => {
            setActivities((prevActivities) => [...prevActivities, activity]);
        };

        registerHandler('activity', handleActivity);
        registerHandler('notification', handleNotification);

        return () => {
            unregisterHandler('activity');
            unregisterHandler('notification');
        };
    }, [registerHandler, unregisterHandler]);

    const handleNotification = (notification: any) => {
        setActivities((prevActivities) => [...prevActivities, notification]);
    };

    return (
        <div>
            <h2>Activity Feed</h2>
            <ul>
                {activities.map((activity) => (
                    <ActivityFeedItem key={activity.id} activity={activity} />
                ))}
            </ul>
        </div>
    );
};

export default ActivityFeed;