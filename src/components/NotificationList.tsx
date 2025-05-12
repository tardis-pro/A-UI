import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { NotificationEvent } from '../types/notification';

const NotificationList: React.FC = () => {
    const notifications = useSelector((state: RootState) => state.notification.notifications);

    return (
        <div>
            <h2>Notifications</h2>
            <ul>
                {notifications.map((notification) => (
                    <li key={notification.id}>
                        {notification.message}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NotificationList;