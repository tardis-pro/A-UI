import React from 'react';

interface ActivityFeedItemProps {
    activity: any; // Replace 'any' with the actual type of activity
}

const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ activity }) => {
    return (
        <div>
            <p>{activity.message}</p>
            <small>{activity.timestamp}</small>
        </div>
    );
};

export default ActivityFeedItem;