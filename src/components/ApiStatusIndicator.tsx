import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';

interface ApiStatusIndicatorProps {
    showDetails?: boolean;
    className?: string;
}

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({
    showDetails = false,
    className = '',
}) => {
    const {
        isConnected,
        wsConnected,
        loading,
        lastSync,
        pendingRequests,
    } = useSelector((state: RootState) => state.api);

    const activeLoadingRequests = Object.values(loading).filter(Boolean).length;

    const status = useMemo(() => {
        if (!isConnected) return 'disconnected';
        if (activeLoadingRequests > 0) return 'loading';
        if (wsConnected) return 'connected';
        return 'partial';
    }, [isConnected, wsConnected, activeLoadingRequests]);

    const statusClass = `api-status api-status--${status}`;

    if (!showDetails) {
        return (
            <div className={`api-status-indicator ${className}`}>
                <span className={statusClass} title={`API Status: ${status}`} />
            </div>
        );
    }

    return (
        <div className={`api-status-indicator api-status-indicator--detailed ${className}`}>
            <div className={statusClass}>
                <span className="api-status__icon" />
                <span className="api-status__label">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            </div>

            {showDetails && (
                <div className="api-status__details">
                    <div className="api-status__item">
                        <span>API Connection:</span>
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="api-status__item">
                        <span>WebSocket:</span>
                        <span>{wsConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    {activeLoadingRequests > 0 && (
                        <div className="api-status__item">
                            <span>Active Requests:</span>
                            <span>{activeLoadingRequests}</span>
                        </div>
                    )}
                    {lastSync && (
                        <div className="api-status__item">
                            <span>Last Sync:</span>
                            <span>{new Date(lastSync).toLocaleTimeString()}</span>
                        </div>
                    )}
                    {pendingRequests.length > 0 && (
                        <div className="api-status__item">
                            <span>Pending:</span>
                            <ul className="api-status__pending">
                                {pendingRequests.map((req) => (
                                    <li key={req}>{req}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// CSS styles for the indicator
const styles = `
.api-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.api-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.api-status__icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.api-status--connected {
  background-color: rgba(0, 200, 0, 0.1);
}

.api-status--connected .api-status__icon {
  background-color: #00c800;
}

.api-status--disconnected {
  background-color: rgba(255, 0, 0, 0.1);
}

.api-status--disconnected .api-status__icon {
  background-color: #ff0000;
}

.api-status--loading {
  background-color: rgba(255, 165, 0, 0.1);
}

.api-status--loading .api-status__icon {
  background-color: #ffa500;
  animation: pulse 1.5s infinite;
}

.api-status--partial {
  background-color: rgba(255, 165, 0, 0.1);
}

.api-status--partial .api-status__icon {
  background-color: #ffa500;
}

.api-status__details {
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.05);
  font-size: 12px;
}

.api-status__item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 4px;
}

.api-status__pending {
  margin: 4px 0;
  padding-left: 16px;
  list-style-type: none;
  font-size: 11px;
  color: #666;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
`;

// Create style element
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default ApiStatusIndicator;